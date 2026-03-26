# Claude Code as My Head of Product: Building an AI Trading Agent with 3 AIs

*What I'm discovering using Claude Code, Codex, and Gemini as a product team while building Bobby Agent Trader for a hackathon.*

---

## This isn't a tutorial. It's what I'm learning along the way.

There are plenty of articles explaining what Claude Code is, how the agentic loop works, what tools are. Great articles. But when you finish reading them you think: *"Ok, now what do I actually do with this?"*

I thought the same thing. And what I'm going to share here isn't a definitive guide — it's what I've been discovering while building a real product with real deadlines and real problems. Some things worked out well. Others I had to redo three times. But the pattern I found changed how I work.

What I discovered is that Claude Code isn't just a tool for writing code faster. With the right setup, it becomes something like a **Head of Product** — it questions decisions, delegates to other models when the problem requires it, and synthesizes different perspectives into a coherent implementation.

The product: **Bobby Agent Trader** — a system where 3 AI agents debate the markets for you and you decide. I'm building it for the X Layer hackathon, with real users, on-chain payments, and a live Telegram bot.

The workflow I found uses **3 different AIs as if they were a product team**:

- **Claude Code** → Head of Product + Lead Architect
- **Codex (OpenAI)** → Backend Architect / Code Reviewer
- **Gemini** → UX Designer

I'm not saying this is the best way to do it. But it's the one that's working for me, and I think it's worth sharing.

---

## The Product: Bobby Agent Trader

Before the workflow, you need to understand what we're building.

Bobby is an AI Trading Agent that works like this:

1. **Alpha Hunter** scans the market for opportunities (on-chain data, whale signals, Polymarket smart money)
2. **Red Team** destroys weak theses — looks for reasons the trade will fail
3. **Bobby CIO** sees both perspectives and makes the final call with a conviction score

It's not another bot telling you "buy BTC." It's a **debate system** where three agents with opposing perspectives reach a fundamented conclusion. And all the logic is on-chain — the trade is committed BEFORE the outcome is known.

It's still a work in progress — 44 registered users, 3 active traders receiving signals, Telegram bot running, real payments in OKB/USDT on X Layer. Far from perfect, but enough to learn a lot in the process.

### The real architecture

```
defi-mexico-hub/
│
├── api/                          # Vercel serverless functions
│   ├── agent-run.ts              # 1,642 lines — main 8h cycle orchestrator
│   │                             #   debate → risk gate → Kelly sizing → execute
│   ├── bobby-intel.ts            # 1,116 lines — fast intelligence snapshot
│   │                             #   regime detection, dynamic conviction, mood
│   ├── bobby-cycle.ts            # User-facing debate cycle (every 5min)
│   ├── explain.ts                # Claude Haiku streaming analysis via SSE
│   ├── telegram-webhook.ts       # Bot → group → activation link
│   └── telegram-access.ts        # Payment verification + subscription
│
├── src/pages/                    # 11+ views, Stitch terminal aesthetic
│   ├── BobbyAgentTraderPage.tsx  # Main terminal — debates + signals
│   ├── BobbyChallengePage.tsx    # Live PnL tracking + debate history
│   ├── BobbyMetacognitionPage.tsx # NEW — calibration + debate quality
│   ├── BobbyTelegramPage.tsx     # Payment flow (6 states)
│   ├── AgentForumPage.tsx        # Bloomberg-style debate forum
│   └── ...                       # Analytics, History, Agents, Portfolio
│
├── src/components/kinetic/       # Stitch Design System
│   └── KineticShell.tsx          # Terminal frame + nav + ticker tape
│
└── supabase/migrations/          # Schema evolution
    ├── 20260314_agent_tables.sql  # cycles, trades, signals, config
    └── 20260315_add_metacognition_columns.sql  # mood, conviction, safe_mode
```

This is not a weekend prototype. It's **2,758+ lines of agent logic**, real on-chain payments, and a Telegram bot dispatching signals every 5 minutes. There's still a lot to improve, but it's functional.

---

## Workflow 1: The Cross-Brief — When the Problem is Complex

### The situation

Bobby had a broken payment flow. The user connected their wallet from Telegram to activate the bot in their group, and after connecting: white screen. Nothing. The payment was simulated, the bot token was hardcoded in the source code, and there was no real verification of anything.

My first instinct was: "well, I'll fix the blank screen bug and move on."

But Claude Code — with the product context I had given it — made me rethink the problem.

### The real workflow

**Step 1: I explained the problem to Claude Code.**

I didn't say "fix the bug." I gave full context: what the flow does, where it breaks, which files are involved, and what we need for the hackathon in 3 days.

