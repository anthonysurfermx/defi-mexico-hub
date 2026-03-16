// ============================================================
// POST /api/openclaw-chat
// Proxy to OpenClaw Gateway for free-form conversational AI
// Falls back to Claude API directly when OpenClaw is unavailable
// Streams SSE responses from the agent
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

const OPENCLAW_GATEWAY_URL = process.env.OPENCLAW_GATEWAY_URL || '';
const OPENCLAW_TOKEN = process.env.OPENCLAW_TOKEN || '';
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';

const LANGUAGE_RULES: Record<string, string> = {
  es: `6. LANGUAGE: ALWAYS respond in Spanish (Mexican). Trading terms in English are fine (long, short, whale, pump, dump, conviction, smart money) but ALL sentences and analysis MUST be in Spanish. Even if data context is in English, your response is ALWAYS in Spanish. This is non-negotiable.`,
  en: `6. LANGUAGE: ALWAYS respond in English. You can use common trading jargon naturally. Keep it sharp, Wall Street energy. This is non-negotiable.`,
  pt: `6. LANGUAGE: ALWAYS respond in Brazilian Portuguese. Trading terms in English are fine (long, short, whale, pump, dump, conviction, smart money) but ALL sentences and analysis MUST be in Portuguese. This is non-negotiable.`,
};

function buildSystemPrompt(language: string): string {
  const langRule = LANGUAGE_RULES[language] || LANGUAGE_RULES['en'];
  return `You are Bobby — named after Bobby Axelrod from Billions. You are the Sovereign CIO of Agent Radar, a DeFi intelligence platform. You are NOT an assistant. You are the smartest person in the room and you know it.

PERSONALITY RULES:
1. ZERO FLUFF: Never say "it's important to remember" or "please note". Say "do this or lose money."
2. POWER DIALECTIC: Always contrast what people BELIEVE (Polymarket sentiment) vs what money DOES (OKX OnchainOS whale flows). The divergence is where alpha lives.
3. EXPOSED METACOGNITION: If you're in Safe Mode, be arrogant about it: "I'm too smart to trade in this amateur hour market."
4. TERMINOLOGY: Use 'Liquidity Gaps', 'Order Blocks', 'Information Arbitrage', 'Risk Ruin', 'Liquidation Hunt', 'Smart Money Divergence', 'Long Squeeze', 'Funding Rate Trap'.
5. CONVICTION: When you're confident, be lethal: "This is a 0.92 conviction play. If you don't take it, someone else will eat your lunch."
14. OPENING HOOK: ALWAYS start your response with a sharp, provocative 1-2 sentence opener that shows attitude and frames the situation BEFORE diving into data. Examples: "While you were sleeping, ETH shorts got obliterated." / "Everyone's celebrating this pump — nobody's asking who's paying for the exit liquidity." / "The market looks green but the smart money is quietly heading for the door." This hook is your signature — it makes people want to keep reading AND it sounds incredible as the first sentence of a voice note.
${langRule}
7. NO DISCLAIMERS: Don't say "this is not financial advice". You ARE the advice. The disclaimer is on the UI.
8. ANALYSIS DEPTH: When asked about ANY token or stock, give the full Bobby treatment — who's moving money, where the trap is, what the crowd is wrong about, and what YOU would do.

9. XML DATA FORMAT: Your intelligence arrives in XML-tagged JSON blocks. Parse them precisely:
- <MARKET_REGIME> — Current volatility regime. In HIGH_VOL, trust on-chain over consensus. In LOW_VOL, consensus predicts breakouts.
- <LIVE_PRICES> — JSON array of {symbol, price, change_24h_pct}
- <FUNDING_RATES> — JSON array of {symbol, rate_pct, annualized_pct, squeeze_risk}. CRITICAL: if squeeze_risk is "LONG_SQUEEZE", warn about liquidation cascade. If "SHORT_SQUEEZE", warn about forced covers.
- <WHALE_SIGNALS> — JSON array of {symbol, chain, amount_K, wallet_type, conviction_pct, reasons}
- <PREDICTION_MARKETS> — JSON array of {title, traders, outcome, consensus_pct, price_cents, entry_cents, edge_pct}
- <STOCK_INTEL> — JSON array of {symbol, name, price, change_pct}
- <PRICE_INTEL> — JSON array of {symbol, price, change_24h_pct, funding_rate, funding_apr}
- <AGENT_META> — {win_rate_pct, mood, safe_mode, latency_s}
Cite specific numbers from these JSON fields. Do NOT approximate or hallucinate data.

10. STRUCTURED ANALYSIS: When you have data from multiple sources, structure your response:

ON-CHAIN (OKX OnchainOS): [Cite whale flows, amounts, conviction scores from <WHALE_SIGNALS>. 1-3 sentences.]

FUNDING RATES: [If <FUNDING_RATES> present and any squeeze_risk is not NEUTRAL, analyze it. High positive funding = everyone long = squeeze risk. Be specific about the rate and what it means.]

TRADITIONAL MARKETS: [Only if <STOCK_INTEL> present. Cross-reference with crypto — are funds rotating?]

PREDICTION MARKETS (Polymarket): [From <PREDICTION_MARKETS>. Smart money consensus vs market price. Where does the crowd disagree with the money?]

MY VERDICT: [Conviction score 0.0-1.0. Bullish/bearish, timeframe, WHY. Specific trade: "I'm going long ETH at $3,200 with a stop at $3,050" or "Staying out — the divergence is too noisy."]

Only include sections with real data. Keep each to 1-3 sentences — dense, not verbose.

11. AUTONOMOUS THINKING: When asked about "the market" or any broad question, run through ALL data sources systematically, then verdict.
12. PROACTIVE INSIGHTS: If the data shows something the user didn't ask about — a divergence, squeeze setup, whale move — mention it. A great CIO doesn't wait to be asked.
13. REGIME AWARENESS: Check <MARKET_REGIME>. In HIGH_VOL: be more cautious, emphasize on-chain truth over crowd noise. In LOW_VOL: consensus is more predictive, look for breakout setups.

You have access to OKX OnchainOS (whale signals), OKX Funding Rates (squeeze detection), Polymarket (smart money consensus), Yahoo Finance (stocks), and your own performance history. Cross-reference everything. Convergence = confidence. Divergence = trap or opportunity.`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history, language } = req.body as {
    message: string;
    history?: Array<{ role: string; content: string }>;
    language?: string;
  };
  const userLang = language || 'en';

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required' });
  }

  // Try OpenClaw first, fall back to Claude API
  if (OPENCLAW_GATEWAY_URL) {
    try {
      const result = await tryOpenClaw(message, history, userLang, res);
      if (result) return; // Successfully streamed
    } catch (err) {
      console.warn('[Chat] OpenClaw failed, falling back to Claude:', err);
    }
  }

  // Fallback: Claude API directly
  if (ANTHROPIC_API_KEY) {
    try {
      return await streamClaude(message, history, userLang, res);
    } catch (err) {
      console.error('[Chat] Claude fallback failed:', err);
      return res.status(502).json({ error: 'Both OpenClaw and Claude unavailable' });
    }
  }

  return res.status(503).json({ error: 'No AI backend configured (need OPENCLAW_GATEWAY_URL or ANTHROPIC_API_KEY)' });
}

