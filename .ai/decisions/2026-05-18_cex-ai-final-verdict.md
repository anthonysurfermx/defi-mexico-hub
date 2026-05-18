# Decision Log — CEX AI Tools Final Verdict

**Fecha:** 2026-05-18
**Inputs:** Brief técnico (`.ai/briefs/2026-05-18_cex-ai-deepdive_codex.md`), Brief UX (`.ai/briefs/2026-05-18_cex-ai-deepdive_gemini.md`)
**Responses:**
- Codex → `.ai/responses/2026-05-18_cex-ai-deepdive_codex.md`
- Gemini → `.ai/responses/2026-05-18_cex-ai-deepdive_gemini.md` (eligió responder el brief técnico de Codex)
- Claude → en-line con el análisis previo a los briefs

---

## Acuerdos unánimes (Claude + Gemini + Codex)

1. **Crypto.com = #7.** MCP read-only; útil como feed secundario, no como executor.
2. **Bitget Wallet = #6.** Wallet/on-chain tooling, no executor CEX perps.
3. **Coinbase = #5.** Stack agent-native superior (AgentKit + x402 + TEE wallets + spending limits), pero **no es primary executor para Bobby**. Mejor uso: A2A payments.
4. **Bybit en top 1-2.** Gemini #1, Codex #1, Claude top contender. Justificación común: 253 skills MCP, perps maduros, WebSocket V5, conditional orders server-side, LATAM-friendly.
5. **OKX está alto (2-3).** Sinergia X Layer es real para Bobby, Agent Trade Kit oficial, demo/read-only mode, IP binding hasta 20 IPs.
6. **Conditional orders server-side son no-negociables.** Stop-loss / TP / OCO en Vercel lambda = suicidio. Delegar SIEMPRE al matching engine del exchange.
7. **Single primary executor + secondary observer** > multi-CEX completo. Multi-CEX completo es plataforma, no demo de hackathon.
8. **API key con trade pero NUNCA withdraw.** Subcuenta + IP whitelist + permisos mínimos = blast radius acotado.
9. **WebSocket en Vercel serverless requiere workaround.** Lambdas de 60s matan conexiones persistentes. Patrón: REST + WS efímero por request + estado en Redis/Supabase.

## Divergencias clave

| Tema | Claude | Gemini | Codex |
|---|---|---|---|
| **Bybit vs Binance** | Bybit por madurez MCP reciente | Binance #2 (liquidez/fees) | Binance #4 (complejidad operacional) |
| **OKX position** | #3 (DeFi-depth) | #3 | #2 (X Layer fit estratégico) |
| **Kraken position** | Top por breadth+xStocks+forex | #4 (LATAM weak) | #3 (Dead Man's Switch crítico) |
| **Spending caps** | No analizado | No analizado | "Ninguno publica" — confirmed |

## Mi síntesis final como Head of Product

Tomo Codex's ranking como base por su rigor en execution primitives:

**Top 5 consensuado (para Bobby Agent Trader S2):**

1. **Bybit** — Primary executor
2. **OKX** — Sinergia X Layer + data secondary
3. **Kraken** — Sentinel/paper trading + futures guardrails
4. **Binance** — Liquidez backup (no primary por API governance complexity)
5. **Coinbase** — A2A payments + x402 + Agentic Wallets (no perps executor)

**Arquitectura recomendada:**
- **Bybit** ejecuta perps (primary)
- **OKX** entrega intel + on-chain flows + X Layer narrative
- **Kraken paper mode** corre en paralelo como sentinel para comparar latency/quotes
- **Coinbase x402** maneja eventual agent-to-agent payments (cuando Bobby venda señales/firmas a otros agents)
- **Binance** stays read-only por ahora; activar como execution backup sólo si Bybit cae

**Decisiones operativas:**
1. Conditional orders SIEMPRE server-side (Bobby ya hace esto en `okx-perps.ts` — auditar contra Bybit)
2. Implementar Dead Man's Switch equivalente en Bobby (cancel-all-orders si cycle no checks-in en N min)
3. API key con permisos mínimos (read + trade, NO withdraw, NO internal transfer)
4. IP whitelist en TODAS las keys (incluso si Vercel lambdas tienen pool dinámico — usar proxy fijo)
5. Subcuenta separada para Bobby; nunca trade desde main account

## Artefacto entregable

Tabla visual del top-5 consenso integrada en `AgenticLeaderboardPage.tsx` como nueva sección "CEX AI Verdict (Multi-LLM Consensus)".