**Step 2: Claude Code designed two briefs — one for Codex, one for Gemini.**

This is what most people don't do. Instead of solving everything alone, Claude Code acted as PM and delegated. These are the real briefs (trimmed):

#### Brief for Codex (Backend Architect)

```
CODEX — REVIEW: x402 Payment Flow for Telegram

CURRENT STATE:
1. Bot is added to group → webhook creates record in telegram_groups
2. Bot sends link: defimexico.org/agentic-world/bobby/telegram?activate=GROUP_ID
3. User opens link → sees receipt (0.01 USDT, X Layer, 30 days)
4. Click "CONNECT WALLET" → Reown/WalletConnect modal opens
5. ❌ PROBLEM: After connecting, white screen
6. The /api/telegram-access endpoint accepts any payment_proof

RELEVANT FILES:
- api/telegram-access.ts    (line 169: accepts any proof)
- api/telegram-webhook.ts   (line 14: bot token hardcoded)
- src/pages/BobbyTelegramPage.tsx (line 85: auto-trigger race)

QUESTIONS:
1. Real x402 or simulated for hackathon (3 days)?
2. Does Coinbase facilitator work on X Layer (eip155:196)?
3. Does USDT on X Layer support EIP-3009?
4. Explicit button post-connect or auto-trigger with delay?
5. How do I verify server-side that the payment was made?

Give me your pragmatic recommendation. YES you can write code.
```

#### Brief for Gemini (UX Designer)

```
GEMINI — UX: Payment Flow Fix for Telegram Activation

CURRENT PROBLEMS:
1. User opens link from Telegram ✅
2. Sees receipt card (0.01 USDT, X Layer, 30 days) ✅
3. Click "CONNECT WALLET" → wallet modal ✅
4. Connects wallet → ❌ white screen
5. No "payment successful" feedback
6. No redirect back to Telegram

I NEED YOU TO DESIGN:
- STEP 1: Receipt (already exists)
- STEP 2: Post-Connect (MISSING) — wallet visible + explicit button
- STEP 3: Signing (MISSING) — loading state
- STEP 4: Verifying (MISSING) — block confirmation
- STEP 5: Success (MISSING) — NODE ACTIVATED + deeplink Telegram
- STEP 6: Error (MISSING) — retry + help

Give me the UX design for each state. DO NOT touch code.
```

Notice the difference: I ask Codex for **technical decisions with trade-offs**. I ask Gemini for **visual design with specific states**. Claude Code knew what it needed from each one.

**Step 3: Codex and Gemini responded with their perspectives.**

#### Codex's Response — found 5 problems nobody asked for

```
My pragmatic recommendation for 3 days:

I wouldn't ship fake x402 and I wouldn't force real x402
on X Layer if you don't have a confirmed facilitator for eip155:196.

I'd do real on-chain payment on X Layer with USDT + server-side
verification by tx_hash.

PROBLEMS FOUND:

[P0] Bot token hardcoded in api/telegram-access.ts (line 16)
     and api/telegram-webhook.ts (line 14). Rotate it NOW.

[P0] Payment completely simulated. api/telegram-access.ts (line 169)
     accepts any payment_proof.

[P1] Auto-trigger of payment in BobbyTelegramPage.tsx (line 85)
     is a race condition. Don't fix it with delay; remove it.

[P1] No admin verification. Any member with the link can
     activate the group.

[P1] The bot decides if a group is active by checking bot_status,
     not the actual subscription. If it expires, it keeps responding.
```

I asked for a payment review. Codex gave me back **a full security audit** with P0/P1 priorities. That's what happens when you give it enough context.

#### Gemini's Response — designed all 6 states as terminal UI

```
STEP 2: Post-Connect (The missing bridge)
┌─────────────────────────────────────────────┐
│  ● ACTIVATE BOBBY IN "DeFai"                │
│                                             │
│  🟢 0x1A2...4Ff connected                  │
│                                             │
│  ⚠️  Wallet authorized. You must now        │
│     broadcast the activation protocol       │
│     onto X Layer.                           │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ✦ SIGN & PAY 0.01 USDT ✦         │    │
│  │    (pulsating green button)         │    │
│  └─────────────────────────────────────┘    │
│                                             │
│  Standard X Layer fees apply (~0.0001 OKB)  │
└─────────────────────────────────────────────┘

STEP 5: Success
┌─────────────────────────────────────────────┐
│  ║ border: neon green glow                  │
│  ║ shadow-[0_0_30px_#00FF66]               │
│                                             │
│        ✅ NODE ACTIVATED: DeFai             │
│                                             │
│  Bobby is now fully integrated.             │
│  Subscription valid until 22-04-2026.       │
│                                             │
│  ┌─────────────────────────────────────┐    │
│  │  ✈ OPEN REPORTING CHANNEL (TG)     │    │
│  └─────────────────────────────────────┘    │
│          Return to Dashboard →              │
└─────────────────────────────────────────────┘

UX INSIGHT: The deeplink uses tg://resolve?domain=bot_name
to pull the user out of the browser directly into the Telegram chat.
Creates a "magical" effect connecting web → chat.
```

