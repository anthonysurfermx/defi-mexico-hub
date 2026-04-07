# Brief para Gemini — Smart Contract Security Audit (Round 1)

> **Instrucciones**: Copia este brief y pégalo en Gemini. Esta vez NO es UX — es una auditoría de seguridad de smart contracts. Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto
**Proyecto**: Bobby Protocol — Intelligence Protocol on X Layer (Chain 196)
**Chain**: OKX X Layer (Chain 196), EVM compatible, OKB nativo (18 decimals)
**Compiler**: Solidity ^0.8.19 (overflow protección built-in)
**Fondos en riesgo**: ~0.5 OKB (hackathon scale, no DeFi protocol)

Gemini ya auditó el `BobbyConvictionOracle` en marzo 2026. Ahora necesito que audites el nuevo `BobbyAgentEconomyV2` — un contrato de pagos que reemplaza al V1 agregando protección contra replay via `challengeId`.

## Contrato a Auditar: BobbyAgentEconomyV2

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract BobbyAgentEconomyV2 {
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

    address public immutable owner;
    address public immutable alphaHunter;
    address public immutable redTeam;
    address public immutable cio;

    uint256 public mcpCallFee = 0.001 ether;
    uint256 public debateFeePerAgent = 0.0001 ether;

    uint256 public totalMCPCalls;
    uint256 public totalDebates;
    uint256 public totalVolume;

    mapping(bytes32 => bool) public challengeConsumed;

    constructor(address _alphaHunter, address _redTeam, address _cio) {
        owner = msg.sender;
        alphaHunter = _alphaHunter;
        redTeam = _redTeam;
        cio = _cio;
    }

    modifier onlyOwner() {
        require(msg.sender == owner, "Not owner");
        _;
    }

    function payMCPCall(bytes32 challengeId, string calldata toolName) external payable {
        require(msg.value >= mcpCallFee, "Insufficient MCP fee");
        require(challengeId != bytes32(0), "Invalid challengeId");
        require(!challengeConsumed[challengeId], "Challenge already consumed");

        challengeConsumed[challengeId] = true;

        totalMCPCalls++;
        totalVolume += msg.value;

        emit MCPPayment(msg.sender, challengeId, toolName, msg.value, block.timestamp);
    }

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

## Contrato V1 (para referencia de lo que se reemplaza)

Key difference: V1 `payMCPCall(string toolName)` no tenía `challengeId` → cualquiera podía reusar un txHash válido para pedir el mismo tool gratis. V2 agrega `bytes32 challengeId` que se marca como consumed on-chain.

## Flow de Interacción Backend ↔ Contrato

1. Backend genera `challengeId` (UUID → keccak256 → bytes32), guarda en Supabase con status `pending`, expiry 10 min
2. Backend responde 402 al agente con challengeId + contract address + precio
3. Agente llama `payMCPCall(challengeId, toolName)` on-chain
4. Agente re-envía request con txHash
5. Backend verifica: tx confirmed, calldata matches challengeId + toolName, challenge not consumed in DB
6. Backend marca consumed en DB, ejecuta tool, devuelve resultado

## Lo que necesito que audites

### Seguridad del contrato
1. **Reentrancy** — ¿Los `.call{value:}` en payDebateFee y withdraw son vulnerables? ¿Necesito ReentrancyGuard?
2. **Replay protection** — ¿El `challengeConsumed` mapping es suficiente? ¿Hay edge cases?
3. **Access control** — owner es immutable (no transferable). ¿Es un riesgo o una feature para hackathon scope?
4. **Fee manipulation** — updateFees puede cambiar precios sin aviso. ¿Debería haber un timelock o evento?
5. **Denial of Service** — ¿Puede alguien griefear el contrato? Por ejemplo, front-running un challengeId para que el pago legítimo falle.
6. **Integer overflow** — Solidity 0.8.19 tiene protección built-in, pero ¿hay edge cases con totalVolume?

### Diseño y mejores prácticas
7. **¿Falta algo?** Comparado con otros payment contracts en hackathons, ¿hay un patrón estándar que no estoy siguiendo?
8. **¿El contrato debería validar el challengeId on-chain?** Actualmente acepta cualquier bytes32 que no haya sido usado. ¿Debería requerir una firma del owner para probar que el backend lo generó?
9. **¿Los eventos son suficientes?** ¿Falta data para reconstruir el historial completo off-chain?
10. **¿Debería tener pause/unpause?** El ConvictionOracle lo tiene. ¿El EconomyV2 debería tenerlo?

### Interacción con ConvictionOracle
11. **¿Hay riesgos en la interacción entre los dos contratos?** No se llaman directamente, pero comparten el mismo owner/bobby wallet. ¿Algún vector de ataque cruzado?

## Formato de Respuesta
Dame:
- **Findings** clasificados como CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL
- Para cada finding: qué es, por qué importa, código de fix concreto
- **Veredicto final**: ¿Listo para deploy? ¿O necesita cambios antes?
- Recuerda: esto es hackathon scale (~0.5 OKB), no un vault de $100M. Calibra severidad.
