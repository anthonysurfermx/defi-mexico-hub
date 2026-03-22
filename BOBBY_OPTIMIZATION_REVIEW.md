# Bobby Agent Trader — Full-Stack Optimization Review

> **Purpose**: Document for external AI review (Gemini). Evaluate architecture, identify bottlenecks, and propose optimizations across all 6 layers of the Bobby Agent Trader experience.

---

## Current Architecture Summary

Bobby is a conversational DeFi CIO agent that combines:
- **4 real-time data sources** (OKX on-chain, Polymarket predictions, Yahoo Finance stocks, OKX CEX prices)
- **Multi-agent debate system** (Alpha Hunter + Red Team + Judge) for autonomous trading decisions
- **Streaming LLM responses** (OpenClaw Gateway / Claude API fallback)
- **Dual voice synthesis** (ElevenLabs premium + Web Speech API fillers)
- **Kelly Criterion position sizing** with self-optimizing prompts

**End-to-end latency**: Chat ~10-15s | Full autonomous cycle ~2-3min

---

## LAYER 1: SEARCH (Intent Detection + Data Routing)

### Current Implementation
```
User input → detectIntent() → 11 regex rules → route to handler
           → detectTokens() → TOKEN_MAP regex → crypto symbols
           → detectStocks() → STOCK_MAP regex → equity tickers
```

### What Works
- Intent detection is <1ms (pure regex, no LLM call)
- Token/stock detection covers ~30 assets
- Opinion questions correctly route to chat handler (not price display)

### Problems
1. **Rigid regex** — "How will Fed rates impact crypto?" won't trigger any data source because "Fed" isn't in any keyword list
2. **No semantic understanding** — Can't distinguish "show me BTC price" (price intent) from "analyze BTC" (analysis intent) when phrased ambiguously like "BTC outlook"
3. **No query expansion** — User asks about "gold" but Bobby doesn't know to also pull BTC (digital gold correlation) or DXY (inverse correlation)
4. **Stock detection is keyword-only** — "semiconductor stocks" won't trigger NVDA, AMD, INTC

### Optimization Proposals
- **A**: Use a lightweight classifier (small LLM call or local model) for intent + entity extraction instead of regex
- **B**: Add a "query expansion" step: user asks about X → Bobby also fetches correlated assets
- **C**: Keep regex but add a semantic fallback — if no regex match, ask LLM to classify intent (adds ~500ms but only for edge cases)

### Question for Gemini
> Is a regex-first + LLM-fallback intent detection the right tradeoff for sub-15s total latency? Or should we move to full LLM-based intent classification and absorb the ~500ms cost?

---

## LAYER 2: RESPONSE (LLM Pipeline + Context Engineering)

### Current Implementation
```
bobby-intel.ts (3s parallel fetch)
  → OKX whale signals + Polymarket consensus + prices + performance history
  → Format as [LIVE MARKET DATA] text blocks

openclaw-chat.ts (5-7s streaming)
  → System prompt (Bobby Axelrod persona) + briefing injection
  → SSE streaming to client
  → OpenClaw Gateway primary, Claude API fallback
```

### What Works
- Parallel data fetching (4 sources via Promise.all) — efficient
- Structured output format (ON-CHAIN / TRADITIONAL / PREDICTION / VERDICT)
- Dynamic conviction scoring (math in TypeScript, not in LLM)
- 60s CDN cache on intel briefing

### Problems
1. **Briefing is text-only** — Claude receives a wall of text (~2000 chars), not structured data. It sometimes ignores sections or hallucinates numbers
2. **No priority weighting** — Bobby gets the same briefing whether user asked about BTC specifically or "the market in general"
3. **Context window waste** — 10 messages of history always sent, even if only last 2 are relevant
4. **No chain-of-thought visibility** — Bobby reasons internally but user only sees the final output, missing the "thinking" that builds trust
5. **System prompt is static** — Same Bobby personality regardless of market conditions (bull run vs crash vs sideways)
6. **1024 max_tokens** — Short for structured multi-section analysis

