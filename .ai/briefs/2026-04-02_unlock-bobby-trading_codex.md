# Brief for Codex: Review Bobby Trading Unlock Changes

## Context
Bobby Agent Trader is a 3-agent AI debate system (Alpha Hunter, Red Team, CIO) that trades on OKX CEX with a $100 Challenge. Bobby has NOT executed a single trade in 9+ days. We just deployed fixes. Need your adversarial review.

## What Bobby Does
- Every hour, a Vercel cron triggers `api/bobby-cycle.ts`
- Flow: Fetch intel (prices, indicators, sentiment) -> 3-agent debate (Alpha pitches, Red Team attacks, CIO decides) -> Risk gate -> Execute on OKX
- On-chain commit of every debate on X Layer (Chain 196)
- Position sizing: Kelly-simplified based on conviction score

## Root Cause Analysis (What We Found)

### Problem 1: Cycles stuck as "running" forever
- `maxDuration: 120` was too short for the full cycle (intel fetch ~15s + 3 LLM calls ~30s + on-chain commit ~10s + forum posts + yield debate + digest)
- The catch block returned 500 but **never updated Supabase** → cycle stays "running" permanently
- Evidence: 140+ cycles since March 28 all show `status: 'running'`, `vibe_phrase: null`

### Problem 2: CIO anchored to conviction 3/10
- Backend quantitative model scored conviction 0.6-0.77 (strong signals)
- But post-debate, CIO consistently output conviction 3/10 (too low to trade)
- Root cause: CIO prompt had sitting-out example anchored at `conviction:3`
- Red Team was too aggressive — destroyed every thesis regardless of signal strength
- The CIO never saw the backend conviction score, so had no context on how strong the signals actually were

### Problem 3: Conviction threshold unreachable in risk-off markets
- Execution gate required conviction >= 0.5 (5/10) in bobby-cycle.ts
- Risk manager required MIN_CONVICTION >= 0.60 (6/10) 
- In the current macro environment (DXY 125+, Extreme Fear), CIO never outputted above 4.7/10
- Result: 100% rejection rate for 9 days straight

## Changes Made (files to review)

### `api/bobby-cycle.ts`
1. **maxDuration: 120 → 300** (line 15)
2. **Hoisted `cycleId`** outside try block so catch can reference it (line 629)
3. **Catch block now updates Supabase** with `status: 'failed'` (line 1620-1626)
4. **Conviction threshold: 0.5 → 0.35** (line 1017)
5. **Red Team softened** when backend conviction > 0.6 — "risk management, not risk avoidance" (lines 755-761)
6. **CIO prompt overhauled:**
   - Injected `BACKEND SIGNAL BIAS` when quant score > 0.6, telling CIO the system has been inactive for 9+ days
   - Changed conviction guide: "4-5/10 = small exploratory position with tight stop"
   - Removed the sitting-out example anchored at conviction:3
   - Always uses Sonnet model (better judgment)
7. **Verdict labeling: 0.5→0.35 for 'execute', 0.4→0.25 for 'watch'** (line ~1438)

### `src/lib/onchainos/risk-manager.ts`
1. **MIN_CONVICTION: 0.60 → 0.35** (line 12)

## Questions for Codex

1. **Risk assessment**: With MIN_CONVICTION at 0.35, position sizing becomes `balance * 0.35 * 0.20 = ~$7`. Is $7 per trade too small to be meaningful on OKX perps? Should we set a minimum notional (e.g., $10)?

2. **Prompt injection risk**: The `BACKEND SIGNAL BIAS` block tells the CIO "you have been sitting out for 9+ days." This is accurate NOW but will be stale after Bobby starts trading. Should we make this dynamic (count days since last trade from DB) or is the current static message acceptable?

3. **Threshold safety**: 0.35 means Bobby could take a trade at 3.5/10 conviction. Given MAX_LOSS_PER_TRADE_PCT is 0.10 (10% of balance = $10 max loss), is this acceptable risk for the $100 Challenge? Or should we add a dynamic floor based on remaining balance?

4. **Red Team neutering concern**: When backend conviction > 0.6, Red Team is told to "acknowledge strong setups" instead of destroying them. Could this create a feedback loop where the system becomes overly bullish? Should there be a circuit breaker (e.g., if 3 consecutive trades lose, restore aggressive Red Team)?

5. **maxDuration 300s**: Vercel Hobby plan caps at 60s, Pro at 300s. Are we on Pro? If not, this change does nothing.

6. **Catch block race condition**: If Vercel kills the function at maxDuration, does the catch block even execute? Or does Vercel hard-kill the process? If hard-kill, we might need a separate "stale cycle cleanup" cron.

## Files to Read
- `api/bobby-cycle.ts` — full file, focus on lines 15, 629, 748-800, 1017, 1438, 1615-1630
- `src/lib/onchainos/risk-manager.ts` — lines 1-50
- Recent forum_threads data: conviction scores 0.3-0.47, all direction null or "none" until today's 0.44 SHORT SOL

## Constraints
- OKX CEX execution (not DEX)
- Only BTC/ETH/SOL-USDT-SWAP allowed
- Max 5x leverage, max 2 concurrent positions
- $100 starting balance, 20% max drawdown circuit breaker
- Vercel serverless execution environment
