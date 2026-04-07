# Synthesis: b1nary Integration
**Date:** 2026-04-07
**Sources:** Codex response + Gemini response

---

## Where They Agree (unanimous)

1. **Do NOT put b1nary in the pitch or video core** — Both say it dilutes the X Layer narrative and sends the wrong political signal to OKX judges ("Bobby takes capital to Base/Coinbase's chain").
2. **Do NOT add b1nary to the critical path** — Codex: "don't put it in bobby-cycle.ts". Gemini: "dedica tu tiempo al Judge Mode y Bounties".
3. **If pressed for time, cut b1nary first** — Both agree this is the first thing to sacrifice. Core plan > b1nary.
4. **Post-hackathon, do the deep integration** — Both see real synergy long-term.

## Where They Disagree

| Topic | Codex | Gemini | Decision | Reason |
|-------|-------|--------|----------|--------|
| **How to include** | Camino C: strategy compiler + shadow testnet execution | Use case card in marketplace only, b1nary as "client" buying Bobby's data | **Hybrid: card + strategy endpoint** | Codex's architecture is better (real API calls), Gemini's narrative flip is better (b1nary buys from Bobby, not Bobby executes on b1nary) |
| **Narrative direction** | Bobby uses b1nary (downstream execution) | b1nary uses Bobby (upstream intelligence) | **Gemini's flip** | "Intelligence Export" > "Capital Flight". X Layer stays center of gravity |
| **Time investment** | Half day max on Day 7 | Just add the card, forget about it | **Half day on Day 7 IF plan base is on track** | Codex's strategy endpoint adds real substance without major risk |
| **Payment type for use case** | Not specified | x402 PAID 0.05 USDC (higher B2B pricing) | **x402 PAID (0.01 OKB)** | Keep consistent with OKB-only story from earlier synthesis |

## Unexpected Findings

- **Gemini found:** Including b1nary is a "political error" — judges want TVL on THEIR chain, not capital leaving to Base.
- **Codex found:** SHORT → covered call only works with spot inventory. Bobby has no spot on Base. Neutral → straddle is irresponsible. Only LONG → sell put makes sense.
- **Codex found:** Strategy selection should be deterministic, not LLM-driven. The LLM already did its work in the debate.
- **Both found:** The narrative flip is key — b1nary as a CLIENT of Bobby's intelligence, not Bobby as a user of b1nary's execution.

## Final Decision

### What to build (Day 7, if plan base is on track)
1. `api/b1nary-strategy.ts` — async sidecar, NOT in bobby-cycle critical path
   - Fetches `/spot`, `/capacity`, `/prices` from b1nary API
   - Deterministic strategy selector: LONG high conviction → sell put, else no trade
   - Saves recommendation package to Supabase with snapshot hash
   - Cache with graceful degradation (status: degraded, source: cached)

2. Use case card #11 in marketplace:
   - **Name:** `AI OPTIONS WRITER`
   - **Node:** `NODE_11`
   - **Description:** "Cross-chain structured products protocols query Bobby's adversarially-adjusted conviction to price options. Intelligence stays on X Layer; execution happens wherever the protocol lives."
   - **Flow:** `READ bobby conviction → ADJUST via bounty → COMPILE b1nary strategy → RECOMMEND optimal strike/expiry`
   - **Interface:** `MCP: bobby_analyze + b1nary API`
   - **Payment:** `x402` (0.01 OKB)
   - **Status:** `READY`

3. Optional: Base Sepolia shadow execution script for demo appendix

### What NOT to build
- No b1nary in bobby-cycle.ts
- No covered calls (no spot inventory)
- No straddles
- No b1nary in video narration
- No Base mainnet execution

### Sacrifice rule
If Days 1-6 slip at all → cut b1nary completely. Zero hesitation.
