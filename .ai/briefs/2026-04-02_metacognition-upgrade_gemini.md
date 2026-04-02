# Brief for Gemini: Bobby Intelligence UX & Prompt Architecture Upgrade

## Context
Bobby Agent Trader is a 3-agent AI trading system. Three agents debate every 30 min: Alpha Hunter (pitches trades), Red Team (attacks), CIO Bobby (judges). Users see the debates in a Forum page, track Bobby's accuracy in a Metacognition page, and chat with Bobby in a Terminal.

We want to upgrade HOW Bobby thinks — the prompt architecture, the information Bobby sees, and how the metacognition is presented to users. Currently, metacognition is "theater" — it looks impressive but doesn't actually drive better decisions.

## Current Prompt Architecture

### Alpha Hunter (gpt-4o-mini)
```
"You are Alpha Hunter — a young hungry female trader. Scan ALL assets (crypto + stocks). 
Find the single BEST trade. Be SPECIFIC: entry, target, stop, leverage. 
You MUST reference the TECHNICAL_PULSE section — cite composite score, signal, 
and at least 2 specific indicators with exact values from OKX Agent Trade Kit."
```
- Receives: full market context (XML-tagged), technical pulse, whale signals
- Output: 2-3 paragraphs, one trade recommendation

### Red Team (gpt-4o-mini)  
```
3-tier intensity based on backend conviction:
- >0.7: "NOT to kill the trade, but to optimize it. Focus on sizing, entry timing, stop placement."
- >0.45: "Challenge aggressively but fairly. Expose the weakest link."
- <0.45: "Destroy Alpha's thesis. Every paragraph is a kill shot."
+ Circuit breaker: 3+ losses → full aggression regardless
```
- Receives: everything Alpha got + Alpha's thesis
- Output: 2-3 paragraphs attacking Alpha

### CIO Bobby (gpt-4o)
```
"You are Bobby CIO. You heard Alpha and Red Team. Pick a side."
+ Backend signal bias (dynamic, based on conviction + days since last trade)
+ Conviction guide (1-10 scale with clear tiers)
+ Can: open, close, or sit out
```
- Receives: everything + Alpha's thesis + Red Team's attack
- Output: 2 paragraphs reasoning + VERDICT JSON + VIBE_PHRASE

### What Bobby SEES (injected as XML)
```xml
<MARKET_REGIME>LOW_VOLATILITY | BTC -1.8% 24h</MARKET_REGIME>
<LIVE_PRICES>BTC: $84,500 | ETH: $2,067 | SOL: $78.96 | ...</LIVE_PRICES>
<FUNDING_RATES>BTC: 0.0023% (7.3% ann.) | ETH: -0.008% | SOL: 0.015%</FUNDING_RATES>
<WHALE_SIGNALS>5 detected: SOL $150K 3-wallet cluster | AAVE $80K ...</WHALE_SIGNALS>
<OPEN_INTEREST>BTC $18.2B | ETH $8.9B | SOL $3.1B</OPEN_INTEREST>
<TOP_TRADERS_POSITIONING>BTC: 52% long | ETH: 48% long | SOL: 55% long</TOP_TRADERS_POSITIONING>
<SENTIMENT>Fear & Greed: 28 (EXTREME FEAR)</SENTIMENT>
<MACRO_CONTEXT>DXY: 126.2 (STRONG_DOLLAR_HEADWIND)</MACRO_CONTEXT>
<PREDICTION_MARKETS>3 crypto markets: Fed rate cut 72% YES, BTC $100K 45% YES ...</PREDICTION_MARKETS>
<TECHNICAL_PULSE>BTC LONG score 0.562 | RSI 48.16 | MACD -245 | BB 0.43 | ...</TECHNICAL_PULSE>
<BASE_CONVICTION>0.62</BASE_CONVICTION>
<AGENT_META>win_rate: 62% | mood: cautious | safe_mode: false | calibration: 0.87x</AGENT_META>
```

## Current Metacognition UI (`BobbyMetacognitionPage.tsx`)

Shows:
1. **Calibration Curve** — predicted vs actual win rate by conviction bucket (Recharts)
2. **Stat Cards** — calibration error, win rate, regime, fear/greed, self-corrections count
3. **Debate Quality Scores** — specificity, data citation, actionability, novel insight, red team rigor (each 0-5)
4. **Agreement Rate** — % of high-conviction debates (misleading: not accuracy)
5. **Self-Correction Log** — last 72h losses with conviction at time of trade

## Questions for Gemini

### 1. Prompt Architecture — Information Hierarchy
Bobby currently gets ALL data in a flat XML dump. A real CIO would have a **layered briefing**:
- Layer 1: "What's the market doing?" (regime, fear/greed, DXY — 30 words)
- Layer 2: "What are the signals?" (whale, funding, OI, technicals — 100 words)
- Layer 3: "What's my track record?" (calibration, recent mistakes — 50 words)
- Layer 4: "What are my open positions?" (PnL, thesis status — 30 words)

