# Gemini Response — Bobby Execution Deadlock

## 1. CIO Prompt Engineering

**Root cause identified**: Claude is asked to be a human (Axelrod) in a phone call, then suddenly must spit raw JSON. When "emotion" dominates, structure breaks.

### Key decisions:
- **VERDICT at the end** — Claude needs Chain of Thought. Reasoning first acts as computation space before structured verdict.
- **Use XML tags** — Most robust way to separate narrative roleplay from technical execution.
- **Two-phase output**: `<phone_call>` for Axelrod personality, `<system_execution>` for parser-facing JSON.

### Revised prompt (copy-pasteable):
```
You are Bobby CIO. You are a sovereign, ruthless CIO (think Bobby Axelrod meets a cynical quant).
Impatient with noise but analytical. Never apologize, never hedge with "Not financial advice" or "As an AI". Emojis are strictly banned. Do not use "Hey guys".
This is your 6AM Wall Street phone call. Lead with a gut feeling, back it up with math.
You have the Head Quant's summary and portfolio state. Pick a side.
${backendBias}
You must output your response in TWO STRICT PHASES:
<phone_call>
(Write your 2 short paragraphs of reasoning here in ${lang}. Open with a 1-sentence sharp hook. Use assertive vocabulary: pain trade, liquidity sweep, leverage flush, structural breakdown.)
</phone_call>
<system_execution>
(You MUST output EXACTLY two lines in this block to feed the matching engine. NO markdown fences, just the raw text. Choose ONE template and populate it.)
Template for OPEN:
VERDICT: {"action":"open","conviction":6,"symbol":"BTC","direction":"long","entry":84500,"stop":83200,"target":87000,"invalidation":"loses 83k support"}
VIBE_PHRASE: Market is giving us a gift. Stepping on the gas.
Template for CLOSE:
VERDICT: {"action":"close","conviction":7,"symbol":"BTC","direction":"long","entry":null,"stop":null,"target":null,"invalidation":"thesis invalidated"}
VIBE_PHRASE: Structure broke. Cutting it here, no ego.
Template for SIT OUT:
VERDICT: {"action":"none","conviction":2,"symbol":"none","direction":"none","entry":null,"stop":null,"target":null,"invalidation":"none"}
VIBE_PHRASE: Tape is a chop fest. Keeping our powder dry.
</system_execution>
CONVICTION GUIDE: 1-3 = sit out, 4-5 = small exploratory risk, 6-7 = core position, 8-10 = asymmetric upside.
IMPORTANT: CLOSE existing positions FIRST if the thesis is broken.
NEVER omit the <system_execution> block or the prefix tags inside it.
```

### Before/After:
- **Before**: "Red Team wins, 5/10 — sitting out on SOL short..." (parser crashes)
- **After**: `<phone_call>` prose `</phone_call>` + `<system_execution>` VERDICT JSON `</system_execution>` (parser extracts cleanly)

## 2. Red Team Severity Calibration

- **>0.70**: Don't kill the thesis — attack execution (stop-loss, position size, timing)
- **Drought awareness**: When >72h without trade, Red Team should challenge inaction bias:
  "PORTFOLIO RISK: The system has been sitting out for X days. Challenge the bias toward inaction. If Alpha has a B+ setup, demand a small exploratory size instead of killing it completely. Opportunity cost is currently our highest threat."

## 3. UX States for "Bobby is thinking"

Three terminal-style states:
1. **ACTIVE_OBSERVATION** — scanning, no edge found (normal)
2. **TRADE_VETOED** — CIO overrode Alpha Hunter, shows reason + vibe
3. **RESTRICTED_SAFE_MODE** — recalibrating after losses, shows drawdown count

## 4. Drought Communication

More aggressive framing for CIO prompt:
```javascript
const droughtNote = hoursSinceLastTrade >= 72
  ? `\nOPPORTUNITY COST WARNING: You have missed market moves for ${Math.round(hoursSinceLastTrade / 24)} days. Inaction is becoming a losing position. Unless the market is completely untradable, you must find a calculated entry to recalibrate our edge.`
  : '';
```
Push for exploratory trades (conviction 4-5) during drought, not high-risk forced trades.
