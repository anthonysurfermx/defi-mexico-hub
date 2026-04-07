# Brief para Codex — Backend Architect / Devil's Advocate

> **Instrucciones**: Copia este brief y pégalo en Codex (ChatGPT con modelo o1/o3). Guarda la respuesta en `.ai/responses/` con el mismo nombre pero sufijo `_response`.

---

## Contexto del Producto
**Producto**: Bobby Agent Trader — Un CIO autónomo de AI trading con debate interno de 3 agentes (Alpha Hunter, Red Team, CIO) que analiza, debate y ejecuta trades on-chain en X Layer (OKX L2, Chain ID 196).
**Stack**: Vite + React + TypeScript frontend, Vercel serverless (api/*.ts), Supabase (Postgres + RLS), Claude API (Haiku/Sonnet), wagmi/viem, OKX X Layer
**Chain/Red**: OKX X Layer (Chain ID 196), OKB native + USDT ERC-20

**Contexto importante**: Bobby ganó 3er lugar en el hackathon anterior de OKX X Layer. Ahora queremos participar en la siguiente temporada del hackathon "Build X" (deadline: 15 abril 2026, 8 días). El hackathon tiene dos arenas: **X Layer Arena** (apps agenticas) y **Skills Arena** (skills reutilizables). Queremos competir con el **Bobby Marketplace** — un sistema de agent-to-agent commerce donde otros agentes AI compran inteligencia de Bobby.

## Problema Específico

Bobby ya tiene un Marketplace UI (10 use cases mostrados) pero la mayoría son showcases visuales con datos simulados. Para el hackathon necesitamos que al menos 2-3 flows sean **end-to-end funcionales**: un agente externo llama a Bobby via MCP, paga via x402 en X Layer, Bobby ejecuta el debate/análisis, y devuelve el resultado con proof de settlement on-chain.

El reto técnico es: ¿cómo implementamos un MCP server real con x402 payment challenges en 8 días, de forma que los jueces (que incluyen AI agents que revisan código y on-chain data automáticamente) puedan verificar que funciona?

## Arquitectura Actual del Marketplace

Bobby expone 4 MCP tools:
- `bobby_analyze` — Conviction signal (x402 paid, 0.01 USDC)
- `bobby_debate` — 3-agent debate completo (x402 paid, 0.01 USDC)
- `bobby_ta` — Technical analysis con 70+ indicadores OKX (free)
- `bobby_intel` — Intelligence snapshot: regime, conviction, mood (free)

Infraestructura on-chain existente:
- ConvictionOracle contract en X Layer (escribe conviction scores on-chain)
- Treasury wallet: 0x09a81ff70ddbc5e8b88f168b3eef01384b6cdcea
- USDT contract: 0x1E4a5963aBFD975d8c9021ce480b42188849D41d

Endpoints API existentes:
```
api/bobby-intel.ts    — Fast intelligence snapshot (~10s)
api/bobby-cycle.ts    — User-facing debate cycle (every 5min via cron)
api/explain.ts        — Claude Haiku streaming analysis via SSE
api/openclaw-chat.ts  — Chat with Bobby
```

10 use cases definidos (2 "Prime" + 8 standard):
1. AI Trading Fund — vault rebalancing via bobby_analyze (x402)
2. AI Risk Manager — reads ConvictionOracle on-chain (oracle_read) 
3. AI Newsletter — 3-agent debate via bobby_debate (x402)
4. AI Portfolio Optimizer — technical analysis via bobby_ta (free)
5. AI Alert Service — polls ConvictionOracle (oracle_read)
6. AI Academy Tutor — debate for grading (x402)
7. AI Hedge Bot — regime detection via bobby_intel (free)
8. AI Social Trader — debate → threads (x402)
9. AI Market Maker — ATR + regime for spreads (free)
10. AI Insurance Protocol — calibration data (free)

## Preguntas Específicas

1. **¿Cómo implementamos x402 payment challenges en Vercel serverless?** El protocolo x402 requiere que el server responda con un 402 + payment details, el cliente pague en X Layer USDT, y luego re-intente con proof of payment. ¿Lo hacemos stateless (verificar tx on-chain en cada request) o con un receipt cache? Trade-off: simplicidad vs latencia.

2. **¿Qué 2-3 use cases deberíamos hacer funcionales primero para máximo impacto con los jueces?** Considerando que los jueces incluyen AI agents que revisan código y on-chain data automáticamente, ¿priorizamos los x402 paid flows (más impresionantes pero más complejos) o los free/oracle_read flows (más fáciles de demostrar)?

3. **¿Deberíamos implementar un MCP server real (stdio/SSE) o es suficiente un REST API que sigue el patrón MCP?** Trade-off: un MCP server real es más impresionante para el hackathon y permite que otros agentes Claude lo conecten con `claude mcp add`, pero es más complejo de hostear en Vercel serverless.

4. **¿Cómo generamos on-chain activity verificable en 8 días?** Los jueces AI revisan datos on-chain. ¿Corremos un "demo agent" que llame a Bobby cada hora, pague via x402, y genere txs en X Layer? ¿O es mejor tener un script de integración que los jueces puedan correr ellos mismos?

5. **¿Hay riesgos de seguridad que debamos resolver antes de exponer estos endpoints públicamente?** Bobby actualmente corre en Vercel con API keys en env vars. Si exponemos un MCP server público que acepta pagos, ¿qué attack vectors debemos cubrir?

## Constraints
- Vercel serverless (max 60s per function, no persistent connections)
- X Layer Chain ID 196 — EVM compatible, tiene bridge desde ETH/OKX
- Deadline: 15 abril 2026 (8 días)
- Presupuesto limitado para gas — Bobby treasury tiene fondos pero no infinitos
- El frontend ya está deployado en defimexico.org, no queremos romper lo que funciona
- Podemos hacer doble submission: X Layer Arena (marketplace) + Skills Arena (bobby-trader skill)

## Lo que espero de ti
No me des una respuesta genérica. Necesito:
- **Priorización brutal**: qué hacer en los 8 días y qué NO hacer
- **Arquitectura del x402 flow**: diagrama de secuencia concreto
- **Risk assessment**: qué puede salir mal con los jueces AI revisando on-chain data
- **Ideas diferenciantes**: qué haría que Bobby Marketplace destaque vs otros proyectos del hackathon
- Si encuentras problemas que no pregunté, repórtalos con prioridad (P0/P1/P2)