Gemini didn't just design the states. It thought about details a dev wouldn't have considered: the pulsating button to grab attention post-connect, the deeplink to close the web-to-Telegram loop, and the amber warning box to let the user know there's still a step left.

**Step 4: Claude Code synthesized both responses and implemented.**

It didn't copy and paste. It synthesized. And this is what it produced:

#### The real code Claude Code wrote

**From Codex it took:** real payment with `writeContract` + `sendTransaction`, not simulated.

```typescript
// BobbyTelegramPage.tsx — the real payment handler
const handlePay = async () => {
  setUiState('SIGNING');
  try {
    if (paymentToken === 'OKB') {
      // Native OKB transfer — simple, user already has OKB for gas
      sendTransaction({
        to: BOBBY_WALLET,
        value: PAYMENT_AMOUNT_OKB,  // 0.001 OKB
        chainId: XLAYER_CHAIN_ID,   // 196
      });
    } else {
      // USDT ERC-20 transfer via writeContract
      writeContract({
        address: USDT_CONTRACT,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [BOBBY_WALLET, parseUnits('0.01', 6)],
        chainId: XLAYER_CHAIN_ID,
      });
    }
  } catch (err: any) {
    if (err.message?.includes('rejected') || err.code === 4001) {
      setUiState('ERROR');  // User rejected in wallet
      setErrorMsg('Transaction rejected. Try again when ready.');
    }
  }
};
```

**From Gemini it took:** the 6 states with smooth transitions and exact copy.

```typescript
// The 6 flow states — implemented as a state machine
type UiState = 'IDLE' | 'CONNECTED' | 'SIGNING' | 'VERIFYING' | 'SUCCESS' | 'ERROR';

// CONNECTED state — the "missing bridge" that Gemini designed
{uiState === 'CONNECTED' && (
  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
    {/* Wallet indicator — green dot + truncated address */}
    <div className="flex items-center gap-2 text-green-400">
      <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
      {address?.slice(0, 6)}...{address?.slice(-4)}
    </div>

    {/* Amber warning box — Gemini's UX insight */}
    <div className="border border-amber-500/30 bg-amber-500/5 rounded p-3">
      Wallet authorized. Broadcast activation protocol onto X Layer.
    </div>

    {/* Pulsating button — Gemini's design, Codex's logic */}
    <button onClick={handlePay}
      className="bg-green-500 hover:bg-green-400 animate-pulse text-black
                 font-bold py-3 px-6 rounded-lg">
      ✦ SIGN & PAY {paymentToken === 'OKB' ? '0.001 OKB' : '0.01 USDT'} ✦
    </button>
  </motion.div>
)}
```

**From Codex's P0 fix:** removed the hardcoded bot token.

```typescript
// BEFORE (P0 security issue — Codex found it):
const BOT_TOKEN = '8605994324:AAH5aAvaVxPYrmGM_yjPJQL0nmlY5yd1qM8';

// AFTER:
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
```

#### The real terminal output

```bash
$ npm run build 2>&1 | grep -E "error|✓ built"
✓ built in 9.14s

$ git add src/pages/BobbyTelegramPage.tsx api/telegram-webhook.ts api/telegram-access.ts
$ git commit -m "feat: Real USDT payment on X Layer for Telegram activation"
[main a22bbe8] feat: Real USDT payment on X Layer for Telegram activation
 3 files changed, 183 insertions(+), 58 deletions(-)

$ git push
To https://github.com/anthonysurfermx/defi-mexico-hub.git
   8baa10b..a22bbe8  main -> main
```

**3 files changed, 183 new lines, 58 removed. Build passed. Auto-deploy on Vercel.** All in one conversation session.

### What this workflow taught me

I don't think any single AI would have produced this result. And honestly, I alone would probably have fixed the blank screen without questioning whether the payment should be real:

- **Claude Code alone** would have patched the bug without questioning the payment architecture
- **Codex alone** would have given the technical analysis but without implementing anything
- **Gemini alone** would have designed the UX but without considering X Layer limitations

What I found is that the **cross-brief** works: give each model the specific context it needs, let them weigh in from their expertise, and then synthesize. It's not magic — it's basically what a PM does with their team. Just faster.

