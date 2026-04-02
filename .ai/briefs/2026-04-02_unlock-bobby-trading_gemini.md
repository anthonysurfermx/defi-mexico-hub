# Brief for Gemini: Review Bobby Trading Unlock — UX & Prompt Engineering

## Context
Bobby Agent Trader is a 3-agent AI debate system for crypto trading (OKX CEX, $100 Challenge). It uses Alpha Hunter (bullish), Red Team (bearish), and CIO Bobby (judge). Every debate is visible to users in the Forum page. Bobby hasn't traded in 9+ days — we just fixed the technical blockers. Need your review on prompt quality and user experience.

## What Changed

### The Debate Prompts Were Rewritten

**Red Team (before):**
> "You are Red Team — 15-year risk veteran who lost $30M trusting 'obvious' trades. Destroy Alpha's thesis. Every paragraph is a kill shot."

**Red Team (after, when backend signals are strong):**
> "You are Red Team — risk analyst. Challenge Alpha's thesis but be FAIR. If the technical setup is genuinely strong, acknowledge it and focus on sizing/stop placement rather than killing the trade entirely. Your job is risk MANAGEMENT, not risk AVOIDANCE."

**CIO (before):**
- Sitting-out example anchored at conviction:3
- No awareness of backend quantitative score
- Used Haiku when market "looked weak" (saved cost, but worse judgment)

**CIO (after):**
- Backend signal bias injected: "Quantitative model scores conviction at X/10. You have been sitting out for 9+ days. If ANY reasonable setup exists, TAKE IT with tight risk management."
- Conviction guide: "4-5/10 = small exploratory position with tight stop. You don't need 8/10 to act."
- Always uses Sonnet for better decision quality
- Examples show conviction:5 (actionable) instead of conviction:3 (passive)

### The Conviction Thresholds Were Lowered
- Execution gate: 0.5 → 0.35 (5/10 → 3.5/10)
- Risk manager minimum: 0.60 → 0.35

## Questions for Gemini

### 1. Prompt Quality — CIO Trade Bias
The new CIO prompt includes this when backend conviction > 0.6:

```
BACKEND SIGNAL BIAS: The quantitative model scores conviction at 7.5/10. This is STRONG. You have been sitting out for 9+ days — the $100 Challenge needs trades to prove the system works. If ANY reasonable setup exists, TAKE IT with tight risk management (small size, tight stop). Sitting out forever is worse than a small controlled loss. Your job is to TRADE, not just watch.
```

**Is this too aggressive?** Does "your job is to TRADE, not just watch" undermine Bobby's sovereignty as CIO? Could it cause Bobby to force bad trades? How would you rephrase it to maintain urgency without sacrificing judgment quality?

### 2. Red Team Dynamic Intensity
Red Team now has two modes:
- **Strong signals (backend > 0.6)**: "be FAIR... risk management, not risk avoidance"
- **Weak signals (backend < 0.6)**: Original aggressive "destroy, kill shot" mode

**Is this bifurcation clean enough?** Should there be a gradient instead of a binary switch? For example:
- 0.3-0.5: Full aggression
- 0.5-0.7: Balanced (challenge but acknowledge)
- 0.7+: Focus on risk management / position sizing

### 3. User-Facing Impact — Forum Quality
Users see these debates in the Forum page (`/agentic-world/forum` and `/demopts/forum`). The debate quality affects trust.

**Before**: Red Team was nuclear → CIO always said "sitting out" → users saw Bobby as paralyzed
**After**: Red Team is constructive when signals are strong → CIO more likely to trade → users see action

**Does this feel authentic?** Or will users notice that Red Team suddenly became "soft" and lose trust in the adversarial process? Should we add visible metadata like "Signal strength: STRONG — Red Team in risk-management mode" so users understand why the tone shifted?

### 4. Conviction Guide Anchoring
The new prompt says: "4-5/10 = small exploratory position with tight stop. Even 4/10 is enough to take a SMALL trade."

**Risk of anchoring at 4-5?** Will the CIO now cluster most outputs at 4-5/10 instead of using the full 1-10 range? Should we add: "7-8/10 = full position, 9-10/10 = max conviction, add on dips"?

### 5. Vibe Phrase Quality
The VIBE_PHRASE examples changed:
- Before: "DXY at 126 is crushing everything. Cash is king today. Netflix time." (passive, boring)
- After: "BTC holding 84k with decent flow. Small position, tight stop, let it prove itself." (active, tradeable)

**Are these good anchors for the model?** Should we provide 3-4 examples covering different scenarios (bullish, bearish, neutral, cautious-but-trading)?

### 6. Language Consistency
Bobby debates in Spanish (for the cron cycle). The CIO prompt says: `2 short paragraphs of reasoning in ${lang === 'es' ? 'Spanish' : 'English'}.`

But the BACKEND SIGNAL BIAS block is always in English. **Should this be bilingual?** Or is English-for-system-instructions + Spanish-for-output acceptable?

## Files to Read
- `api/bobby-cycle.ts` — lines 748-800 (debate prompts), focus on Alpha, Red Team, CIO prompt changes
- `api/openclaw-chat.ts` — lines 172-237 (user-facing CIO prompt, for comparison — this is the chat version, not the cycle version)
- Recent forum debate examples: conviction 0.3-0.47, mostly "sitting out" or "direction: none"

## Design System Context
- Stitch Kinetic Terminal aesthetic (dark bg, green primary)
- PTS white-label uses gold #F8CF2C on navy #11121e
- Forum page shows debates with agent colors: Alpha (green), Red Team (red), CIO (amber)
- Users are mostly Spanish-speaking traders (PTS Colombia) and DeFi Mexico community

## Desired Output
1. Rewrite suggestions for the CIO and Red Team prompts (if needed)
2. UX recommendation for showing signal strength context in the Forum
3. Assessment of whether the conviction guide will cause anchoring
4. 3-4 VIBE_PHRASE examples for different market scenarios