### Optimization Proposals
- **A**: Switch from text blocks to structured JSON in the system prompt → LLM parses data more accurately
- **B**: Query-aware briefing: if user asks about BTC, weight OKX signals for BTC higher, trim irrelevant Polymarket markets
- **C**: Smart history pruning: only send messages relevant to current topic (use embeddings or keyword match)
- **D**: Add "thinking" phase visible to user: Bobby shows reasoning steps before verdict (like o1-style)
- **E**: Dynamic system prompt: inject market regime (bull/bear/sideways based on BTC 7d trend) to shift Bobby's personality
- **F**: Increase max_tokens to 2048 for deep analysis, keep 1024 for simple queries

### Question for Gemini
> The briefing injection is ~2000 chars of context. Should we (a) keep text injection but with XML tags for structure, (b) switch to tool_use where the LLM calls functions to get specific data, or (c) use a RAG-like approach where we embed the briefing and only retrieve relevant chunks?

---

## LAYER 3: VOICE (TTS Optimization + Latency)

### Current Implementation
```
speak(text)      → POST /api/bobby-voice → ElevenLabs eleven_multilingual_v2
                 → audio/mpeg stream → play via AudioContext
                 → Cache in IndexedDB (24h TTL, hash key)

speakLocal(text) → window.speechSynthesis (free, instant ~100ms)
                 → Used for fillers: "One moment...", "Let me check..."
```

### What Works
- Dual-tier voice (ElevenLabs for quality moments, Web Speech for free fillers)
- 24h IndexedDB cache eliminates repeated API calls
- AnalyserNode provides frequency data for VoiceOrb visualization
- ~60-70% reduction in ElevenLabs API calls vs previous approach

### Problems
1. **Voice starts AFTER full response** — User waits for entire LLM stream before hearing Bobby speak. Should speak first sentence while rest streams
2. **No sentence-level streaming** — ElevenLabs supports streaming input, but we send full text at once
3. **Cache key is full text hash** — Similar responses get different hashes, wasting cache
4. **Web Speech quality** — Filler phrases sound robotic compared to ElevenLabs Bobby
5. **No voice interruption** — If user types while Bobby is speaking, voice doesn't stop
6. **Single language per session** — Voice doesn't adapt mid-conversation if user switches language

### Optimization Proposals
- **A**: **Sentence-level TTS** — As LLM streams, extract first complete sentence → send to ElevenLabs immediately → speak while rest of response streams
- **B**: **Predictive caching** — Pre-generate audio for common phrases ("The market looks...", "My verdict is...") during idle time
- **C**: **Voice interruption** — On new user input, stop() current audio and cancel pending TTS requests
- **D**: **ElevenLabs streaming API** — Use their websocket input streaming to reduce TTFB (time to first byte of audio)
- **E**: **Adaptive quality** — If user is on slow connection, fall back to Web Speech for everything

### Question for Gemini
> Is sentence-level TTS streaming (sending first sentence to ElevenLabs while LLM still generates) the right approach? Or should we use ElevenLabs' websocket streaming input API for true real-time voice? What's the latency tradeoff?

---

## LAYER 4: INSIGHT (Intelligence Quality + Data Fusion)

### Current Implementation
```
bobby-intel.ts collects 4 sources in parallel:

1. OKX OnchainOS  → DEX whale signals (3 chains: ETH, SOL, Base)
                   → Filter: amount, wallet convergence, sold ratio, type
                   → Score: 0-100 points per signal

2. Polymarket      → Top 15 PnL traders → their positions
                   → Aggregate: market consensus, capital flow, edge %
                   → Batched 5-per-request (avoid 429)

3. Supabase        → Last 5 agent cycles → win rate, mood, safe mode
                   → Self-optimization history

4. OKX CEX Prices  → BTC, ETH, SOL, OKB, XAUT, PAXG, XAG
                   → 24h change, volume

Dynamic Conviction = (OKX_Score × 0.4) + (Poly_Consensus × 0.6) - Latency_Penalty
```

### What Works
- Parallel fetching (~3s for all 4 sources)
- Mathematical conviction scoring (not LLM-generated)
- Signal filtering removes noise (score ≥20 threshold)
- Multi-agent debate adds adversarial reasoning

