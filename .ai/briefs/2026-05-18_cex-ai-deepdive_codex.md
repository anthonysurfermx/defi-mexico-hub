# Brief — Codex — CEX AI Tools Deep Dive

**Fecha:** 2026-05-18
**Autor:** Anthony (Head of Product) + Claude
**Para:** Codex (devil's advocate / architecture / security)

---

## 1. Contexto del proyecto

**DeFi Mexico Hub** es una webapp (Vite + React + TS, Supabase, Vercel) que sirve a la comunidad DeFi LATAM. Vive en https://defimexico.org.

**Bobby Agent Trader** es nuestro producto estrella dentro del hub — un sistema de 3 agentes AI (Alpha Hunter, Red Team, CIO) que debaten señales de mercado y ejecutan trades en OKX X Layer (Chain 196). Ganamos 3er lugar en el hackathon S1 de OKX X Layer (abril 2026) y estamos por entrar al S2.

Recientemente publicamos un **Agentic World Leaderboard** (defimexico.org/agentic-world/leaderboard) — una tabla comparativa de 45 plataformas que lanzaron infraestructura de AI/MCP entre Feb y Mayo 2026 (CEXes, DEXes, wallets, aggregators, data providers, oráculos, etc.).

---

## 2. El problema a resolver

La sección **CEXes** del leaderboard tiene 7 entradas con metadata superficial. Queremos hacer un **deep dive técnico** para producir un ranking definitivo del **mejor CEX para que un agente AI ejecute estrategias en producción**.

No es un "top 10 marketing list". Es un análisis técnico para responder: **si estás construyendo un agente como Bobby y tienes que apostar tu capital real, ¿qué CEX te da más leverage?**

Los 7 CEXes en la tabla actual:

| Nombre | Skills | Lanzamiento | Chains | Auth | Source verificada |
|---|---|---|---|---|---|
| Kraken | 50 (workflow) + 6 módulos (102 cmds totales) | Mar 2026 | Crypto + xStocks + Forex + Futures + Earn (6 verticales) | API key | github.com/krakenfx/kraken-cli |
| Binance | 12 skills (Spot, Futures, Margin, Meme Rush, Alpha, Audit, etc.) | Mar 2026 | BNB Chain | API key | github.com/binance/binance-skills-hub |
| OKX OnchainOS | 11 skills | Mar 3, 2026 | 60+ chains | API key | github.com/okx/onchainos-skills + github.com/okx/agent-trade-kit |
| Coinbase | 5 skills (AgentKit + x402 + Agentic Wallets TEE) | Feb 11, 2026 | EVM + Solana (15 chains) | API key + CDP | github.com/coinbase/agentkit |
| Crypto.com | 4 skills (market data only) | Mar 2026 | Cronos | None (read-only) | mcp.crypto.com/docs |
| Bitget Wallet | 10 skills | Feb 27, 2026 | 9 chains | API key | github.com/bitget-wallet-ai-lab/bitget-wallet-skill |
| Bybit | 253 skills | **Apr 22, 2026** (oficial release) | Multi-chain | API key | prnewswire.com Bybit MCP launch |

---

## 3. Lo que sabemos (research previa)

Investigación reciente confirmó:

- **Kraken** fue el primer exchange con CLI nativo + MCP integrado. Cubre xStocks (79 tickers), forex (11 pares), futures (317 contratos crypto + tradicionales). Paper trading incluido. Integra con prácticamente todo cliente AI (Claude, Cursor, Windsurf, VS Code, Gemini CLI, ChatGPT).
- **Bybit** publicó MCP oficial el 22 abril (no mar 13 como teníamos antes). 253 tools agrupados en 4 módulos: Market Data, Trading (spot/perp/conditional), Account & Asset, Real-Time WebSocket Streams.
- **OKX** tiene la mayor superficie on-chain (60+ chains, DEX Swap sobre 500+ DEXes, Smart Money signals, Trenches scanner para memes/pump.fun, x402 payment, Security audit).
- **Coinbase** tiene el stack más "agent-native": AgentKit + x402 + Agentic Wallets en TEE + sponsored gas en Base. Pero menos comandos brutos.
- **Binance** tiene la oferta más amplia vertical (Square posting, Meme Rush, Alpha, Audit, Margin).

---

## 4. Preguntas concretas para Codex

Por favor responde cada una con bullets + sources cuando aplique:

### 4.1 Auth & Security
1. ¿Qué CEX tiene el modelo de auth menos peligroso para un agent autónomo que va a ejecutar trades sin supervisión humana en cada operación? Compara: API key clásica vs. EIP-712 vs. session keys vs. spending caps. Considera el blast radius si el agent se compromete.
2. ¿Algún CEX implementa "session limits" / "daily caps" / "max position" enforceable en el nivel del exchange (no del cliente)? ¿Cuál es el más maduro?
3. Específicamente: si la API key se filtra, ¿qué tan rápido puedes revocar y cuánto daño puede hacer en el intervalo? Compara los 7.

### 4.2 Rate limits & costos ocultos
4. Para un agent que hace ~50 calls/min (intel + ticker + orderbook + place + monitor), ¿cuál es el rate limit real de cada CEX? Cita el rate limit doc oficial. ¿Cuáles tienen tiers pagados que el agent necesitaría?
5. ¿Algún CEX cobra por las llamadas MCP/CLI o sólo por trades? ¿Hay precios "agent-specific" anunciados?
6. Maker/taker fees + funding rate diff entre los 7 — para un agent perp-focused (Bobby es 90% perps), ¿quién es el más barato a volumen realista de hackathon (~$10k AUM)?

### 4.3 Confiabilidad de ejecución
7. ¿Cuál de los 7 tiene mejor SLA documentado en su API? ¿Quién publica downtime histórico?
8. ¿Cuáles soportan WebSocket streaming bien integrado con su MCP (no polling)?
9. Critical: para órdenes condicionales (stop-loss, take-profit, OCO) que el agent depende de en producción — ¿quién las ejecuta server-side garantizado vs. quién las simula client-side?

### 4.4 Ecosystem fit
10. Para un agent construido en **X Layer (OKX Chain 196)**, ¿hay ventajas técnicas reales de usar OKX OnchainOS vs. Kraken/Bybit? (gas patrocinado, integración nativa, identity verification, etc.)
11. ¿Cuáles de los 7 publican **MCP discovery** estilo ERC-8004 / agent registries? ¿Algún CEX se está posicionando como "agent identity provider"?
12. Si Coinbase tiene x402 micropayments + Agentic Wallets en TEE pero menos comandos — ¿es preferible para arquitecturas agent-to-agent (A2A)?

### 4.5 Trampas conocidas
13. ¿Algún CEX tiene historial de cambiar el rate limit / API contract sin warning suficiente, lastimando a agentes en producción?
14. ¿Hay reportes públicos (GitHub issues, X/Twitter, foros) de bugs específicos en alguno de estos MCPs que un team debería conocer antes de elegir?
15. **Pregunta abogado del diablo:** si tú fueras el ingeniero senior contrarian del equipo, ¿qué CEX descartarías inmediatamente y por qué?

### 4.6 La decisión final
16. Dame tu ranking 1–7 con **una sola sentence justificando cada posición**. Asume el caso de uso: agent autónomo, perps + spot, AUM $10k–$1M, ejecución 24/7, sin human-in-the-loop.
17. ¿Recomendarías una arquitectura **multi-CEX** (ej. ejecución en Bybit, datos en OKX) o **single-CEX**? Justifica desde el punto de vista de complejidad operativa.

---

## 5. Constraints / criterios

- **Honestidad sobre datos no verificables:** si no encuentras source oficial para una claim, dilo. No inventes números.
- **Cita repos / docs / press releases** cuando aplique (URLs).
- **Lente "hackathon-mindset":** estamos optimizando para *ship*, no para enterprise procurement. Velocidad de integración > completitud teórica.
- **LATAM context:** los tres principales CEX usables en México son Bitso, Bybit y Binance. Los demás son tecnológicamente accesibles pero KYC es harder. Considera esto si pesa.
- **No Pro plan de Vercel:** ya tuvimos que quitar crons; el agent corre en lambdas serverless con maxDuration 300s. La latencia del CEX cuenta.

---

## 6. Salida esperada

Pon tu respuesta en `.ai/responses/2026-05-18_cex-ai-deepdive_codex.md` con esta estructura:

```
## Resumen ejecutivo (3-5 bullets)

## Ranking final 1-7 con one-line justification each

## Respuestas por sección
### 4.1 Auth & Security
### 4.2 Rate limits & costos
### 4.3 Confiabilidad
### 4.4 Ecosystem fit
### 4.5 Trampas
### 4.6 Decisión final

## Disagreements esperados con Gemini
(predict qué responderá distinto)

## Sources
(lista de URLs citadas)
```

Gracias.
