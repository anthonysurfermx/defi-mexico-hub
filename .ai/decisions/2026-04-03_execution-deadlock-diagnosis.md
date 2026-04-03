# Decision: Bobby Execution Deadlock — Full Diagnosis

**Date:** 2026-04-03
**Context:** Bobby has 406 debates, 0 trades in 10 days. April 2 fix attempt failed.

## Why the April 2 Fix Didn't Work

The April 2 decision (2026-04-02_unlock-bobby-trading.md) made these changes:
1. maxDuration 120→300s ✅ Applied, but cycle STILL times out (3 sequential LLM calls + intel fetch > 300s)
2. Conviction threshold 0.5→0.35 ✅ Applied, but irrelevant — `cioSaysExecute` is never true
3. CIO prompt rewritten ❌ Model still outputs prose, not VERDICT JSON
4. Red Team gradient ❓ May be working but can't verify (cycle times out before reaching execution)

## Root Cause Analysis (deeper than April 2)

### Primary: CIO doesn't output VERDICT JSON (100% failure rate)
- Prompt has 3 examples + "NEVER omit VERDICT"
- Sonnet 4 ignores this and writes prose: "Red Team wins, 5/10 — Short SOL..."
- Regex parser `/VERDICT:\s*(\{[^}]+\})/` never matches
- `cioSaysExecute` stays `false` forever
- Even the regex fallback (line 891) only extracts conviction for display, NEVER enables execution

### Secondary: Vercel timeout (>90% of cycles)
- 3 sequential Claude calls: Alpha (Haiku, 30-60s) → Red (Haiku, 30-60s) → CIO (Sonnet, 30-90s)
- Plus intel fetch (10-30s), DB writes, etc.
- Total: 100-240s for LLM alone, 130-300s total
- Right at the 300s edge — most cycles lose the race

### Tertiary: Conviction systematically low
- Backend conviction (bobby-intel): 0.6-0.75 average
- CIO debate conviction: 0.3-0.4 average
- CIO downgrades conviction ~50% from backend
- Combined with Red Team destroying every thesis
- 241 of 406 debates (59%) ended below 0.35

## The Irony
Bobby has the data, the analysis, and often the right thesis. The CIO literally wrote "Short SOL at $79 with stop at $86 and target at $65" — all the fields needed for execution. But because it's in prose instead of JSON, the parser can't extract it, and the trade never fires.

## Briefs Sent
- `.ai/briefs/2026-04-03_bobby-execution-deadlock_codex.md` — Pipeline architecture, tool_use vs post-processor, conviction calibration
- `.ai/briefs/2026-04-03_bobby-execution-deadlock_gemini.md` — CIO prompt engineering, Red Team calibration, "no trade" UX states

## Open Questions for Synthesis
1. Should we use Claude tool_use (Codex) or prompt engineering (Gemini) for VERDICT extraction?
2. Should we split the cycle into 2 serverless calls or parallelize Alpha+Red?
3. Should CIO have a conviction floor when backend is >0.6?
4. How do we show "Bobby is alive" on the Challenge page during droughts?
