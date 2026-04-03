# Synthesis: Bobby Execution Deadlock Fix

**Date:** 2026-04-03
**Sources:** Codex (architecture) + Gemini (UX/prompting)
**Status:** IMPLEMENTED

## Where they agreed (implemented first)
- VERDICT must be structured, not regex-parsed from prose
- Analyst + yield debate must be stripped from cron path (timeout fuel)
- Red Team needs drought awareness when >72h without trade

## Where they disagreed (decision made)
| Topic | Codex | Gemini | Decision |
|-------|-------|--------|----------|
| VERDICT format | OpenAI Structured Outputs (function calling) | XML tags in prompt | **Codex** — API-level enforcement > prompt engineering. Model is actually GPT-4o, not Claude. |
| CIO personality | JSON-only, prose inside schema fields | Separate `<phone_call>` + `<system_execution>` | **Hybrid** — Structured output for parsing, reconstruct prose for forum display from `hook` + `thesis` + `risks` fields |
| Conviction gate | Backend-owned: 0.7×backend + 0.3×llm | Not addressed | **Codex** — removes CIO as sole numeric gatekeeper |

## What each found that I missed
- **Codex P0**: 4 LLM calls not 3 (Analyst was hidden), yield debate adds 3 more, CIO actually runs on GPT-4o not Sonnet, trades_executed never updated
- **Gemini**: Prompt mixes emotional roleplay with machine contract — root cause of format violations. Drought framing should attack ego ("inaction is a losing position")

## Changes Made
1. **callStructuredVerdict()** — New function using OpenAI function calling with `tool_choice: {type: "function", name: "submit_verdict"}` and typed JSON schema
2. **AbortController timeouts** — 25s per LLM call, 20s for fetchIntel
3. **Analyst + yield debate skipped on cron** — saves ~120s per cycle
4. **agent_trades insert** — records every executed trade
5. **trades_executed counter** — updated on cycle completion
6. **Conviction gate: 0.7×backend + 0.3×llm** — backend-owned
7. **Red Team drought awareness** — challenges inaction bias when >72h
8. **Drought note escalated** — "Inaction is becoming a losing position" (Gemini)

## Expected Cron Cycle Budget (post-fix)
- fetchIntel (cached or <20s): ~10s
- Alpha (Haiku, 25s timeout): ~10-15s
- Red Team (Haiku, 25s timeout): ~10-15s
- CIO structured verdict (GPT-4o, 30s timeout): ~10-15s
- OKX execution + TP/SL: ~10-15s
- DB writes: ~5s
- **Total: ~55-85s** (was >300s, 75% reduction)

## Pending (Phase 2)
- Move orchestrator to DigitalOcean droplet for unlimited duration
- UX states (ACTIVE_OBSERVATION, TRADE_VETOED, RESTRICTED_SAFE_MODE) per Gemini
- Digest + Twitter + quality scoring as async post-cycle jobs
