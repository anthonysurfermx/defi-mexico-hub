# Bobby Agent Investor Mode

## Product Split

Keep two decision surfaces, not one blended blob:

1. `trade` mode
- Short horizon
- Entry / stop / target / leverage
- Existing conviction scoring and execution path stay intact

2. `invest` mode
- Long horizon
- Risk tolerance, diversification, capital preservation
- Portfolio allocation output, not a trade ticket

3. `hybrid` mode
- Portfolio first
- Optional tactical sleeve second
- Best fit for questions like "Tengo $1,000, ¿en qué invierto ahorita?"

## Core Decision

Do **not** turn [`api/bobby-cycle.ts`](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/api/bobby-cycle.ts) into the general investor Q&A engine.

Use it as the autonomous market cycle for:
- Trade discovery
- Trade rejection
- Yield-while-you-wait

Use chat and debate orchestration for investor questions:
- [`api/openclaw-chat.ts`](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/api/openclaw-chat.ts)
- [`src/components/adams/AdamsChat.tsx`](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/src/components/adams/AdamsChat.tsx)
- [`src/lib/advice-mode.ts`](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/src/lib/advice-mode.ts)

Reason: autonomous cycle asks "what should Bobby do now?" while investor chat asks "what should this user do with their capital?" Those are different objectives, risk models, and output contracts.

## Intent Detection

Route every market question through `advice_mode`:

- `trade`
  - `long`, `short`, `entry`, `stop`, `target`, `leverage`, `perps`, `setup`
- `invest`
  - `invest`, `portfolio`, `allocation`, `savings`, `long term`, `yield`, `crypto or stocks`
- `hybrid`
  - both sets of cues in the same question

Implementation:
- Deterministic first-pass in [`src/lib/advice-mode.ts`](/Users/mrrobot/Documents/GitHub/defi-mexico-hub/src/lib/advice-mode.ts)
- Pass the result into prompts as `<ADVICE_MODE>...</ADVICE_MODE>`
- Keep existing router for top-level UX intents like `price`, `portfolio`, `help`

## Debate Contracts

Use the same 3 agents, but change what they debate.

### Trade

- Alpha Hunter: best setup now
- Red Team: kill the setup
- CIO: `conviction X/10` + concrete play

### Invest

- Alpha Hunter: highest-upside allocation thesis
- Red Team: concentration, drawdown, operational, and suitability attack
- CIO: final allocation plan with structured portfolio JSON

Recommended CIO contract:

```text
PORTFOLIO: {
  "mode": "invest",
  "riskProfile": "conservative|balanced|aggressive",
  "horizon": "short_term|medium_term|long_term",
  "cashPct": 10,
  "allocations": [
    { "symbol": "BTC", "pct": 25, "bucket": "core", "vehicle": "spot", "rationale": "..." }
  ],
  "tacticalTrade": {
    "enabled": false,
    "symbol": null,
    "direction": "none",
    "setup": null
  }
}
```

## Yield Integration

Do not bolt yield on as a separate product. Treat it as a portfolio sleeve.

Investor-mode allocation buckets:
- Core beta: `BTC`, `ETH`
- Defensive carry: `USDC` yield on Aave / similar
- Equity beta: `SPY`, `QQQ`, `NVDA`
- Reserve cash: explicit dry powder
- Optional tactical sleeve: one high-conviction trade

For MVP:
- Reuse existing `agent_yield_positions` only for Bobby's autonomous treasury logic
- In chat investor mode, mention yield as a sleeve and store the recommendation in JSON only

## Persistence

Week 1 recommendation: **do not create a new normalized portfolio table yet**.

Store investor outputs in existing debate records:
- `forum_threads.trigger_data.advice_mode = "invest" | "hybrid"`
- `forum_threads.trigger_data.portfolio_plan = { ... }`
- `forum_posts` keep the natural-language debate

Add dedicated tables only when you need:
- rebalance history
- realized investor performance
- recurring portfolio updates
- user-approved execution

Future tables:
- `agent_portfolio_plans`
- `agent_portfolio_allocations`
- `agent_portfolio_rebalances`

## Conviction Model

Do **not** reuse trade conviction as-is for investing.

Use two scores:
- `trade_conviction`
  - timing confidence
  - entry/exit quality
- `allocation_confidence` or `suitability_score`
  - fit to horizon, risk, and diversification

MVP shortcut:
- Keep existing trade conviction untouched
- In investor mode, output `suitability X/10` in text and in `PORTFOLIO` JSON

## PTS / Global Investor Behavior

For `/demopts`, assume:
- beginner audience
- Spanish first
- conservative by default when risk is missing
- explain simply, no jargon wall

Default investor policy for PTS:
- no leverage unless explicitly requested
- portfolio before tactical trade
- include cash buffer
- if yield is included, explain liquidity and risk plainly

## 1-Week MVP

1. Add `trade / invest / hybrid` detector
2. Make debate prompts mode-aware
3. Add `PORTFOLIO:` structured output for investor mode
4. Stop auto-publishing / auto-executing investor answers as trades
5. Add PTS beginner defaults in prompt context

## Phase 2

After MVP is live:

1. Move shared debate contracts out of chat into reusable prompt builders
2. Add portfolio-plan persistence tables
3. Add rebalance cycle separate from `bobby-cycle`
4. Add investor performance tracking
5. Wire real yield inventory into investor-mode recommendations
