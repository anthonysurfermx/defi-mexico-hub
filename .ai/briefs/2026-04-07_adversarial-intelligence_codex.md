# Brief para Codex — Backend Architect / Devil's Advocate

> **Instrucciones**: Copia este brief y pégalo en Codex (ChatGPT con modelo o1/o3). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — Un CIO autónomo de AI trading con debate interno de 3 agentes (Alpha Hunter, Red Team, CIO) que analiza, debate y ejecuta trades on-chain en X Layer (OKX L2, Chain ID 196).
**Stack**: Vite + React + TypeScript frontend, Vercel serverless (api/*.ts), Supabase (Postgres + RLS), Claude API (Haiku/Sonnet), wagmi/viem, OKX X Layer
**Chain/Red**: OKX X Layer (Chain ID 196), OKB nativo para pagos

**Contexto**: Bobby ganó 3er lugar en Build X Hackathon 1.0. Ahora competimos en Season 2 (deadline: 15 abril, 8 días). El 1er lugar fue Bond.credit — ganaron por tener tracción real ($761K volumen) con un credit scoring para agentes AI. Otros ganadores: Soulink (identidad on-chain para agentes), VeriAgent (verificación de pagos agenticos).

## La Idea Nueva: Adversarial Intelligence Procurement

En lugar de que Bobby solo **venda** inteligencia a otros agentes (el marketplace actual), queremos agregar un segundo flow donde Bobby **compre** second opinions de otros agentes antes de ejecutar un trade.

### El concepto:

1. Bobby está por ir LONG ETH con conviction 8/10
2. Antes de ejecutar, publica un **bounty on-chain** en X Layer: "Pago 0.001 OKB al agente que me presente la mejor tesis contraria"
3. Agentes externos (whale trackers, sentiment bots, on-chain analysts) responden via MCP con su counter-thesis
4. Bobby evalúa las respuestas con Claude, ajusta su conviction, y **paga al agente cuya respuesta más impactó su decisión**
5. Todo queda on-chain: el bounty, las respuestas (hash), el pago, la decisión final, el delta de conviction

### Por qué importa para el hackathon:

- **Bidirectional payment flow** en X Layer (Bobby compra Y vende) — más impresionante que unidireccional
- **Ecosystem integration**: consume otros proyectos del hackathon (Soulink para identidad, Bond.credit para reputación)
- **Genuinamente agentico**: un agente que paga por ser corregido es algo que un humano no haría
- Apunta al premio "Highest Potential for Ecosystem Integration"

## Infraestructura Existente

Ya tenemos (o vamos a tener para el día 2):
- `BobbyAgentEconomyV2` con `payMCPCall(bytes32 challengeId, string toolName)` — contrato de pagos en X Layer
- `ConvictionOracle` — escribe conviction scores on-chain
- MCP HTTP server con `initialize`, `tools/list`, `tools/call`
- Supabase tables: `mcp_payment_challenges`, `mcp_payment_receipts`
- Bobby treasury wallet: `0x09a81ff70ddbc5e8b88f168b3eef01384b6cdcea`
- Demo buyer agent que corre cada 2-4h

## Preguntas Específicas

1. **¿Cómo diseño el smart contract para bounties?** Necesito:
   - Bobby publica bounty con stake (ej: 0.005 OKB) + pregunta (hash) + deadline
   - Agentes externos responden (on-chain commit del hash de su respuesta)
   - Bobby evalúa off-chain (Claude juzga calidad) y selecciona ganador
   - Pago automático al ganador + registro del delta de conviction
   - ¿Esto debería ser una extensión del BobbyAgentEconomyV2 o un contrato separado?

2. **¿Cómo evito gaming/spam?** Si cualquier agente puede responder a un bounty, van a llegar respuestas basura. Opciones:
   - Stake mínimo del respondedor (skin in the game)
   - Whitelist de agentes verificados (pero mata la apertura)
   - Reputation score on-chain (como Bond.credit)
   - Rate limit por address
   - ¿Cuál es la mejor para 8 días?

3. **¿Cómo hago la evaluación off-chain confiable?** Bobby usa Claude para juzgar qué counter-thesis fue mejor. Esto es centralizado. ¿Cómo lo hago verificable?
   - ¿Hash de la evaluación on-chain?
   - ¿Publicar el prompt + response completo en IPFS/Arweave?
   - ¿Es suficiente para un hackathon que el hash del juicio esté on-chain + el JSON completo en un API público?

4. **¿El flow MCP para recibir respuestas externas cómo funciona?** Bobby publica bounty, pero ¿cómo lo descubren otros agentes? Opciones:
   - Bobby expone `tools/list` que incluye `bobby_bounties` (lista bounties activos)
   - Bobby expone `bobby_submit_counter_thesis` como tool MCP
   - Evento on-chain que otros agentes pueden poll
   - ¿Cuál es más práctico para el hackathon?

5. **¿Cabe esto en los 8 días del plan existente?** El plan actual es:
   - Día 1: limpiar casa
   - Día 2: contrato V2
   - Día 3: MCP HTTP
   - Día 4: bobby_analyze end-to-end
   - Día 5: ConvictionOracle + Judge Mode
   - Día 6: bobby_debate + demo agent
   - Día 7: verify script + docs
   - Día 8: video + submit
   
   ¿Dónde meto el bounty system sin comprometer lo que ya está planificado? ¿O debo sacrificar algo del plan original?

6. **¿Qué pasa si nadie responde al bounty?** En el hackathon es probable que no haya agentes externos reales respondiendo. ¿Corro mi propio "contrarian agent" que responde bounties? ¿Es eso tramposo o es demostrar el flow?

## Constraints
- Vercel serverless (max 60s per function)
- X Layer Chain ID 196, OKB nativo
- 8 días hasta deadline
- Presupuesto de gas limitado
- El plan base (marketplace selling) no puede romperse — el bounty es un **addon**, no un reemplazo
- Tiene que ser verificable on-chain para jueces AI

## Lo que espero de ti
- **Arquitectura del contrato de bounties** — funciones, eventos, flow
- **Decisiones concretas** sobre anti-spam, evaluación, descubrimiento
- **Un plan realista** de cómo meter esto en los 8 días sin romper el plan base
- **Red flags** que no estoy viendo — ¿hay algo fundamentalmente roto en esta idea?
- Si crees que es demasiado para 8 días, dime qué versión mínima sí cabe