### Problems
1. **No cross-source correlation** — OKX shows ETH whale buying, Polymarket shows ETH ETF approval consensus rising → these SHOULD amplify each other but the system treats them independently
2. **No temporal awareness** — Bobby can't say "whales started accumulating 3 days ago" because signals lack historical comparison
3. **Polymarket limited to 15 traders** — Misses mid-tier smart money that might be earlier adopters
4. **No DeFi TVL or protocol metrics** — Missing DefiLlama data (TVL changes, protocol inflows/outflows)
5. **No social sentiment** — Missing Fear & Greed Index, Twitter/X sentiment, funding rate trends
6. **Stock data is disconnected** — Yahoo Finance data arrives but isn't correlated with crypto flows (e.g., NVDA pump → AI token pump)
7. **Signal staleness** — bobby-intel has 60s CDN cache, but OKX signals can be 30min+ old. User sees "live" data that's already stale

### Optimization Proposals
- **A**: **Cross-source correlation engine** — After parallel fetch, run a correlation step: if OKX + Polymarket agree on same asset/theme → boost conviction. If they diverge → flag as potential trap
- **B**: **Delta analysis** — Store previous briefing, compare with current: "ETH whale inflow UP 40% vs 4h ago" gives temporal context
- **C**: **Add DefiLlama TVL** — Simple API call for top 10 protocols, 1 extra parallel fetch
- **D**: **Fear & Greed Index** — Alternative.me API (free, 1 number, <200ms)
- **E**: **Stock-Crypto correlation tags** — Map NVDA → AI tokens (FET, RNDR, TAO), MSTR → BTC. When one moves, mention the other
- **F**: **Signal freshness indicator** — Show user how old each data point is: "OKX data: 2min ago | Polymarket: 45s ago"

### Question for Gemini
> The conviction formula is `(OKX × 0.4) + (Poly × 0.6) - latency`. Should the weights be dynamic based on market regime? E.g., in high-volatility periods, weight on-chain data higher (0.6) because crowd consensus lags. In low-vol, weight Polymarket higher because smart money consensus is more predictive.

---

## LAYER 5: DATA (Real-Time Feeds + Caching Strategy)

### Current Data Architecture
```
┌─────────────────────────────────────────────────┐
│ CLIENT CACHING                                   │
├─────────────────────────────────────────────────┤
│ tickerCacheRef    │ Session memory    │ No TTL   │
│ candleCache       │ Object in module  │ 5min TTL │
│ Voice audio       │ IndexedDB         │ 24h TTL  │
│ Chat history      │ localStorage      │ 24h cut  │
│ Interest tags     │ Supabase (async)  │ Forever  │
├─────────────────────────────────────────────────┤
│ SERVER CACHING (Vercel Edge)                     │
├─────────────────────────────────────────────────┤
│ bobby-intel       │ s-maxage=60       │ 60s      │
│ stock-price       │ s-maxage=120      │ 120s     │
│ okx-candles       │ s-maxage=300      │ 5min     │
│ polymarket-gamma  │ s-maxage=300      │ 5min     │
│ polymarket-data   │ s-maxage=120-300  │ 2-5min   │
└─────────────────────────────────────────────────┘
```

### Problems
1. **No WebSocket** — All data is request/response. User sees data that's 60-120s stale between refreshes
2. **No prefetching** — When user opens Bobby, nothing is pre-loaded. First interaction always cold
3. **Cache invalidation is time-based only** — If market crashes 10s after cache, user sees stale prices for 50s
4. **No shared cache between tabs** — Opening Bobby in 2 tabs doubles API calls
5. **Candle cache is module-scoped** — Survives only within the React app lifecycle, lost on refresh

### Optimization Proposals
- **A**: **Prefetch on mount** — When Bobby component mounts, immediately fetch bobby-intel + top 5 prices in background. First interaction is instant
- **B**: **SSE feed for live prices** — Instead of polling, maintain a server-sent event stream for BTC/ETH/SOL prices. Update cards in real-time
- **C**: **Service Worker cache** — Move candle + ticker cache to Service Worker for cross-tab sharing and offline support
- **D**: **Stale-while-revalidate client-side** — Show cached data immediately, fetch fresh in background, update UI when ready
- **E**: **Event-driven cache invalidation** — If BTC moves >2% in 1 minute, invalidate all BTC-related caches

### Question for Gemini
> For a trading intelligence agent, is polling with aggressive CDN caching (current approach) acceptable? Or do we need WebSocket/SSE for real-time price updates? The tradeoff: SSE adds infrastructure complexity but gives sub-second updates vs current 60-120s staleness.

---

## LAYER 6: CONTEXT (What Gives Bobby Superpowers)

