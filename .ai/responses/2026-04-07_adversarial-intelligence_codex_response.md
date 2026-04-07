# Codex Response - Adversarial Intelligence Procurement

## Veredicto

La idea es buena, pero **solo cabe en 8 dias si la reduces a una subasta de second-opinion muy minima**:

- Bobby publica bounty on-chain
- agentes hacen **commit on-chain** del hash de su tesis
- la tesis completa vive **off-chain** via MCP/API
- Bobby evalua off-chain con una rubrica fija
- Bobby liquida **1 ganador** on-chain
- el delta de conviction queda on-chain como evento

Si intentas hacer reputacion, whitelist dinamica, IPFS obligatorio, multi-winner, o integracion dura con Soulink/Bond.credit, te vas a salir del plan base.

## P0 Red Flags

1. **`0.001 OKB` es probablemente muy poco incentivo real.**
   - Para hackathon sirve como prueba de flujo.
   - Para mercado real, no. Si el agente tiene que correr inference + 1-2 txs + MCP call, el reward se ve simbólico.
   - Para demo, yo subiria el reward del bounty a `0.005-0.02 OKB` y dejaria claro que el fee de venta y el fee de procurement son distintos.

2. **La evaluacion off-chain nunca va a ser trustless en 8 dias.**
   - No trates de venderla como descentralizada.
   - Vendela como: `transparent, auditable, replayable`.

3. **Si Bobby puede siempre elegir ganador arbitrariamente, los agentes no tienen razon para participar.**
   - Necesitas una regla explicita de `award` vs `no-award`.
   - Tambien necesitas una rubrica precommitteada.

4. **Si las respuestas se hacen publicas antes del deadline, copian al primero.**
   - Para MVP: `commit on-chain`, `reveal off-chain`, publicar todo solo al final.

## P1 Red Flags

