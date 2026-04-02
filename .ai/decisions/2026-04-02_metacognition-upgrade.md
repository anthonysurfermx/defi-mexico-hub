# Decision: Bobby Metacognition & Intelligence Upgrade

**Date:** 2026-04-02
**Inputs:** Codex architecture review + Gemini UX/prompt review

## Synthesis: Where They Agree
1. **Calibration must be enforced in code, not prompt** (both agree — implemented)
2. **Break-even stats must be split** (Codex B, Gemini didn't address — implemented)
3. **Liquidation data is #1 missing signal** (both rank it highest)
4. **Safe mode must reduce sizing** (Codex explicit, Gemini implicit — implemented)
5. **Source health tracking needed** (both agree)

## Synthesis: Where They Disagree
| Topic | Codex | Gemini | My Decision |
|-------|-------|--------|-------------|
| CIO split call | Not mentioned | YES — Analyst + CIO | **YES** — implement Phase 2. Reduces token waste. |
| XML structure | Keep flat, tier cache | Hierarchical 4-layer | **Hierarchical** — Gemini's reasoning on attention is sound |
| #2 missing data | Funding velocity | Options IV (Deribit) | **Funding velocity first** (free, easier), IV second |
| #3 missing data | Macro calendar | CVD spot vs perp | **Macro calendar first** (Codex has schema ready), CVD second |
| Debate quality | Not addressed | Post-Mortem Oracle | **YES** — cheap async call after resolution |
| Metacognition UX | Not addressed | Trust Index + Regime Heatmap + Trendline | **YES** — implement all 3 |

## Implementation Plan (Phased)

### Phase 1: Data Layer (this session — partially done)
- [x] Enforce safe mode in risk-manager
- [x] Calibration code-only (remove prompt self-adjust)
- [x] Break-even stats split
- [x] State tables created (migration pending)
- [ ] Hierarchical XML restructure in bobby-intel.ts

### Phase 2: Prompt Architecture (next session)
- [ ] CIO split call: Analyst (gpt-4o-mini) → CIO (gpt-4o)
- [ ] Bobby Voice Guide applied to all 3 endpoints
- [ ] Data Citation Chips: prime LLM to output [Tag] markers

### Phase 3: New Signals (next week)
- [ ] Taker imbalance (OKX API, free)
- [ ] Funding velocity + OI velocity (Supabase snapshots)
- [ ] Macro calendar (FOMC/CPI/PCE seed)
- [ ] Liquidation proxy (price accel + OI drop + funding reset)

### Phase 4: Metacognition UX (next week)
- [ ] Bobby Trust Index composite score
- [ ] Skill by Regime heatmap
- [ ] Actual vs Predicted trendline
- [ ] Post-Mortem Oracle (async after resolution)
- [ ] Conviction Waterfall in Forum UI
- [ ] Post-Mortem stamp (WIN/LOSS)

### Phase 5: Advanced (future)
- [ ] Options IV from Deribit
- [ ] CVD spot vs perp
- [ ] 5-min risk watcher
- [ ] Coinglass paid liquidation feed (if proxy shows edge)
