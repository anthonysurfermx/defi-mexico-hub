# Synthesis: Hackathon Marketplace Strategy
**Date:** 2026-04-07
**Sources:** Codex response + Gemini response

---

## Where They Agree (implement directly)

1. **Don't try to do everything** — Both say 10 end-to-end use cases in 8 days is suicide. Focus on 2-3.
2. **bobby_analyze as paid flagship** — Both pick this as the priority paid flow.
3. **ConvictionOracle as on-chain proof** — Both see this as the strongest verifiable asset.
4. **Judge-facing proof surface** — Codex wants a "Judge Mode" JSON page, Gemini wants `ai-judge-manifest.json` + UI toggle. Same idea.
5. **Demo buyer agent + verify script** — Codex says "both surfaces needed", Gemini says "auto-transaction loop for Most Active Agent". Aligned.
6. **Demo video is critical** — Both agree it's the difference between 3rd and 1st place.
7. **Kill demo-proof and pricing inconsistency** — Both flag these as credibility killers.
8. **Double submission** — Both support X Layer Arena + Skills Arena with complementary narratives.

## Where They Disagree (high-value decisions)

| Topic | Codex | Gemini | Decision | Reason |
|-------|-------|--------|----------|--------|
| **Payment token** | OKB native only, no USDT | USDC (uses 0.01 USDC in copy) | **OKB native** | Codex is right — stack already uses OKB, switching to USDT/USDC adds ERC-20 approve complexity for zero gain in 8 days |
| **MCP transport** | MCP remote HTTP (Streamable HTTP spec) | Doesn't go deep on transport | **MCP HTTP** | Codex has the stronger technical argument |
| **Contract redeploy** | Yes — needs challengeId to fix replay | Doesn't address replay | **Yes, redeploy** | Replay is P0, can't ship with replayable payments |
| **Naming** | "paid intelligence primitive" | "Bot-to-Bot Network" or "Intelligence Protocol" | **"Intelligence Protocol on X Layer"** | Gemini's instinct to avoid "Agent Commerce" is right, Codex's "primitive" framing is more precise for judges |
| **Playground** | Not mentioned | Low priority, over-engineering | **Skip** | Both lean no, confirmed |
| **bobby_debate** | Optional if stable by day 5 | Include in video as "wow moment" | **Show in video even if not in live demo** | Can record a working debate for video without it being production-stable |

## Unexpected Findings

- **Codex found:** replay vulnerability is real and structural (txHash reuse). Needs contract V2 with challengeId. This was not on our radar.
- **Codex found:** premium-signal.ts line 117 still accepts demo-proof — credibility risk with AI judges scanning the repo.
- **Gemini found:** "Try It Now" button returning static mock data is a trap — judges who click it will see through it. Better to show code snippets / cURL commands instead.
- **Gemini found:** Activity stream being simulated is risky if AI judges cross-reference on-chain data. Must switch to real events.

## Final Plan (8 days)

### Day 1 (April 7) — Clean house
- [ ] Kill `demo-proof` in premium-signal.ts
- [ ] Unify pricing: everything is 0.001 OKB (UI, docs, contract, backend)
- [ ] Fix "Agent Commerce" naming → "Intelligence Protocol" in UI
- [ ] Change "Try It Now" to show cURL/code snippets instead of mock responses

### Day 2 (April 8) — Contract V2
- [ ] Deploy BobbyAgentEconomyV2 with `payMCPCall(bytes32 challengeId, string toolName)`
- [ ] Create Supabase tables: `mcp_payment_challenges`, `mcp_payment_receipts`
- [ ] Update backend to create challenges + verify with one-time consumption

### Day 3 (April 9) — MCP HTTP Server
- [ ] Implement real MCP HTTP transport (initialize, tools/list, tools/call)
- [ ] Wire bobby_analyze as first paid tool through new payment flow
- [ ] Keep legacy /api/mcp-bobby as fallback

### Day 4 (April 10) — bobby_analyze end-to-end
- [ ] Close the full flow: call → 402 → pay → verify → result + proof object
- [ ] Structured JSON response with proof: txHash, challengeId, block, explorerUrl, responseHash
- [ ] Test with real OKB payment on X Layer

### Day 5 (April 11) — ConvictionOracle + Judge Mode
- [ ] Wire ConvictionOracle read flow as second use case
- [ ] Build Judge Mode: `/api/bobby-agent-commerce` JSON + ai-judge-manifest.json
- [ ] Replace simulated activity stream with real on-chain events

### Day 6 (April 12) — bobby_debate (if stable) + Demo agent
- [ ] Attempt bobby_debate as third flow
- [ ] If unstable under Vercel timeouts → fallback to bobby_ta (free tier showcase)
- [ ] Deploy demo buyer agent (every 2-4h, dedicated wallet, real payments)

### Day 7 (April 13) — Verify script + Docs + Skills submission
- [ ] Create `scripts/verify-marketplace.mjs` for judges
- [ ] Update llms.txt, README, docs with correct pricing/flow
- [ ] Prepare Skills Arena submission (bobby-trader skill package)

### Day 8 (April 14) — Video + Polish + Submit
- [ ] Record demo video following Gemini's storyboard (problem → AI-to-AI tx → debate → settlement → skill)
- [ ] Dry run entire flow
- [ ] Submit both arenas
- [ ] Buffer for bugs

## Narrative for Submission

**X Layer Arena:**
> "Bobby is a paid intelligence primitive on X Layer. Other AI agents buy trading conviction over MCP, settle on-chain in OKB, and independently verify every receipt. Not a DEX. Not a wrapper. An intelligence protocol for the agent economy."

**Skills Arena:**
> "We open-sourced the pipes. The Bobby Trader Skill lets any agent buy institutional-grade market analysis with one MCP call and an on-chain micropayment. Plug it into your agent in 30 seconds."
