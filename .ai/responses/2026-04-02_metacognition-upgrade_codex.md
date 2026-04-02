# Codex Response — Metacognition & Intelligence Upgrade

## Key Decisions
1. **Calibration**: Option C — code-only enforcement, remove self-adjust from prompt
2. **Invalidation**: 5-min risk-watch, rules-based. Hard closes only on stop breach, target hit, 2x consecutive technical flips. Soft = flag for next CIO
3. **Funding velocity**: Supabase snapshots, compute deltas, inject as ±0.15 microstructure adjustment
4. **Liquidations**: Phase 1 = proxy from price acceleration + OI drop + funding reset + taker imbalance. Phase 2 = Coinglass paid if proxy shows edge
5. **Macro calendar**: Daily sync into macro_events table from Fed/BLS/BEA. Gate new opens in pre-event windows
6. **Break-even**: Option B — split decisive/break-even. Add effective_hit_rate as secondary
7. **Source health**: Semantic degraded mode. Missing price/tech/microstructure caps conviction and blocks opens (allows closes)
8. **Cache TTL**: Tier-aware — microstructure 15-60s by regime, technical 60-120s, macro 1h+

## Implementation Plan (ordered)
1. Enforce existing metacognition (safe mode sizing, calibration code-only)
2. Fix statistics layer (break-even split, real agreement metric)
3. Build state tables (4 new Supabase tables)
4. Add 5-min risk watcher
5. Add signals: taker imbalance → funding velocity → macro calendar → liquidation proxy

## New Supabase Tables
- agent_market_snapshots
- agent_macro_events
- agent_source_health
- agent_position_rechecks