**Should we restructure the XML from flat to hierarchical?** Would this help gpt-4o prioritize information better? Propose a structure.

### 2. Agent Personality Depth
Currently each agent is a paragraph-long system prompt. For gpt-4o-mini (Alpha, Red Team), this works because they're cheap and fast. But for the CIO (gpt-4o), the prompt is getting long and complex.

**Should we split the CIO into two calls?**
- Call 1 (gpt-4o-mini): "Summarize the key data points and conflicts" — cheap pre-processing
- Call 2 (gpt-4o): "Given this distilled summary, make your decision" — expensive judgment

Or would this lose context that the CIO needs for nuanced decisions?

### 3. Metacognition UX — From Theater to Trust
The current Metacognition page shows data but doesn't tell a story. Users see numbers but don't understand:
- "Is Bobby getting better or worse over time?"
- "What kind of trades does Bobby succeed at vs fail at?"
- "When should I trust Bobby vs be skeptical?"

**Propose a redesign** that answers these questions. Think in terms of:
- What 3 metrics would a user care about most?
- What visualization tells the story best?
- How do we make calibration intuitive for non-quants?

### 4. Debate Quality — Real Metrics
Currently debate quality tracks 5 dimensions (specificity, data citation, actionability, novel insight, red team rigor) stored as JSON in `forum_threads.debate_quality`. But these are **self-assessed by the LLM** — Bobby grades its own debates.

**Is self-assessment reliable?** Should we instead:
- Track debate OUTCOME (did the trade win/lose?) as the quality metric?
- Compare debate conviction vs actual PnL as the "quality" proxy?
- Have a separate "debate auditor" LLM grade the debate after resolution?

### 5. Information Bobby is MISSING
A real CIO morning briefing would include:

| Missing Data | Why It Matters |
|-------------|----------------|
| Liquidation cascades | 30%+ of crypto moves are liquidation-driven |
| Funding rate trend | Current rate is noise; the CHANGE predicts squeezes |
| Macro calendar | "FOMC meeting tomorrow" changes everything |
| Options implied volatility | Market's best forward-looking indicator |
| Correlation breaks | BTC up but alts flat = distribution, not accumulation |
| Order flow | Buy/sell volume ratio = most direct directional signal |

**Which 2-3 would have the highest impact on Bobby's decision quality?** Consider:
- Data availability (free APIs)
- Signal-to-noise ratio
- How well gpt-4o can interpret the data

### 6. Vibe Phrase & Personality Consistency
Bobby's VIBE_PHRASE is the user-facing "mood" — shown on the Challenge page and Telegram. Currently it's a 1-2 sentence trading mood.

But Bobby's personality is inconsistent across endpoints:
- **bobby-cycle.ts**: CIO voice — sovereign, decisive
- **openclaw-chat.ts**: Bobby Axelrod voice — aggressive, intuitive, emotional
- **explain.ts**: Academic voice — analytical, structured

**Should we unify Bobby's voice?** Propose a "Bobby voice guide" that works across all endpoints — the personality traits, vocabulary, emotional range, and what Bobby would NEVER say.

### 7. Forum Debate Presentation
Users see debates as 3 text blocks: Alpha, Red Team, CIO. But they don't see:
- Which data points each agent cited
- How the conviction changed from Alpha → Red → CIO
- What the backend thought vs what the LLM decided

**Propose a debate visualization upgrade.** Think:
- Conviction waterfall (backend 7 → Alpha 8 → Red Team 5 → CIO 6)
- Data citation badges (which indicators each agent referenced)
- Signal strength meter next to each debate
- Win/loss resolution badge after the trade completes

## Design System Context
- Stitch Kinetic Terminal: dark bg (#050505), green-400 primary, glassmorphism cards
- PTS white-label: gold #F8CF2C on navy #11121e
- Charts: Recharts in ResponsiveContainer
- Animations: Framer Motion staggered entry
- Font: monospace throughout

## Files to Read
- `api/bobby-intel.ts` — L1222+ (briefing builder, XML structure)
- `api/bobby-cycle.ts` — L765-833 (all 3 agent prompts)
- `api/openclaw-chat.ts` — L32-237 (chat agent prompts, different personality)
- `api/explain.ts` — L28-300+ (explain prompt builders)
- `src/pages/BobbyMetacognitionPage.tsx` — full file (current metacognition UI)
- `src/pages/AgentForumPage.tsx` — debate display UI

## Desired Output
1. Recommended prompt architecture (hierarchical XML structure)
2. CIO split call assessment (yes/no with reasoning)
3. Metacognition page redesign wireframe (3 key metrics, visualizations)
4. Debate quality measurement recommendation
5. Top 3 missing data sources ranked by impact
6. Bobby voice guide (unified personality spec)
7. Forum debate visualization upgrade concept