### Current Context Sources
```
1. System Prompt (static)
   → Bobby Axelrod persona
   → 12 personality rules
   → Structured output format
   → Language enforcement

2. Live Briefing (dynamic, per-request)
   → [LIVE MARKET DATA] — prices
   → [OKX OnchainOS WHALE SIGNALS] — top 5 filtered signals
   → [POLYMARKET SMART MONEY CONSENSUS] — top 5 markets
   → [STOCK MARKET DATA] — real-time stock prices (if detected)
   → [AUTONOMOUS REASONING] — which sources were consulted and why
   → [AGENT METACOGNITION] — win rate, mood, safe mode status

3. Conversation History (sliding window)
   → Last 10 messages (user + assistant)
   → No summarization, raw text

4. Performance History (from Supabase)
   → Last 5 cycles: trades, win rate, conviction accuracy
   → Mood: confident / cautious / defensive
   → Safe mode flag (win_rate < 70%)
```

### What Makes Bobby Different From ChatGPT
Bobby isn't just "Claude with a persona". Bobby has:
- **Real-time data Bobby can cite** — "ETH whales deposited $2.3M in the last 4h" (not hallucinated)
- **Mathematical conviction** — Score computed in TypeScript, not generated by LLM
- **Adversarial reasoning** — Multi-agent debate ensures Bobby considers both bull and bear cases
- **Self-awareness** — Bobby knows his own track record and adjusts (Safe Mode)
- **Cross-market vision** — Sees crypto, stocks, and prediction markets simultaneously

### What's Missing (Context Gaps)
1. **User profile context** — Bobby doesn't know if user is a whale or retail, risk-tolerant or conservative
2. **Portfolio context** — Bobby should know what user already holds to avoid recommending what they're overexposed to
3. **Time context** — Bobby doesn't know market hours (NYSE closed = stock data stale) or time-of-day patterns
4. **News context** — No current events feed. Bobby can't reference "today's CPI report" or "the SEC ruling yesterday"
5. **Conversation memory** — Bobby forgets everything between sessions. User has to re-explain their thesis every time
6. **Correlation context** — Bobby gets isolated data points but no pre-computed correlations (BTC-ETH 30d correlation, BTC-SPY correlation)
7. **On-chain user identity** — Bobby doesn't check user's wallet for actual holdings, PnL, or transaction history

### Optimization Proposals
- **A**: **User Profile Injection** — On first interaction, ask 3 questions: risk tolerance, portfolio size tier, trading timeframe. Store in Supabase, inject into system prompt
- **B**: **Portfolio-Aware Analysis** — If wallet connected, read top 5 holdings and inject: "User holds: 2.5 ETH, 0.1 BTC, 5000 USDT. Avoid recommending assets they're already heavy on."
- **C**: **Temporal Context Block** — Add to briefing: current time, market hours status (NYSE open/closed, Asia session), day of week, upcoming macro events
- **D**: **Cross-Session Memory** — Store conversation summaries in Supabase (per wallet). Inject last session summary: "Last time, user was interested in ETH L2 ecosystem"
- **E**: **News Integration** — Add a 5th parallel data source: headlines from crypto news API (CoinGecko trending, CoinDesk RSS). Bobby references current events
- **F**: **Pre-computed Correlations** — Daily cron job calculates BTC-ETH, BTC-SPY, BTC-GOLD 30d correlation. Inject as context: "BTC-SPY correlation is 0.72 (high). Macro matters."

### Question for Gemini
> What's the optimal context strategy? Current approach injects ALL available data into every request (~2000 chars). Alternative: only inject data relevant to the question (saves tokens, reduces noise). But this risks Bobby missing cross-market insights that the user didn't explicitly ask about.

---

## PERFORMANCE BUDGET

### Current Timing (Chat Flow)
```
T+0ms      User sends message
T+1ms      Intent detection (regex)
T+50ms     speakFillerLocal("One moment...")
T+100ms    Parallel fetch starts:
             ├─ bobby-intel.ts (OKX + Poly + prices + history)
             ├─ stock-price.ts (if stocks detected)
             └─ contextPrices (if tokens detected)
T+3000ms   Intel arrives, briefing built
T+3100ms   POST /api/openclaw-chat with enriched message
T+3500ms   First SSE chunk arrives
T+4000ms   First sentence visible in typewriter
T+5000ms   Price cards appear (1.5s delay after message)
T+8000ms   Response mostly complete
T+10000ms  Voice starts (full text → ElevenLabs)
T+12000ms  Voice playing, response complete
```

