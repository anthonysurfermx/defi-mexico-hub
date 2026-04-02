# Brief for Codex: Bobby Metacognition & Intelligence Upgrade

## Context
Bobby Agent Trader is a 3-agent AI debate system (Alpha Hunter, Red Team, CIO) that trades BTC/ETH/SOL on OKX CEX. It consumes 12+ data sources, calculates regime-aware conviction, and tracks its own prediction accuracy. The metacognition layer currently MEASURES but does NOT ENFORCE corrections. We want to go from "intelligence theater" to a real self-improving system.

## Current Architecture

### Intelligence Pipeline (`api/bobby-intel.ts`, 1461 lines)
- 12 data sources fetched in parallel every 60s
- Regime detection: BTC 24h change → HIGH_VOL/NORMAL/LOW_VOL
- Three-pillar conviction: `(okxWhales × w1) + (polymarket × w2) + (technical × w3) - latencyPenalty`
- Weights shift by regime: high vol trusts whales (0.40), low vol trusts technicals (0.45)
- Latency penalty: exponential decay after 5 min signal age

### Technical Scoring (`src/lib/bobby-technical.ts`, 676 lines)
- 10 core indicators: RSI, MACD, BB, MA, EMA, KDJ, ATR, SuperTrend, AHR999, BTC Rainbow
- Each scored [-1, +1] with confidence [0, 1]
- Regime-aware weights (high vol → ATR/SuperTrend heavy, low vol → RSI/MACD heavy)
- Composite: `rawScore × (0.75 + agreement × 0.25)`
- Trade plan with regime-aware stop multipliers: {2.2, 1.8, 1.4} × ATR

### Calibration (`bobby-intel.ts` lines 450-538)
- 5 conviction buckets with predicted vs actual win rates
- Overconfidence detection: if actual < predicted for high-conviction trades
- Adjustment multiplier calculated (0.65-1.0)
- **PROBLEM: multiplier is calculated but only SHOWN to Claude, not enforced in code**

### Self-Correction (`bobby-cycle.ts` lines 256-301)
- Last 72h losses injected into prompt as text
- Win rate tracked, mood derived (confident/cautious/defensive)
- Safe mode flag (win rate < 50% after 5+ cycles)
- **PROBLEM: safe mode is informational only, no code reduces position size**

## What's Missing (Ranked by Impact)

### Tier 1: Critical Intelligence Gaps
1. **No liquidation cascade data** — Liquidations drive 30%+ of crypto moves. Bobby is blind to them.
2. **No funding rate velocity** — Current rate is useless; the CHANGE in rate predicts squeezes.
3. **No macro calendar** — Fed meetings, CPI releases, FOMC minutes create 5-10% moves. Bobby doesn't know they're coming.
4. **No order flow imbalance** — Buy/sell volume ratio is the most direct signal of short-term direction.

### Tier 2: Metacognition Enforcement
5. **Calibration not auto-applied** — Bobby knows it's overconfident but doesn't adjust.
6. **No real-time trade invalidation** — If technical direction flips while a position is open, Bobby should evaluate closing (we just added action:"close" but the triggers are manual).
7. **Break-even trades excluded** — 20-30% of trades vanish from statistics, skewing win rate.
8. **Agreement rate is fake** — Shows high-conviction count, not actual accuracy.

### Tier 3: Advanced
9. **No conviction decay** — A 7/10 trade from 6 hours ago should decay in confidence.
10. **No correlation break detection** — BTC pumps but alts don't follow = distribution signal.
11. **No options/IV data** — Implied volatility is the market's best forward-looking indicator.

## Questions for Codex

### Architecture
1. **Calibration enforcement**: The multiplier is calculated in `bobby-intel.ts` L520-526 and passed to `bobby-cycle.ts` where it adjusts conviction at L913-917 ONLY for conviction >= 0.5. But the CIO prompt also tells Claude to self-adjust. Should we:
   - (A) Remove the code-level adjustment and trust Claude to apply it?
   - (B) Keep code-level enforcement AND Claude's self-awareness?
   - (C) Make code-level adjustment the ONLY mechanism (remove from prompt)?

2. **Real-time invalidation triggers**: We just added `action:"close"` to the CIO VERDICT. But the CIO only runs every 30 min (cron). Should we add a **lightweight invalidation check** (every 5 min) that:
   - Fetches current price + key indicators
   - Compares to open position thesis
   - Auto-closes if thesis is broken (without full debate)?
   Or is that too dangerous without CIO judgment?

3. **Funding rate velocity**: OKX provides current funding rate. To get velocity, we'd need to store historical rates and compute delta. Propose the schema and logic:
   - Where to store? Supabase table? In-memory?
   - How to compute? Simple delta? Moving average?
   - How to inject into conviction model?

4. **Liquidation data source**: Coinglass has an API but it's paid. OKX has `/api/v5/rubik/stat/contracts/open-interest-volume-strike` for options OI but not liquidation maps. What's the best free/cheap source for liquidation cascade data? Can we approximate it from funding rate + OI changes?

5. **Macro calendar**: Where should this come from? Options:
   - Hardcoded JSON file with known dates (Fed meetings are published yearly)
   - API like `tradingeconomics.com` (paid)
   - Free: scrape FOMC calendar from fed.gov
   Recommend the pragmatic approach for a hackathon-evolved project.

6. **Win rate with break-evens**: Currently break_even is excluded. Three options:
   - (A) Count break_even as 0.5 win (Bayesian)
   - (B) Track separately: win rate, loss rate, break-even rate
   - (C) Only exclude break_even if PnL < 0.5% (current: < 1%)
   Which is statistically soundest?

### Performance
7. **bobby-intel.ts runs 12 parallel fetches**. Some fail silently (OKX blocks Vercel IPs for some endpoints). Should we add:
   - Health check dashboard showing which sources are alive?
   - Degraded mode when < 8 sources respond?
   - Source reliability scoring?

8. **60s cache on intel**: Is this too long? Too short? In high volatility, 60s-old data = stale. In low vol, it's fine. Should cache TTL be regime-aware?

## Files to Read
- `api/bobby-intel.ts` — full file, especially L190-260 (conviction), L450-538 (calibration), L1222+ (briefing builder)
- `src/lib/bobby-technical.ts` — L101-138 (regime weights), L273-466 (indicator scorers), L579-675 (composite)
- `api/bobby-cycle.ts` — L256-301 (contradictions), L910-917 (calibration enforcement), L1083 (execution gate)
- `src/lib/onchainos/risk-manager.ts` — position sizing logic
- `api/forum-resolve.ts` — resolution logic, win/loss determination

## Constraints
- OpenAI only (no Anthropic credits): gpt-4o for CIO, gpt-4o-mini for Alpha/Red Team
- OKX blocks some Vercel IPs → some data cached via Supabase
- Vercel serverless: 300s max per function
- $100 Challenge: max 5x leverage, max 2 concurrent positions, 20% max drawdown
- Cron runs every 30 min

## Desired Output
1. Architecture recommendations for each of the 8 questions above
2. Priority-ordered implementation plan (what to build first, second, third)
3. Schema proposals for any new Supabase tables
4. Risk assessment: what could go wrong with each enhancement