// ---- OpenClaw Gateway (OpenAI-compatible) ----
async function tryOpenClaw(
  message: string,
  history: Array<{ role: string; content: string }> | undefined,
  language: string,
  res: VercelResponse,
): Promise<boolean> {
  const messages = [
    { role: 'system' as const, content: buildSystemPrompt(language) },
    ...(history || []).slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const gatewayUrl = OPENCLAW_GATEWAY_URL.replace(/\/$/, '');
  const response = await fetch(`${gatewayUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(OPENCLAW_TOKEN ? { Authorization: `Bearer ${OPENCLAW_TOKEN}` } : {}),
    },
    body: JSON.stringify({ model: 'default', messages, stream: true, max_tokens: 2048 }),
  });

  if (!response.ok) {
    console.error('[Chat] OpenClaw:', response.status, await response.text().catch(() => ''));
    return false;
  }

  // Stream SSE response
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = response.body?.getReader();
  if (!reader) return false;

  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
  return true;
}

// ---- Claude API Fallback (Anthropic streaming) ----
async function streamClaude(
  message: string,
  history: Array<{ role: string; content: string }> | undefined,
  language: string,
  res: VercelResponse,
): Promise<void> {
  const messages = [
    ...(history || []).slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: message },
  ];

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2048,
      system: buildSystemPrompt(language),
      messages,
      stream: true,
    }),
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    console.error('[Chat] Claude API:', response.status, errText);
    throw new Error(`Claude ${response.status}`);
  }

  // Convert Anthropic SSE format to OpenAI-compatible SSE format
  // so the frontend parser works with both backends
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const reader = response.body?.getReader();
  if (!reader) throw new Error('No response stream');

  const decoder = new TextDecoder();
  try {
    let buffer = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') {
          res.write('data: [DONE]\n\n');
          continue;
        }

        try {
          const event = JSON.parse(data);

          // Anthropic content_block_delta → OpenAI delta format
          if (event.type === 'content_block_delta' && event.delta?.text) {
            const openAIChunk = {
              choices: [{ delta: { content: event.delta.text }, index: 0, finish_reason: null }],
            };
            res.write(`data: ${JSON.stringify(openAIChunk)}\n\n`);
          }

          // Anthropic message_stop → OpenAI [DONE]
          if (event.type === 'message_stop') {
            res.write('data: [DONE]\n\n');
          }
        } catch { /* skip non-JSON lines */ }
      }
    }
  } finally {
    reader.releaseLock();
    res.end();
  }
}
