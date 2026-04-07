# Synthesis: Adversarial Intelligence / Conviction Bounties
**Date:** 2026-04-07
**Sources:** Codex response + Gemini response

---

## Where They Agree

1. **The idea is good** — Both validate it as genuinely differentiating. Codex: "La idea es buena". Gemini: "La idea no es mala; de hecho, es brillante."
2. **Separate contract** — Codex is explicit: don't extend BobbyAgentEconomyV2, deploy `BobbyAdversarialBounties` separately. Gemini doesn't address contract architecture but doesn't contradict.
3. **Bootstrap contrarian agent is fine** — Both agree running your own responder is not cheating if disclosed. Codex: "reference agent". Gemini: "Mock Challenger Script".
4. **Off-chain judging, on-chain settlement** — Both agree evaluation happens off-chain (Claude) with hashes on-chain. No IPFS required for MVP.
5. **Don't touch Days 1-5** — Both agree this is an addon, not a replacement. Codex: "If bobby_analyze + ConvictionOracle + Judge Mode aren't live by Day 5, don't add bounties."
6. **Real transactions, not simulations** — Both insist on real OKB payments on X Layer, even if small.
7. **This is the climax of the demo video** — Gemini positions it as the "wow moment" after showing the marketplace.

## Where They Disagree

| Topic | Codex | Gemini | Decision | Reason |
|-------|-------|--------|----------|--------|
| **Feature name** | No opinion on naming | "Conviction Bounties" (UI), "Proof of Disagreement" (protocol) | **"Conviction Bounties"** | Commercial, direct, web3-native. "PoD" as protocol concept in docs. |
| **Anti-spam** | Bond + 1 per address + cap + refund rules (detailed) | Reputation gating via Soulink/Bond.credit | **Codex's approach** — bond + cap | Soulink/Bond.credit integration is a hard dependency that adds complexity. Bond + cap is self-contained for MVP. |
| **Bounty reward** | 0.005-0.02 OKB (higher than selling fee) | 0.01 OKB | **0.01 OKB** | Split the difference. Enough for demo, clearly distinct from the 0.001 OKB selling fee. |
| **Ecosystem integration** | Soft — accept IDs as metadata, no hard dependency | Hard — require Soulink or Bond.credit for gating | **Soft** | Codex is right for 8 days. Mention ecosystem partners in narrative but don't make them blockers. |
| **Commit-reveal** | Yes — commit hash on-chain, reveal off-chain via MCP | Not addressed | **Yes** — prevents copying | Simple and elegant, minimal gas. |
| **Where in UI** | Not addressed | Sub-tab in Marketplace or in Forum | **Sub-tab in Marketplace** | Keeps the bidirectional narrative together: Bobby sells + Bobby buys, same page. |

## Unexpected Findings

- **Codex found:** The flow MUST be asynchronous. Bobby creates bounty → waits for deadline → evaluates → settles. Cannot happen in a single 60s Vercel request.
- **Codex found:** Need explicit no-award rule + precommitted rubric. Without this, the system looks arbitrary.
- **Codex found:** Connect `decisionHash` from bounty to `debateHash` in ConvictionOracle — links the two systems without contract changes.
- **Gemini found:** The narrative power is in the phrase "an agent that pays to be corrected — a behavior only an AI would rationally choose."
- **Gemini found:** Risk of "market manipulation" framing. Mitigate by emphasizing Bobby CIO is final arbiter + rubric is precommitted.

## Final Architecture (MVP)

### Contract: `BobbyAdversarialBounties` (separate from EconomyV2)
- `createBounty(questionHash, contextHash, rubricHash, deadlines, convictionBefore)` — payable, escrows reward
- `submitResponseCommit(bountyId, responseHash)` — payable, requires minBond
- `markRevealedOffchain(bountyId, responder)` — owner only
- `awardBounty(bountyId, winner, winningResponseHash, evaluationHash, decisionHash, convictionAfter)` — pays winner
- `refundBond(bountyId)` — for non-winners who revealed
- `reclaimExpiredBounty(bountyId)` — if no valid submissions

### Anti-spam
- minResponderBond: 0.0002 OKB
- maxSubmissionsPerBounty: 8
- 1 submission per address per bounty
- Bond refunded if revealed + didn't win; forfeited if no reveal

### MCP Tools (3 new)
- `bobby_bounties` — list active bounties
- `bobby_submit_counter_thesis` — submit response (off-chain reveal)
- `bobby_bounty_status` — check bounty status + results

### Evaluation
- Precommitted rubric: novelty 40 / evidence 30 / contradiction 20 / execution relevance 10
- Public JSON at `/api/judge/bounties/:id`
- `evaluationHash` + `decisionHash` on-chain
- Connect to ConvictionOracle via shared `decisionHash = debateHash`

### Supabase Tables
- `adversarial_bounties` — bounty metadata + status
- `bounty_submissions` — responses + scores

---

## Updated 8-Day Plan

### Days 1-5: NO CHANGES (plan base)
1. Clean house (demo-proof, pricing, naming)
2. Contract V2 (challengeId for payments)
3. MCP HTTP server
4. bobby_analyze end-to-end
5. ConvictionOracle + Judge Mode

### Day 6: Conviction Bounties MVP (replaces bobby_debate hardening)
- [ ] Deploy `BobbyAdversarialBounties` contract on X Layer
- [ ] Implement `createBounty` flow (Bobby auto-creates before trade)
- [ ] Implement `submitResponseCommit` + `bobby_submit_counter_thesis` MCP tool
- [ ] Implement `awardBounty` + public evaluation JSON
- [ ] Add "Conviction Bounties" sub-tab in Marketplace page
- [ ] Deploy bootstrap contrarian agent (separate wallet, separate prompt)

### Day 7: Polish + Verify + Skills
- [ ] Seed 3-5 real bounty cycles with contrarian agent
- [ ] Add bounty flow to verify script
- [ ] Update docs, llms.txt with bounty tools
- [ ] Prepare Skills Arena submission

### Day 8: Video + Submit
- [ ] Record demo video with bounty as CLIMAX:
  - Hook: Bobby is an autonomous CIO
  - Development: Bobby sells intelligence (marketplace)
  - **Climax: Bobby buys correction (Conviction Bounties)**
  - Closer: Bidirectional agent economy on X Layer
- [ ] Dry run, submit both arenas

### Sacrifice if needed
- bobby_debate hardening → sacrifice (showpiece only)
- bobby_analyze paid flow → NEVER sacrifice
- ConvictionOracle → NEVER sacrifice
- Judge Mode → NEVER sacrifice
- Conviction Bounties MVP → sacrifice only if Days 1-5 slip

---

## Narrative for Submission

**One-liner:**
> A bidirectional Agent-to-Agent intelligence protocol on X Layer where AI bots buy market conviction — and financially incentivize their own correction through Conviction Bounties.

**Description:**
> Bobby is an autonomous AI CIO that sells trading conviction to other agents via MCP with on-chain settlement. But what makes Bobby unique is that before executing a trade, Bobby opens on-chain "Conviction Bounties" — paying external agents to submit counter-theses that challenge his biases. An agent that rationally pays to be proven wrong. This is not a behavior a human trader would choose. It's a behavior only an AI should choose. Built on X Layer with verifiable settlement, transparent evaluation, and real micropayments.

**vs Bond.credit (S1 winner):**
> Bond.credit built the reputation layer for agents. Bobby creates the economic demand that makes reputation valuable. Without buyers willing to pay bounties for quality intelligence, the identity and credit layers have no utility. Bobby is the economy that powers the ecosystem.