1. **No lo metas dentro de [BobbyAgentEconomy.sol](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/contracts/src/BobbyAgentEconomy.sol).**
   - Ese contrato hoy solo es ledger de pagos simples en [contracts/src/BobbyAgentEconomy.sol](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/contracts/src/BobbyAgentEconomy.sol#L129).
   - Bounties tienen otro lifecycle: escrow, submissions, settlement, refunds, no-award.

2. **No hagas reveal on-chain.**
   - Quema gas.
   - Filtra tesis.
   - No mejora judgeability lo suficiente.

3. **No dependas de Bond.credit o Soulink para gating del MVP.**
   - Puedes aceptar sus IDs como metadata.
   - No conviertas eso en dependencia operacional.

## Arquitectura recomendada

### Contrato

Haz un contrato separado: `BobbyAdversarialBounties`.

Razon:

- separa el riesgo del plan base de selling
- reduce superficie de auditoria
- evita re-deploy o re-testear todo `EconomyV2`
- te deja iterar Judge Mode sin tocar el fee rail principal

### Modelo minimo

Un bounty tiene:

- `reward` en OKB escroweado por Bobby
- `questionHash`
- `contextHash`
- `rubricHash`
- `submissionDeadline`
- `reviewDeadline`
- `convictionBefore`
- `convictionAfter`
- `evaluationHash`
- `decisionHash`
- `winner`

Una submission tiene:

- `responder`
- `responseHash`
- `bond`
- `submittedAt`
- `revealedOffchain`
- `refunded`

## Interface propuesta

```solidity
enum BountyStatus { OPEN, REVIEW, AWARDED, EXPIRED, CANCELED }

struct Bounty {
    address creator;
    uint96 reward;
    uint64 createdAt;
    uint64 submissionDeadline;
    uint64 reviewDeadline;
    uint8 convictionBefore;
    uint8 convictionAfter;
    uint32 submissionCount;
    BountyStatus status;
    bytes32 questionHash;
    bytes32 contextHash;
    bytes32 rubricHash;
    bytes32 evaluationHash;
    bytes32 decisionHash;
    bytes32 winningResponseHash;
    address winner;
}

struct Submission {
    bytes32 responseHash;
    uint96 bond;
    uint64 submittedAt;
    bool revealedOffchain;
    bool refunded;
}

function createBounty(
    bytes32 questionHash,
    bytes32 contextHash,
    bytes32 rubricHash,
    uint64 submissionDeadline,
    uint64 reviewDeadline,
    uint8 convictionBefore
) external payable returns (uint256 bountyId);

function submitResponseCommit(
    uint256 bountyId,
    bytes32 responseHash
) external payable;

function markRevealedOffchain(
    uint256 bountyId,
    address responder
) external;

function awardBounty(
    uint256 bountyId,
    address winner,
    bytes32 winningResponseHash,
    bytes32 evaluationHash,
    bytes32 decisionHash,
    uint8 convictionAfter
) external;

function refundBond(uint256 bountyId) external;

function reclaimExpiredBounty(uint256 bountyId) external;
```

### Eventos

```solidity
event BountyCreated(
    uint256 indexed bountyId,
    address indexed creator,
    uint256 reward,
    bytes32 indexed questionHash,
    bytes32 contextHash,
    bytes32 rubricHash,
    uint64 submissionDeadline,
    uint64 reviewDeadline,
    uint8 convictionBefore
);

event ResponseCommitted(
    uint256 indexed bountyId,
    address indexed responder,
    bytes32 indexed responseHash,
    uint256 bond
);

event ResponseRevealedOffchain(
    uint256 indexed bountyId,
    address indexed responder,
    bytes32 indexed responseHash
);

event BountyAwarded(
    uint256 indexed bountyId,
    address indexed winner,
    bytes32 indexed winningResponseHash,
    bytes32 evaluationHash,
    bytes32 decisionHash,
    uint8 convictionBefore,
    uint8 convictionAfter,
    uint256 reward
);

event BountyExpired(uint256 indexed bountyId);
event BondRefunded(uint256 indexed bountyId, address indexed responder, uint256 amount);
```

## Decision concreta sobre el contrato

**Separado. No extension de EconomyV2.**

Si quieres unirlos despues, hazlo por UI/analytics, no por bytecode.

`EconomyV2` se queda para:

- `payMCPCall`
- revenue de Bobby
- stats de selling

`Bounty` contract se queda para:

- escrow de procurement
- commits
- settlement de second opinions

## Anti-spam en 8 dias

### La mejor combinacion MVP

1. **Bond minimo del respondedor**
2. **Una submission por address por bounty**
3. **Cap de submissions por bounty**
4. **Refund solo si hizo reveal off-chain valido**

Eso es suficiente para hackathon.

### Parametros concretos

- `minResponderBond = 0.0002 OKB`
- `maxSubmissionsPerBounty = 8` o `16`
- `1 submission por address`
- `submission window = 30-90 min`
- `review window = 30-120 min`

### Que NO haria

- whitelist cerrada
- reputacion on-chain real
- sybil resistance sofisticada
- score gating con Bond.credit

Eso es v2.

### Regla simple

- si un address hace commit pero no manda reveal off-chain valido antes del deadline, pierde bond
- si manda reveal valido y no gana, recupera bond
- si gana, recibe `reward + bond`

Eso desalienta basura sin matar apertura.

## Evaluacion off-chain confiable

### Lo correcto para hackathon

No IPFS-first. No Arweave-first.

Haz esto:

1. **Rubrica fija precommitteada**
   - `rubricHash` se guarda al crear el bounty
   - ejemplo: `novelty 40 / evidence 30 / contradiction strength 20 / execution relevance 10`

2. **Evaluation package publico**
   - JSON publico en `/api/judge/bounties/:id`
   - incluye prompt, rubric version, submissions, scores, winner, reasoning, conviction before/after

3. **`evaluationHash` on-chain**
   - `keccak256(canonical JSON)`

4. **`decisionHash` on-chain**
   - hash del decision package final de Bobby

### Suficiente para jueces AI

Si publicas:

- `evaluationHash` on-chain
- `decisionHash` on-chain
- JSON completo publico y estable
- explorer links

ya es suficientemente verificable para hackathon.

IPFS es nice-to-have, no blocker.

## Paquete de evaluacion recomendado

```json
{
  "bountyId": 12,
  "questionHash": "0x...",
  "rubricVersion": "bounty-v1",
  "model": "claude-sonnet",
  "convictionBefore": 8,
  "convictionAfter": 5,
  "winner": "0xabc...",
  "winningResponseHash": "0xdef...",
  "decision": "no_trade",
  "submissions": [
    {
      "responder": "0xabc...",
      "responseHash": "0xdef...",
      "scores": {
        "novelty": 9,
        "evidence": 8,
        "contradiction": 9,
        "execution_relevance": 8
      },
      "summary": "Whale flow and funding divergence invalidated Bobby's long."
    }
  ]
}
```

## Discovery y MCP flow

### Lo mas practico

Haz las 3 capas, pero con responsabilidades distintas:

1. **Evento on-chain**
   - fuente canonica para jueces
   - `BountyCreated`

2. **`bobby_bounties`**
   - discovery ergonomico para otros agentes

3. **`bobby_submit_counter_thesis`**
   - reveal off-chain de la tesis completa

### No hagas solo una

- solo evento on-chain: malo para DX
- solo MCP: malo para judgeability

### Flujo recomendado

1. Bobby crea bounty on-chain
2. Agente externo llama `bobby_bounties`
3. Agente computa `responseHash` localmente
4. Agente hace `submitResponseCommit(bountyId, responseHash)` on-chain con bond
5. Agente llama `bobby_submit_counter_thesis` con:
   - `bountyId`
   - `response`
   - `responseHash`
   - `txHash`
   - `wallet`
   - `agentName`
   - `evidenceLinks`
6. Bobby verifica que:
   - el tx existe
   - el commit corresponde a `responseHash`
   - el sender coincide con `wallet`
7. Bobby marca `revealedOffchain=true`
8. Al cierre, Bobby evalua y llama `awardBounty(...)`

## Tools MCP minimos

- `bobby_bounties`
- `bobby_submit_counter_thesis`
- `bobby_bounty_status`

Nada mas.

No metas un protocolo de subastas entero.

## Relacion con ConvictionOracle

No cambies el oracle para MVP.

[BobbyConvictionOracle.sol](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/contracts/BobbyConvictionOracle.sol) ya publica `SignalPublished(..., debateHash)` en [contracts/BobbyConvictionOracle.sol](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/contracts/BobbyConvictionOracle.sol#L63).

Usa eso a tu favor:

- `decisionHash` del bounty = `debateHash` del signal publish final

Asi conectas:

- bounty creation
- submissions
- award
- final oracle update

sin tocar el contrato del oracle.

## Plan realista de 8 dias

### Regla dura

**Si para el final del Dia 5 no esta vivo `bobby_analyze` paid + ConvictionOracle + Judge Mode, NO metas bounties.**

### Mi plan

#### Dia 1-5

No cambies nada del plan base.

#### Dia 6

Reemplaza parte del trabajo de `bobby_debate` por bounty MVP:

- contrato `BobbyAdversarialBounties`
- tool `bobby_bounties`
- tool `bobby_submit_counter_thesis`
- tabla `bounty_submissions`
- public judge endpoint

#### Dia 7

- seed contrarian agent
- verify script del bounty flow
- docs + explorer links

#### Dia 8

- video
- dry runs
- fallback paths

### Si tienes que sacrificar algo

Sacrifica **hardening de `bobby_debate`**, no:

- `bobby_analyze`
- ConvictionOracle
- Judge Mode

`bobby_debate` es showpiece.
El procurement bidireccional es diferenciador.

## Que version minima si cabe

### Ship this

- 1 contrato separado
- 1 reward escrow
- 1 winner
- 1 responder bond
- 1 MCP discovery tool
- 1 MCP submit tool
- 1 public evaluation JSON
- 1 bootstrap contrarian agent

### Do not ship

- multi-winner
- slashing complejo
- score reputation
- arbitration decentralizada
- IPFS obligatorio
- hidden order books
- bonding curves
- agent registry hard dependency

## Que pasa si nadie responde

Si, corre tu propio contrarian agent.

**No es trampa si lo dices claramente.**

Presentalo como:

- `bootstrap responder`
- `reference agent`
- `first-party seeded counterparty`

No lo presentes como adoption organica.

### Mejor practica

- wallet separado
- nombre separado
- prompt separado
- repo o script separado
- `x-agent-name` distinto

Idealmente consigue 1 partner o amigo que corra otro responder desde otra wallet. Pero si no, con uno first-party basta para probar el flujo.

## La parte fundamentalmente rota si no la corriges

1. **Reward demasiado bajo**
2. **Rubrica no precommitteada**
3. **Sin regla de no-award**
4. **Sin bond / sin cap / sin one-per-address**
5. **Querer hacerlo synchronous dentro del trade request**

Este flow debe ser **asincrono**.

Bobby crea bounty antes de ejecutar.
Bobby evalua despues del deadline.
Bobby luego ejecuta trade o se abstiene.

No intentes hacer todo eso dentro de un request Vercel de 60s.

## Mi recomendacion final

Shippea esto solo como:

**"Bobby not only sells intelligence on X Layer. Before executing a trade, Bobby can open an on-chain adversarial bounty and pay the external agent that most improved his decision."**

Eso es nuevo, verificable, y no te rompe el submission base.

Pero hazlo solo en version minima:

- separado
- abierto con bond
- off-chain judged, on-chain settled
- 1 winner
- 1 bootstrap responder

Eso si cabe.
