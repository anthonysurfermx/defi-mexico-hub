# Codex Response — Bobby Execution Deadlock

## P0 Findings (things the brief missed)

1. **4 sequential LLM calls, not 3**: Alpha → Red → Analyst → CIO (bobby-cycle.ts:767, 786, 793, 816)
2. **Yield debate in same request**: Low-conviction cycles launch 3 MORE LLM calls for yield debate (bobby-cycle.ts:1285) — pure timeout fuel
3. **fetchIntel() is a sub-pipeline**: Calls a separate serverless function (bobby-intel.ts) with maxDuration:30 that fans out to 19 tasks (bobby-intel.ts:1067). Main cycle waits on this before debate starts.
4. **CIO is actually GPT-4o, not Sonnet**: Code maps Sonnet to gpt-4o via OpenAI-first routing (bobby-cycle.ts:80). This changes the output-format fix entirely.
5. **trades_executed counter never updated**: bobby-cycle.ts:1566 never writes trades_executed, so metrics are broken even if a trade somehow fires.

## 1. Timeout Architecture — Option C (Droplet) with Vercel tactical patch

### Vercel-safe budget (stripped loop):
- Load cached intel snapshot: <2s
- Alpha + Red: **parallel**, each ≤15-20s
- CIO structured verdict: ≤10-15s
- OKX execution + TP/SL: ≤10-15s
- Persist results: ≤5s
- **Total: 45-70s** (vs current >300s)

### What to strip from cron path:
- Analyst call (move out of band)
- Yield debate (move out of band)
- Digest/Twitter/quality scoring (move out of band)
- On-chain commit (async if needed)

### Intel as separate producer:
- `intel-refresh` runs every 1-5 min, stores latest snapshot
- `bobby-cycle` reads cached snapshot, no waiting

### 24h: Strip Vercel loop. 48h: Move scheduler to droplet.

## 2. VERDICT Extraction — Provider-native structured output

### Because code uses OpenAI first (gpt-4o):
- Use OpenAI Structured Outputs / function calling (NOT Claude tool_use)
- Split helper: `callTextModel()` + `callStructuredVerdict()`
- CIO returns JSON only, no paragraphs. Explanation inside schema fields.

### Schema:
```json
{
  "action": "open | close | none",
  "symbol": "BTC | ETH | SOL",
  "direction": "long | short | none",
  "conviction": 1-10,
  "entry": number | null,
  "stop": number | null,
  "target": number | null,
  "invalidation": string,
  "vibe_phrase": string,
  "hook": string,
  "thesis": string,
  "risks": string[]
}
```

### Validation:
- Parse JSON, validate fields
- 1 retry max with "return valid JSON only"
- After that, fail closed
- Keep regex fallback for logging/paper only, NEVER live execution

### Anthropic fallback:
- Use `submit_verdict` tool with tool_choice: {"type":"tool","name":"submit_verdict"}

## 3. Conviction — Decouple from CIO

- **Backend model owns**: gate + sizing
- **CIO owns**: action + levels + invalidation
- CIO's numeric conviction = optional telemetry, not execution gate
- Formula: `final_conviction = 0.7 * backend + 0.3 * llm`
- Only after valid structured `action:"open"` exists
- Do NOT lower threshold to 0.25 before fixing structure

## 4. Recovery — Priority order for first trade in 24h

1. **Paper-validate** with existing testVerdict (bobby-cycle.ts:700) — prove openPosition + set_tpsl work
2. **CIO → structured JSON-only** output (OpenAI Structured Outputs)
3. **Remove Analyst + yield debate** from live cron path
4. **Add AbortController timeouts** per model call + fetchIntel
5. **Patch metrics** (trades_executed, total_usd_deployed, agent_trades insert)
6. **Move to droplet** if Vercel still misses budget

### No force_trade endpoint needed — testVerdict already exists and is safer.
### For live canary: add MAX_LIVE_MARGIN_USD=5 cap instead of full bypass.
