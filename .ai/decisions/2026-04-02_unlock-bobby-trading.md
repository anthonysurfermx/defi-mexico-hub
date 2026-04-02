# Decision: Unlock Bobby Trading After 9-Day Freeze

**Date:** 2026-04-02
**Context:** Bobby Agent Trader $100 Challenge — 0 trades in 9 days

## Root Causes
1. Vercel timeout (120s) killed cycles before status update → stuck "running" forever
2. CIO prompt anchored to conviction 3/10 → never passed threshold
3. Red Team destroyed every thesis regardless of signal strength
4. Execution threshold (0.5) + risk-manager (0.60) unreachable in risk-off macro

## Changes Made
1. **maxDuration: 120 → 300s** + catch block marks failed cycles in Supabase
2. **Conviction threshold: 0.5 → 0.35** (cycle) and **0.60 → 0.35** (risk-manager)
3. **CIO prompt rewritten** (Gemini-reviewed): "mandate to test market" not "mandate to trade"
4. **Red Team 3-tier gradient** (Gemini): >0.7 constructive, >0.45 balanced, <0.45 adversarial
5. **Full 1-10 conviction guide** (Gemini): prevents anchoring at 4-5
6. **4 VIBE_PHRASE scenario anchors** (Gemini): bullish, cautious, bearish, sitting out
7. **Always Sonnet for CIO**: better judgment on trade decisions

## Pending (from Codex brief — awaiting response)
- Minimum notional check ($7 may be too small for OKX perps)
- Dynamic "days since last trade" instead of static message
- Stale cycle cleanup cron (if Vercel hard-kills before catch executes)
- Verify Vercel Pro plan (maxDuration 300 requires it)

## Expected Impact
- Next cycle with backend conviction 0.6+ should produce trades
- Position sizing: small (conviction 0.4 × 20% × $100 = ~$8), tight stop
- If first few trades lose, Red Team escalates back to adversarial mode (natural circuit breaker via win rate tracking)
