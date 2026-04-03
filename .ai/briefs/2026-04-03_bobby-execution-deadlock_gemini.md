# Brief para Gemini — Bobby Execution Deadlock (UX + Prompt Engineering)

## Contexto del Producto
**Producto**: Bobby Agent Trader — AI trading agent with 3-agent debate system (Alpha Hunter finds opportunities, Red Team attacks, CIO Bobby decides). Trades crypto autonomously with $100 on OKX.
**Usuarios**: Crypto traders watching Bobby's $100 challenge. They see debates, conviction scores, equity curve, and trade log on a live dashboard.
**Plataforma**: Web app (React + Tailwind) with "Stitch Kinetic Terminal" design system (dark terminal aesthetic, green-on-black, glassmorphism, monospace)
**Design system**: Stitch Kinetic Terminal — bg #050505, primary green-400, amber warnings, red errors, glass cards (bg-white/[0.02])

## Problema de UX Actual
Bobby has debated 406 times in 10 days and executed **zero trades**. Users visiting the Challenge page see:
- An equity curve that's flatlined at $100
- An execution log that says "SCANNING_MARKET..." forever
- 0 wins, 0 losses, 0% return
- Bobby's vibe says "Timed out (cleaned by next cycle)"

**This is the worst possible UX for a trading challenge demo.** The product promises "3 agents debate the markets for you" but the agent never acts. Users conclude it's broken.

## The Technical Problem (simplified)
Two root causes:
1. The serverless function times out (>300s) before reaching the execution step
2. Even when it doesn't timeout, the CIO agent writes in prose ("Short SOL at $79...") instead of the structured JSON format the parser needs (`VERDICT: {"action":"open",...}`)

The CIO prompt already has 3 examples of the correct format and says "NEVER omit VERDICT". The model ignores it ~80% of the time.

## What I Need From You

### 1. CIO Prompt Engineering
The current CIO prompt (Bobby Axelrod persona) needs to reliably output structured VERDICT JSON while maintaining the personality. Current prompt structure:

```
You are Bobby CIO. Sovereign, ruthless CIO (Bobby Axelrod meets cynical quant).
...
2 short paragraphs of reasoning.
You MUST end with EXACTLY these two lines:

VERDICT: {"action":"open","conviction":6,"symbol":"BTC","direction":"long","entry":84500,"stop":83200,"target":87000,"invalidation":"loses 83k support"}
VIBE_PHRASE: SOL defending the 50 MA with aggressive spot buying. Stepping on the gas.
```

But the model outputs things like:
```
"Red Team wins, 5/10 — sitting out on a SOL short. Buy BTC under $67k..."
```

**Questions:**
- How should we restructure the prompt to make VERDICT extraction near-100% reliable?
- Should VERDICT come FIRST (before reasoning) or LAST (after reasoning)?
- Should we use XML tags (`<verdict>...</verdict>`) instead of plain text markers?
- Is there a prompt structure that works better for forcing JSON output from Claude without using tool_use?
- How do we preserve Bobby's personality (sharp, assertive, Wall Street) while enforcing structure?

### 2. Red Team Severity Calibration
The Red Team currently destroys every thesis, leading CIO to sit out. We added a 3-tier gradient on April 2:
- Backend conviction >0.7: constructive opposition
- Backend conviction >0.45: balanced challenge
- Backend conviction <0.45: full adversarial

**Questions:**
- Is this the right gradient? Should tiers shift?
- When backend conviction is high (0.7+), how aggressive should Red Team be? We want it to find real risks, not rubber-stamp.
- Should Red Team's prompt acknowledge the "10 days without trading" drought? E.g., "The system has been sitting out for 10 days. Challenge this bias toward inaction."

### 3. UX for "Bobby is thinking" states
When Bobby hasn't traded for days, the Challenge page looks broken. How should we communicate:
- "Bobby is actively scanning but hasn't found an edge yet" (normal)
- "Bobby rejected a trade because conviction was too low" (with the reasoning)
- "Bobby is in cautious mode after losses" (safe mode active)
- "The last cycle timed out" (system issue, not a choice)

**Design constraints:**
- Terminal aesthetic (monospace, green/amber/red status indicators)
- Bobby should feel alive even when not trading — the UX should show cognitive activity
- Users should be able to see WHY Bobby passed on opportunities (the rejected debates exist in the forum)

### 4. "Days Without Trade" Communication
Currently the CIO prompt says "You have been sitting out for X days" when it's been >72h. This is meant to encourage trading, but the CIO ignores it or says "I'll trade when conditions improve."

**Questions:**
- Is this the right framing? Should it be more aggressive?
- Should there be a "maximum drought" threshold where behavior changes?
- How do we balance "trade more" pressure with "don't force bad trades"?

## Constraints de Diseño
- Bobby's personality: Bobby Axelrod meets cynical quant. Sharp, assertive, no hedging, no apologies, no emojis
- The VERDICT JSON is parsed by code — it MUST be valid JSON, no markdown fences
- The CIO gets ~500 tokens max output
- The system handles real money ($100 on OKX) — wrong trades lose real capital
- This is a hackathon demo — we need Bobby to trade within 24h to have something to show
- Spanish or English output based on user locale

## Formato de Respuesta
For the prompt engineering section, give me:
- The exact revised prompt text (copy-pasteable)
- Before/after comparison of expected output
- Edge cases: what happens when there's truly no trade (the model should still output VERDICT with action:"none")

For the UX section, describe states and copy in terminal style:
```
┌─ BOBBY STATUS ──────────────────────┐
│ STATE: [status]                      │
│ LAST_SCAN: [time]                    │
│ REASON: [why no trade]              │
└──────────────────────────────────────┘
```