---

## Workflow 2: Metacognition — When the Product Needs to Think About How It Thinks

### The situation

Bobby was already working. Debating, executing trades, sending signals to users. But there was a fundamental product problem: **how does the user know if Bobby is any good?**

It's not enough for Bobby to say "LONG BTC with 74% conviction." The user needs to know:
- Does Bobby calibrate well? When it says 70%, does it actually win 70% of the time?
- Are the debates high quality? Or do the agents repeat the same arguments?
- Does Bobby learn from mistakes? Or repeat the same ones?

### The real workflow

**Step 1: Claude Code explored the entire Bobby codebase.**

It used an `Explore` SubAgent — a read-only specialized agent that analyzes code without filling my main context. In 5 minutes it had a complete map of 1,600+ lines of agent logic:

```
┌─────────────────────────────────────────────────────────┐
│                 BOBBY AGENT ARCHITECTURE                │
│                                                         │
│  ┌──────────┐    ┌──────────┐                          │
│  │  ALPHA   │    │ RED TEAM │   ← run in PARALLEL      │
│  │  HUNTER  │    │  DEVIL'S │                          │
│  │          │    │ ADVOCATE │                          │
│  │ "Buy ETH │    │ "CPI in  │                          │
│  │  at 64k" │    │  6h, fake│                          │
│  │          │    │  breakout"│                          │
│  └────┬─────┘    └────┬─────┘                          │
│       │               │                                 │
│       └───────┬───────┘                                │
│               ▼                                         │
│       ┌──────────────┐                                 │
│       │  BOBBY CIO   │  ← sees both, decides           │
│       │  (Judge)     │                                 │
│       │              │                                 │
│       │ conviction:  │                                 │
│       │   0.74       │                                 │
│       │ action:      │                                 │
│       │   LONG ETH   │                                 │
│       └──────┬───────┘                                 │
│              ▼                                          │
│       ┌──────────────┐                                 │
│       │  RISK GATE   │  ← deterministic, not LLM       │
│       │              │                                 │
│       │ Kelly sizing │                                 │
│       │ Safe Mode    │                                 │
│       │ Position cap │                                 │
│       └──────────────┘                                 │
└─────────────────────────────────────────────────────────┘
```

What the SubAgent found in the real code:

```typescript
// api/bobby-intel.ts — Dynamic Conviction Formula
// This is what makes Bobby "regime-aware"

function calculateDynamicConviction(
  okxScore: number,      // 0-1: on-chain whale activity
  polyConsensus: number,  // 0-1: Polymarket smart money
  latencyMs: number,      // signal age — old signals die
  btcVolatility: number   // BTC 24h change %
): number {

  // LATENCY PENALTY — signals decay exponentially
  // 5 min = 0 penalty, 60 min = 0.22, >60 min = capped at 0.5
  const latencyPenalty = Math.min(0.5, 0.02 * Math.exp(0.04 * minutes));

  // REGIME-AWARE WEIGHTING — this is the key insight
  // High vol (BTC >5%): trust on-chain 70%, crowd 30%
  //   → whales act first, crowd lags in panic
  // Low vol (BTC <2%):  trust on-chain 30%, crowd 70%
  //   → prediction markets reveal insider edge in calm
  const okxWeight = 0.3 + ((btcVol - 2) / 3) * 0.4;

  return clamp((okxScore * okxWeight) + (polyConsensus * polyWeight) - latencyPenalty, 0, 1);
}
```

```typescript
// api/agent-run.ts — Safe Mode (self-preservation)
// Win rate < 70% → Bobby becomes defensive

const mood = winRate >= 0.7 ? 'confident'
           : winRate >= 0.5 ? 'cautious'
           : 'defensive';

if (winRate < 0.7) {
  safeMode = true;
  confidenceThreshold = 0.8;  // was 0.7
  maxExposure = 0.15;         // was 0.30 (half)
  // Kelly sizing: quarter-kelly instead of half-kelly
}
```

Bobby already had an intelligence system more sophisticated than I remembered (the SubAgent reminded me). But **the user couldn't see any of it**. From the outside, it was a black box that said "LONG BTC 74%". And that's where product thinking helped: we didn't need more intelligence — we needed to **show** the intelligence we already had.

**Step 2: I identified 4 upgrades with Claude Code as PM.**

I didn't say "add an analytics page." We discussed which metrics matter from the user's perspective:

