# Brief para Codex — Bobby Execution Deadlock (10 Days, 0 Trades)

## Contexto del Producto
**Producto**: Bobby Agent Trader — 3-agent AI debate system (Alpha Hunter, Red Team, CIO) that autonomously trades crypto with $100 on OKX, committed on X Layer chain. Think AI hedge fund manager for a hackathon demo.
**Stack**: Vercel serverless (TypeScript), Claude API (Haiku for Alpha/Red, Sonnet for CIO), Supabase Postgres, OKX CEX API
**Chain**: OKX X Layer (Chain 196)

## Problema Específico
Bobby has run **406 debates across 10 days and executed exactly 0 trades**. This is a $100 trading challenge for a hackathon — the product is dead if it never trades. On April 2 we attempted fixes (raised maxDuration 120→300s, lowered conviction threshold 0.5→0.35, rewrote CIO prompt). None worked. The cycle STILL times out, and even when it doesn't, the CIO outputs prose instead of the structured VERDICT JSON required by the parser.

### Data from Supabase (as of 2026-04-03):
- **406 total debates**, 284 rejected, 0 trades executed
- **Conviction distribution**: 241 below 0.35, 83 between 0.35-0.50, 8 between 0.50-0.60, 74 above 0.60 (max 0.9)
- **Last 20 agent_cycles**: ALL say "Timed out before completion" or "Timed out (cleaned by next cycle)"
- **agent_trades table**: 0 rows. Has NEVER had a trade.
- **0 cycles with trades_executed > 0** ever

### The 3-link failure chain:
1. **Timeout**: Cycle takes >300s (Vercel limit). Flow: fetch intel (30-60s) → Alpha LLM call (30-60s) → Red Team LLM call (30-60s) → CIO LLM call (30-60s) → parse → execute. Sequential LLM calls alone eat 120-240s before adding API fetches.
2. **CIO doesn't emit VERDICT JSON**: Even in the 74 debates where conviction was >0.6, CIO wrote prose like `"Red Team wins, 6/10 — Short SOL..."` instead of `VERDICT: {"action":"open",...}`. The regex parser (`/VERDICT:\s*(\{[^}]+\})/) `) never matches.
3. **Execution gate requires ALL of**: `!isDryRun && cioSaysExecute && symbol && direction && conviction >= 0.35 && stopPrice`. Without VERDICT JSON, `cioSaysExecute` stays `false` forever.

## Archivos Relevantes

### api/bobby-cycle.ts — Main cycle engine (~1700 lines)
```
Line 15:    export const config = { maxDuration: 300 };
Line 176-182: resolveChallengeMode() — GET='live', POST without mode='dryrun'
Line 623-627: isDryRun = challengeMode === 'dryrun'
Line 816-846: CIO prompt (tells it to output VERDICT JSON — model ignores it)
Line 856:    cioSaysExecute = false (default)
Line 866:    verdictMatch = cioPost.match(/VERDICT:\s*(\{[^}]+\})/) — the parser
Line 927-928: cioSaysExecute = true ONLY if structuredExecuteRequested && symbol && direction && conviction && stopPrice
Line 1089:   Execution gate: !isDryRun && cioSaysExecute && conviction >= 0.35
Line 1247:   Rejection reason logged when conviction < 0.35
```

### CIO Prompt (lines 816-846):
The prompt includes 3 VERDICT examples (open, close, sit out) and says "NEVER omit VERDICT". But Sonnet still outputs free-form prose. Example CIO output from DB:
```
"Alpha Hunter gana, 6.5/10 — Short SOL a $79.34 con stop en $86.12 y target en $65.78..."
```
This has all the data (symbol, direction, entry, stop, target, conviction) but in PROSE, not JSON.

### vercel.json — Cron config
```
"crons": [{ "path": "/api/bobby-cycle", "schedule": "0,30 * * * *" }]
```
Cron calls GET → resolveChallengeMode returns 'live' → isDryRun=false. This part is correct.

## Preguntas Específicas

1. **Timeout architecture**: The cycle makes 3 sequential LLM calls (Alpha, Red, CIO) plus intel fetch. Each can take 30-90s. Total often >300s. Options I see:
   - A) Parallelize Alpha + Red Team (they're independent, CIO depends on both)
   - B) Split into 2 serverless calls: Phase 1 (intel+debate→store) triggered by cron, Phase 2 (parse+execute) triggered by Phase 1 completion
   - C) Move to a long-running process (Digital Ocean droplet — we have one at 143.110.194.171)
   - D) Reduce token limits drastically (currently 500 max_tokens for CIO)
   Which approach? Or something else? Trade-off: complexity vs reliability vs cost.

2. **VERDICT extraction robustness**: The CIO model (Sonnet) ignores the structured output format ~80% of the time. Options:
   - A) Add a cheap post-processor (Haiku) that extracts VERDICT JSON from the CIO prose
   - B) Use Claude's tool_use/function_calling to force structured output instead of free-text
   - C) Add a retry loop: if VERDICT not found, re-prompt CIO with "You forgot VERDICT. Output ONLY the VERDICT line."
   - D) Regex fallback that parses prose (dangerous — regex already exists but NEVER enables execution by design)
   Which approach is safest for a system that moves real money?

3. **Conviction calibration reality check**: Backend conviction (bobby-intel) averages 0.6-0.75, but CIO debate conviction averages 0.3-0.4. The CIO systematically downgrades conviction. Is this the right design? Should we:
   - A) Weight backend conviction more heavily in the final score
   - B) Give CIO a floor ("if backend > 0.6 your minimum is 0.4")
   - C) Accept CIO's judgment but lower execution threshold further (0.35 → 0.25)
   - D) Something else

4. **Recovery plan**: After 10 days of 0 trades, what's the fastest path to first trade? Should we:
   - Force a paper trade to validate the pipeline end-to-end?
   - Add a "force_trade" admin endpoint that bypasses conviction gates?
   - Something more surgical?

## Constraints
- Vercel serverless: maxDuration 300s is the HARD limit (Vercel Pro plan)
- Claude API: Haiku is cheap (~$0.001/call), Sonnet is 10x more expensive
- OKX: minimum order size varies by pair (BTC perps ~$5, some alts higher)
- This is a hackathon demo — reliability matters more than perfection
- The cycle cron runs every 30 min — can't overlap (but currently each cycle is independent)
- No breaking changes to forum_threads schema (frontend depends on it)

## Lo que espero de ti
No me des una respuesta genérica. Necesito:
- A concrete pipeline architecture that fits in 300s (or explain why it can't)
- Whether tool_use is the right fix for VERDICT extraction, with exact implementation guidance
- If you find any other reason trades aren't executing that I missed, flag it P0
- Priority-ordered action plan: what do we fix FIRST to get first trade within 24h