### Target Timing (Optimized)
```
T+0ms      User sends message
T+1ms      Intent detection
T+50ms     speakFillerLocal("One moment...")
T+100ms    Parallel fetch starts (SAME)
T+200ms    Prefetched intel available (if <60s old) → skip fetch
T+500ms    POST /api/openclaw-chat starts
T+1000ms   First SSE chunk → first sentence extracted
T+1200ms   First sentence → ElevenLabs (streaming input)
T+1800ms   Bobby starts SPEAKING first sentence
T+2000ms   Price cards appear
T+3000ms   Response streaming continues, voice follows
T+5000ms   Response + voice complete

IMPROVEMENT: 12s → 5s perceived latency (voice starts 8s earlier)
```

### Key Bottleneck: Voice Latency
The single biggest UX improvement is **speaking the first sentence while the rest streams**. Currently Bobby waits for the ENTIRE response before speaking. This alone would cut perceived latency by ~8 seconds.

---

## SUMMARY: TOP 5 HIGHEST-IMPACT OPTIMIZATIONS

| # | Optimization | Layer | Impact | Effort | Description |
|---|-------------|-------|--------|--------|-------------|
| 1 | **Sentence-level TTS streaming** | Voice | Perceived latency -8s | Medium | Speak first sentence while rest of response generates |
| 2 | **Prefetch on mount** | Data | First interaction instant | Low | Fetch bobby-intel + prices when component loads |
| 3 | **Cross-source correlation** | Insight | Better signal quality | Medium | OKX + Poly agree = boost conviction, disagree = flag trap |
| 4 | **User profile injection** | Context | Personalized analysis | Low | Store risk tolerance + portfolio tier, inject into prompt |
| 5 | **Query-aware briefing** | Response | Less noise, more relevance | Medium | Only send data relevant to user's question |

---

## QUESTIONS FOR REVIEWER

1. **Architecture**: Is the "parallel fetch → text injection → streaming LLM" pattern the right approach for a real-time trading agent? Or should we move to a tool-use pattern where the LLM decides what to fetch?

2. **Context vs Tokens**: We inject ~2000 chars of live data per request. Is this the right balance between context richness and token efficiency? Would structured JSON be better than text blocks?

3. **Voice UX**: For a financial agent, is voice synthesis a differentiator or a gimmick? Should we invest more in voice quality (sentence streaming, emotion) or redirect that effort to data quality?

4. **Real-time vs Cached**: The agent uses 60-120s CDN caching for market data. For a trading intelligence tool, is this acceptable or do we need sub-second updates via WebSocket?

5. **Multi-Agent Debate**: The Alpha + Red Team + Judge pattern adds ~8s to the autonomous cycle. Is the adversarial reasoning worth the latency? Or is a single strong prompt sufficient?

6. **Self-Optimization**: The agent evolves its own prompts based on win rate. Is this genuine learning or just prompt drift? How should we evaluate whether the optimized prompt is actually better?

7. **Missing Data Sources**: We have OKX (on-chain), Polymarket (predictions), Yahoo (stocks). What's the highest-value data source we're NOT using? (DefiLlama TVL? Fear & Greed? Social sentiment? Funding rates trend?)

---

## FILE MAP (for code review)

| File | Lines | Purpose |
|------|-------|---------|
| `src/components/adams/AdamsChat.tsx` | ~1900 | Main chat UI, intent detection, data fetching, voice integration |
| `api/openclaw-chat.ts` | 232 | LLM streaming backend, Bobby system prompt |
| `api/bobby-intel.ts` | 543 | Intelligence briefing (4 parallel sources) |
| `api/bobby-voice.ts` | 85 | ElevenLabs TTS proxy |
| `api/agent-run.ts` | 500+ | Autonomous cycle, multi-agent debate, Kelly sizing |
| `api/stock-price.ts` | 113 | Yahoo Finance stock data |
| `api/okx-candles.ts` | 65 | OKX candlestick data for charts |
| `src/hooks/useBobbyVoice.ts` | 244 | Voice orchestration, IndexedDB cache, AnalyserNode |
| `src/hooks/useAuth.tsx` | 656 | Authentication, user profile, language flow |
| `vercel.json` | 75 | Routing, caching headers, function configs |