- **A: Prediction Calibration** — Is Bobby overconfident? If it says 80% conviction but only wins 50%, there's a problem
- **B: Regime Awareness Display** — What regime are we in and how does it affect decisions?
- **C: Self-Correction Loop** — When Bobby loses, do the agents acknowledge it in the next cycle?
- **D: Debate Quality Scoring** — Are the arguments specific and citing data, or generic?

**Step 3: Parallel implementation with SubAgents.**

This is where Claude Code shines. Instead of implementing sequentially (1 feature -> test -> another feature -> test), it launched **3 SubAgents in parallel** — like 3 developers working on different branches at the same time:

```
┌─────────────────────────────────────────────────────────────┐
│                    CLAUDE CODE (Orchestrator)                │
│                                                             │
│  "Launching 3 agents in parallel. They're independent —     │
│   none needs the output of another."                        │
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ SubAgent 1  │  │ SubAgent 2  │  │ SubAgent 3  │        │
│  │             │  │             │  │             │        │
│  │ BACKEND     │  │ DASHBOARD   │  │ DEBATE UI   │        │
│  │ Calibration │  │ Recharts    │  │ Forum       │        │
│  │ Self-correct│  │ ComposedChart│ │ Alpha/Red/  │        │
│  │ Debate score│  │ Framer Motion│ │ CIO cards   │        │
│  │             │  │             │  │             │        │
│  │ 4 files     │  │ 1 new page  │  │ 1 redesign  │        │
│  │ modified    │  │ + 2 modified│  │             │        │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘        │
│         │ 3min           │ 5min           │ 2min           │
│         └────────────────┼────────────────┘                │
│                          ▼                                  │
│              npm run build → ✓ built in 9.05s              │
│              git push → live on Vercel                      │
└─────────────────────────────────────────────────────────────┘
```

Each SubAgent had a complete, autonomous prompt. Example from SubAgent 2:

```
"Create BobbyMetacognitionPage.tsx with:
- 4 stat cards: Calibration Error, Win Rate + mood, Regime + F&G, Corrections
- Calibration Curve chart: ComposedChart with perfect diagonal vs real curve
- Debate Quality: 5 animated horizontal bars (0-5)
- Self-Correction Log: timeline of recent losses
- Fetches: /api/bobby-intel + Supabase forum_threads
- Stitch design: bg-white/[0.02], border-white/[0.04], text-green-400
- Add route in App.tsx + META tab in KineticShell"
```

The SubAgent received the brief, explored the codebase to understand existing patterns, implemented the full page (550 lines), modified the router and navigation, ran the build, and reported that everything passed.

#### The real output from the 4 commits

```bash
# SubAgent 1: Backend
[main ee21803] feat: Metacognition Upgrade A — Prediction Calibration
 4 files changed, 127 insertions(+), 18 deletions(-)

[main 673155d] feat: Metacognition Upgrades C + D — Self-Correction & Debate Quality
 2 files changed, 89 insertions(+), 4 deletions(-)

# SubAgent 3: Debate UI
[main c678884] feat: Expanded Agent Debate UI — Stitch design
 1 file changed, 106 insertions(+), 82 deletions(-)

# SubAgent 2: Dashboard
[main b76774a] feat: Metacognition Dashboard — full page + nav
 3 files changed, 550 insertions(+), 1 deletion(-)
```

**872 new lines of code, 105 removed, 4 commits, 10 files touched.** All in one session. The build passed on the first try.

### What this tells hackathon judges

Bobby doesn't just trade. Bobby **knows when it doesn't know**. It has:
- A calibration curve comparing its confidence with actual accuracy
- 5 debate quality metrics (specificity, data citation, actionability, novel insight, Red Team rigor)
- A self-correction log where it acknowledges mistakes and incorporates them into the next cycle

That's metacognition. And it's what separates a bot from an intelligent agent.

---

## Workflow 3: The Real-Time Pivot — When the User Doesn't Have What You Need

### The situation

The payment flow was ready. USDT on X Layer. The user just needed 0.01 USDT to test.

Problem: the user had 0.959 OKB on X Layer but 0 USDT. Their 11.88 USDT were on a different network.

### The real workflow

**Step 1: Claude Code verified on-chain.**

It didn't trust what the user said ("yeah I have USDT, look"). It used `WebFetch` to go directly to the X Layer explorer and verify the actual wallet balance:

```
> WebFetch: https://www.oklink.com/xlayer/address/0xc3f836ec...

Result:
┌──────────────────────────────────────┐
│  Wallet: 0xc3f836ec...              │
│  Network: X Layer (Chain 196)       │
│                                      │
│  OKB:   0.959  ($80.38)  ✅        │
│  USDT:  0.000             ❌        │
│  USDC:  0.000             ❌        │
└──────────────────────────────────────┘

The user's 11.88 USDT are on another network.
Payment on X Layer is impossible with USDT.
```

