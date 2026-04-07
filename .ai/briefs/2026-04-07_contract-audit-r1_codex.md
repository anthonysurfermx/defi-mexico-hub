# Brief para Codex — Smart Contract Security Audit (Round 1)

> **Instrucciones**: Copia este brief y pégalo en Codex. Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto
**Proyecto**: Bobby Protocol — Intelligence Protocol on X Layer (Chain 196)
**Hackathon**: Build X Season 2, deadline 15 abril
**Chain**: OKX X Layer (Chain 196), EVM compatible, OKB nativo
**Compiler**: Solidity ^0.8.19

Estamos deployando un nuevo contrato `BobbyAgentEconomyV2` que reemplaza al V1. El cambio principal es agregar `challengeId` a `payMCPCall` para prevenir replay de txHash. También tenemos `BobbyConvictionOracle` ya deployado (auditado una vez por Gemini). Ambos contratos manejan fondos reales en OKB.

## Contratos a Auditar

### 1. BobbyAgentEconomyV2 (NUEVO — no deployado aún)

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

/// @title BobbyAgentEconomyV2 — Replay-resistant MCP payment protocol
/// @notice Adds challengeId to payMCPCall to prevent tx replay.
///         Each payment is tied to a unique challenge created by the backend.
///         Deployed on OKX X Layer (Chain 196).
/// @dev Breaking change from V1: payMCPCall now requires a bytes32 challengeId.