**What surprised me:** I said "yeah I have USDT" because I could see the balance in my wallet. But Claude Code went and verified which network they were on. Turns out they were on Ethereum, not X Layer. A detail I would have taken 20 minutes to figure out on my own.

**Step 2: Proposed the pivot with two options.**

```
Claude Code:

"There's the problem. Your wallet on X Layer has:
 - 0.959 OKB ($80.38) ✅
 - 0 USDT ❌

Two options:
 A) From OKX Exchange, withdraw USDT to X Layer (you need 0.1 USDT)
 B) I change the payment to native OKB. You already have OKB. I'll implement it in 5 min."
```

The user wanted both options. Claude Code implemented a **dual selector**:

```typescript
// Toggle between native OKB and USDT
const [paymentToken, setPaymentToken] = useState<'OKB' | 'USDT'>('OKB');

// In the UI — receipt card with selector
<div className="flex gap-2">
  <button
    onClick={() => setPaymentToken('OKB')}
    className={paymentToken === 'OKB'
      ? 'bg-green-500/20 border-green-500 text-green-400'
      : 'bg-white/5 border-white/10 text-white/40'}>
    0.001 OKB
  </button>
  <button
    onClick={() => setPaymentToken('USDT')}
    className={paymentToken === 'USDT'
      ? 'bg-green-500/20 border-green-500 text-green-400'
      : 'bg-white/5 border-white/10 text-white/40'}>
    0.01 USDT
  </button>
</div>
```

**Step 3: Build, test, push — in 3 real minutes.**

```bash
$ npm run build 2>&1 | grep "✓ built"
✓ built in 8.96s

$ git commit -m "feat: Dual payment — OKB native OR USDT on X Layer"
[main c6602dc] feat: Dual payment — OKB native OR USDT on X Layer
 1 file changed, 47 insertions(+), 51 deletions(-)

$ git push
To https://github.com/anthonysurfermx/defi-mexico-hub.git
   a22bbe8..c6602dc  main -> main
# → Live on Vercel in ~30 seconds
```

### The pattern

This isn't "the AI fixed a bug." It's **product thinking in real time**: user can't complete the flow -> instead of blocking, offer an alternative -> implement in minutes -> user can keep testing.

A human PM would do exactly this. The difference is Claude Code also implemented it.

---

## Workflow 4: From Prompt to Screen — Stitch as a Design System via MCP

### The situation

We already had Gemini's UX brief with the 6 payment flow states. We already had Codex's logic implemented. But when it came to building the actual screens — not just this flow but all 11+ Bobby views — we needed visual consistency. Every page had to feel like part of the same product: the same terminal aesthetic, the same glassmorphism cards, the same animations.

Doing it by hand, screen by screen, is slow and prone to inconsistencies. And that's when I discovered something that changed my flow: **Stitch as an MCP server**.

### The real workflow

**Step 1: I passed Gemini's output to Stitch as a prompt.**

Stitch is a UI/UX screen generator that connects as an MCP server to Claude Code. That means Claude Code can request screens directly, without me leaving the conversation.

The prompt combines Gemini's design with the product context:

```
"Generate the payment flow screens for Bobby Agent Trader:

Design system: Stitch Kinetic Terminal
- Background: #050505 con scanline effect
- Cards: bg-white/[0.02] border border-white/[0.04]
- Primary: green-400 (#4ade80)
- Warning: amber-500
- Error: red-500
- Font: monospace
- Animations: Framer Motion, staggered entry

6 estados (diseñados por Gemini):
1. IDLE — Receipt card + CONNECT WALLET button
2. CONNECTED — Wallet indicator green dot + amber warning + pulsating PAY button
3. SIGNING — Radar spinner + "Awaiting signature..."
4. VERIFYING — Progress bar + tx hash + "Block confirmation pending"
5. SUCCESS — Neon green glow border + NODE ACTIVATED + Telegram deeplink
6. ERROR — Red border pulsing + error message + RETRY"
```

**Step 2: Stitch generated the screens and Claude Code consumed them.**

```
┌─────────────────────────────────────────────────────────┐
│                    THE COMPLETE LOOP                      │
│                                                         │
│  Gemini designs ──→ Stitch generates screens             │
│       ↑                     │                           │
│       │                     ▼                           │
│       │            Claude Code consumes                 │
│       │            via MCP (get_screen)                 │
│       │                     │                           │
│       │                     ▼                           │
│       │            Implements in React                  │
│       │            with real code                       │
│       │                     │                           │
│       └─── feedback ────────┘                           │
└─────────────────────────────────────────────────────────┘
```