contract BobbyAgentEconomyV2 {
    // ---- Events ----
    event MCPPayment(
        address indexed payer,
        bytes32 indexed challengeId,
        string toolName,
        uint256 amount,
        uint256 timestamp
    );

    event DebateFee(
        bytes32 indexed debateHash,
        address indexed payer,
        address indexed recipient,
        uint256 amount,
        uint256 timestamp
    );

    event Withdrawal(address indexed to, uint256 amount);

    // ---- State ----
    address public immutable owner;
    address public immutable alphaHunter;
    address public immutable redTeam;
    address public immutable cio;

    uint256 public mcpCallFee = 0.001 ether;          // 0.001 OKB
    uint256 public debateFeePerAgent = 0.0001 ether;   // 0.0001 OKB per agent

    uint256 public totalMCPCalls;
    uint256 public totalDebates;
    uint256 public totalVolume;

    /// @notice Tracks consumed challengeIds to prevent replay
    mapping(bytes32 => bool) public challengeConsumed;

    // ---- Constructor ----
    constructor(address _alphaHunter, address _redTeam, address _cio) {
        owner = msg.sender;
        alphaHunter = _alphaHunter;
        redTeam = _redTeam;
        cio = _cio;
    }

    // ---- Modifiers ----
    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    // ---- MCP Payment (replay-resistant) ----
    function payMCPCall(bytes32 challengeId, string calldata toolName) external payable {
        require(msg.value >= mcpCallFee, "Insufficient MCP fee");
        require(challengeId != bytes32(0), "Invalid challengeId");
        require(!challengeConsumed[challengeId], "Challenge already consumed");

        challengeConsumed[challengeId] = true;

        totalMCPCalls++;
        totalVolume += msg.value;

        emit MCPPayment(msg.sender, challengeId, toolName, msg.value, block.timestamp);
    }

    // ---- Debate Fee (internal agent economy) ----
    function payDebateFee(bytes32 debateHash) external payable {
        require(msg.value >= debateFeePerAgent * 2, "Insufficient debate fee");

        (bool s1,) = alphaHunter.call{value: debateFeePerAgent}("");
        require(s1, "Alpha payment failed");

        (bool s2,) = redTeam.call{value: debateFeePerAgent}("");
        require(s2, "Red Team payment failed");

        totalDebates++;
        totalVolume += debateFeePerAgent * 2;

        emit DebateFee(debateHash, msg.sender, alphaHunter, debateFeePerAgent, block.timestamp);
        emit DebateFee(debateHash, msg.sender, redTeam, debateFeePerAgent, block.timestamp);

        if (msg.value > debateFeePerAgent * 2) {
            (bool s3,) = msg.sender.call{value: msg.value - debateFeePerAgent * 2}("");
            require(s3, "Refund failed");
        }
    }

    // ---- Views ----
    function isChallengeConsumed(bytes32 challengeId) external view returns (bool) {
        return challengeConsumed[challengeId];
    }

    function getStats() external view returns (
        uint256 _totalMCPCalls,
        uint256 _totalDebates,
        uint256 _totalVolume
    ) {
        return (totalMCPCalls, totalDebates, totalVolume);
    }

    // ---- Admin ----
    function updateFees(uint256 _mcpFee, uint256 _debateFee) external onlyOwner {
        mcpCallFee = _mcpFee;
        debateFeePerAgent = _debateFee;
    }

    function withdraw() external onlyOwner {
        uint256 bal = address(this).balance;
        require(bal > 0, "No balance");
        (bool s,) = owner.call{value: bal}("");
        require(s, "Withdraw failed");
        emit Withdrawal(owner, bal);
    }

    receive() external payable {}
}
```

### 2. BobbyConvictionOracle (YA DEPLOYADO — review de interacción)

Key functions relevantes para la interacción con EconomyV2:
- `publishSignal(SignalInput calldata)` — solo callable por `bobby` o `owner`
- `getConviction(string calldata)` — public view, returns direction/conviction/entryPrice/isActive
- Uses 2-step ownership transfer
- Has pause mechanism
- Has signal cooldown (10 min)

(Código completo disponible pero lo omito por brevedad — ya fue auditado en marzo 2026 por Gemini)

## Contexto de Interacción

El flow end-to-end es:
1. Agente externo llama MCP `tools/call(bobby_analyze)`
2. Backend crea un `challengeId` (UUID → bytes32) y lo guarda en Supabase con status `pending`
3. Backend responde 402 con challengeId + contrato + precio
4. Agente paga `payMCPCall(challengeId, "bobby_analyze")` en X Layer
5. Agente re-intenta con txHash + challengeId
6. Backend verifica on-chain: tx existe, challengeId matches, not consumed
7. Backend marca challenge como `consumed` en Supabase
8. Backend ejecuta tool y devuelve resultado + proof object

## Preguntas Específicas de Auditoría

### P0 — Seguridad Crítica
1. **¿El challengeId elimina completamente el replay?** El challengeId se marca como consumed on-chain. Pero el backend también necesita marcarlo en Supabase. ¿Hay race conditions si dos requests llegan con el mismo txHash antes de que el primero confirme on-chain?
2. **¿Hay forma de que un atacante genere su propio challengeId válido?** El backend genera UUIDs, los convierte a bytes32 y los guarda en Supabase. El contrato acepta cualquier bytes32 que no haya sido consumido. ¿Un atacante podría llamar `payMCPCall` con un challengeId random y luego reclamar el servicio?
3. **¿Los low-level calls en payDebateFee son seguros?** Hacen `.call{value:}` a alphaHunter y redTeam que son addresses inmutables. ¿Hay riesgo de reentrancy?
4. **¿El withdraw pattern es seguro?** Solo el owner puede llamar withdraw, pero usa `.call{value:}` que permite reentrancy. ¿Es un riesgo real dado que owner es immutable?

### P1 — Correctitud
5. **¿Debería el contrato validar que challengeId fue emitido por el backend?** Actualmente acepta cualquier bytes32. ¿Debería haber un mecanismo on-chain (como que el owner firme el challengeId) para evitar que alguien meta challengeIds random?
6. **¿El evento MCPPayment tiene toda la data necesaria para verificación off-chain?** ¿Falta algo como `requestHash` o `toolArgs`?
7. **¿Los fee updates con updateFees pueden romper pagos in-flight?** Si el owner cambia el fee mientras un challenge está pending, el agente podría pagar con el fee viejo y el contrato rechazaría.

### P2 — Gas y Optimización
8. **¿El mapping de challengeConsumed crece indefinidamente?** ¿Hay preocupación de storage bloat a largo plazo?
9. **¿Hay optimizaciones de gas obvias que me estoy perdiendo?**

## Lo que espero
- Clasificación de findings como P0/P1/P2/Informational
- Para cada finding: descripción, impacto, recomendación concreta con código
- Si el contrato está fundamentalmente bien, dilo — no inventes issues que no existen
- Si hay algo que debería cambiar antes de deployar, dilo con urgencia
- Este es un hackathon con fondos pequeños (~0.5 OKB total), no un protocolo DeFi de millones. Calibra la severidad en consecuencia.