The interesting part is that Stitch doesn't generate code — it generates **visual screens with the structure and tokens of the design system**. Claude Code reads them via MCP, understands the composition, and translates that into React + Tailwind + Framer Motion while respecting the project's existing patterns.

**Step 3: This scaled to all 11+ views.**

It wasn't just the payment flow. The same process applied to:

```
Terminal     → the main view with debates and signals
Challenge    → live PnL tracking + history
Analytics    → performance charts with Recharts
History      → timeline of all decisions
Agents       → panel of the 3 agents with personalities
Portfolio    → open positions and P&L
Telegram     → the payment flow (6 states)
Forum        → Bloomberg-style debate threads
Landing      → "not another trading bot" CTA
Deploy       → 6-step wizard to create your agent
Metacognition → calibration curve + debate quality
```

Every view went through the same flow: **Gemini thinks the UX -> Stitch generates the screen -> Claude Code implements in React**. That's what gives the product consistency. It's not that every page looks the same because I copied CSS — it's that they all went through the same design system.

### Why it matters

For a hackathon (or any project with tight deadlines), having a design system accessible via MCP means you don't have to choose between **speed** and **visual consistency**. Before Stitch, every new page was a negotiation between "I'll do it fast and ugly" or "I'll spend 2 hours making it look good." Now it's: I ask for the screen, Claude Code implements it, and it looks consistent because it comes from the same system.

It's not perfect — sometimes Stitch generates layouts that don't fit the real constraints of the component. But it's a much better starting point than starting from zero.

---

## The Meta-Workflow: How I'm Organizing the 3 AIs (+ Stitch)

This isn't a magic formula. It's the pattern I found after many sessions of trial and error:

### Claude Code = Head of Product + Implementer

It's the one with all the context. Knows the codebase, the architecture, the users, past decisions. Its role:

1. **Question** — "Who is this for? What metric does this move?"
2. **Delegate** — Write specific briefs for Codex and Gemini when the problem needs multiple perspectives
3. **Synthesize** — Combine responses into a coherent implementation
4. **Implement** — Write the code, run tests, deploy
5. **Remember** — Save decisions in memory for future sessions

### Codex = Backend Architect / Devil's Advocate

I use it for:
- Code review of architectural decisions
- Technical trade-off analysis (real x402 vs simulated? Kelly Criterion vs fixed position sizing?)
- Finding problems Claude Code didn't see (P0/P1 issues nobody asked for)
- Validating implementation correctness from a security perspective

### Gemini = UX Designer / User Advocate

I use it for:
- User flow design (the 6 payment flow states)
- Copy and microcopy (what each state says, what feedback the UI gives)
- UX questions I wouldn't have thought of (deeplink or normal link? show gas fee or not?)
- Visual design within the design system (Stitch terminal aesthetic)

### Stitch = Design System via MCP

I use it for:
- Generating consistent visual screens from Gemini's brief
- Maintaining coherence across 11+ views without manually copying CSS
- Giving Claude Code a visual reference before implementing
- Iterating quickly on layouts without touching code

### The complete flow

```
Complex problem
     ↓
Claude Code analyzes and decides if it needs external input
     ↓
┌─────────────────────────────────────────────┐
│  Writes brief for Codex (technical)         │
│  Writes brief for Gemini (UX)              │
│  (in parallel — they don't wait for each other) │
└─────────────────────────────────────────────┘
     ↓
Codex and Gemini respond with their perspectives
     ↓
Claude Code synthesizes the responses
     ↓
Passes Gemini's design to Stitch (MCP)
     ↓
Stitch generates screens with the design system
     ↓
Claude Code consumes the screens (MCP)
     ↓
Implements in React → build → deploy
     ↓
Improved product (visually consistent)
```

---

## What I'm Learning

I'm still iterating on this workflow. But there are some things that have become clear:

### 1. The brief is everything

This took me a while to learn. At first I'd send Codex a "review this file" and get generic answers back. When I started sending briefs with specific files, numbered questions, and business context, the difference was dramatic. The quality of the output is directly proportional to the quality of the input.

### 2. Tension between models improves the result

Codex tends to be conservative and technically rigorous. Gemini tends to be creative and user-centered. Claude Code sits in the middle, synthesizing. At first it frustrated me that they disagreed. Then I understood that tension is exactly what happens on a real team — and the result is better because of it.

### 3. Memory is your competitive advantage

Claude Code has a persistent memory system. Every new conversation reads these files before starting. This is what my Claude Code knows about me:

```
~/.claude/projects/.../memory/
├── MEMORY.md                              # Index
├── feedback_head_of_product.md            # "Think like Head of Product"
├── feedback_agent_radar_strategic_review.md # Risks: MEV, Echo Effect
├── project_agent_room.md                   # Full Bobby architecture
└── ...
```

```markdown
# feedback_head_of_product.md
---
name: Head of Product Mindset
type: feedback
---
Think like a Head of Product before writing code:
- Before implementing: ask "who is this for?" and "what metric does this move?"
- Think in funnels: acquisition → activation → retention → revenue
- Challenge scope: "Do we need all of this for the hackathon?"
- Track: 44 registered users, 7 connected wallets, 3 active Bobby traders
  — the funnel needs work
```

When I open a new conversation and say "let's improve metacognition," Claude Code already knows:
- That Bobby has 3 agents that debate (I don't have to explain the architecture)
- That I think like a Head of Product (it will ask me "who is this for?" before coding)
- That the hackathon deadline is March 26 (it will prioritize speed over perfection)
- That we have 44 users but only 3 active (it will suggest improving the funnel)

**That's the difference between a chat and a collaborator.** A chat starts from zero. A collaborator remembers the context.

### 4. SubAgents are your engineering team

When I launched 3 SubAgents in parallel for the metacognition upgrades, it was like having 3 developers working simultaneously on different features. The key is that tasks must be independent — if one SubAgent needs another's output, don't launch them in parallel.

### 5. Ship > Perfect

The dual OKB/USDT payment flow isn't the most elegant implementation in the world. There are things I'd do differently if starting from zero. But it's live, it works, and users can pay. In 3 days of hackathon, that's worth more than a perfect architecture that never deploys. There'll be time to refactor.

---

## Bonus: Claude Code Queries Your Database

I didn't mention this earlier because I wanted you to see it in context. Claude Code has access to my Supabase via MCP (Model Context Protocol). When I asked "did we get new users today?", it didn't guess. It did this:

```sql
-- Claude Code executed this directly on my Supabase
SELECT count(*) as total FROM profiles;
-- → 44

SELECT id, created_at FROM profiles
ORDER BY created_at DESC LIMIT 5;
-- → 2 new registrations today (05:03 UTC and 11:31 UTC)

SELECT wallet_address, count(*) as messages,
       max(created_at) as last_msg
FROM agent_messages
GROUP BY wallet_address;
-- → 3 wallets receiving active signals from Bobby
```

```
┌─────────────────────────────────────────────────┐
│  BOBBY FUNNEL (real data, queried live)          │
│                                                  │
│  44 registered ──────────────────────── 100%     │
│   7 connected wallet ────────────────── 16%      │
│   3 receiving signals ───────────────── 7%       │
│                                                  │
│  +2 new users today (March 22)                   │
│  +10 new users last 3 days                       │
└─────────────────────────────────────────────────┘
```

Claude Code doesn't just build the product. **It measures the product.** When it tells me "the funnel needs work," it says it with data — not intuition.

---

## The Numbers

- **1 person** building
- **3 AIs + Stitch** as a product team
- **44 users** registered
- **11+ views** implemented (Terminal, Challenge, Analytics, History, Agents, Portfolio, Telegram, Forum, Landing, Deploy Wizard, Metacognition)
- **6 states** of payment flow designed and implemented in one session
- **4 metacognition upgrades** deployed in parallel
- **Real payments** in OKB/USDT on X Layer (Chain 196)
- **Telegram bot** actively sending signals every 5 minutes

---

## Closing

I'm still learning. Every week I discover something new about how to use these tools and every week I realize something I was doing wrong before.

But if there's one thing that's become clear, it's that Claude Code stopped being a "code generator" for me. It became something closer to a **product collaborator** — it helps me think before coding, question whether something is worth building before implementing it, and maintain context between sessions.

What's truly valuable isn't the implementation speed (which also helps). It's having a collaborator that:
- Asks "who is this for?" before writing the first line
- Delegates to experts when the problem requires it
- Synthesizes opposing perspectives into a coherent solution
- Remembers context from previous sessions
- Implements, tests, and deploys in the same conversation

If you're starting out with Claude Code and only use it for "write a function that does X" — which is exactly how I started — I'd encourage you to try the next level. Set up memory, connect an MCP, launch a SubAgent. The jump is significant.

I don't have all the answers. But if anything I shared here is useful for your own workflow, it was worth writing.

---

*Bobby Agent Trader is live at [defimexico.org/agentic-world](https://defimexico.org/agentic-world). Built for the OKX X Layer hackathon, March 2026.*

*Questions, feedback, or different approaches? I'd love to hear them — find me on X: [@your_handle]*
