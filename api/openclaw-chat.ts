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
4. TERMINOLOGY: Use 'Liquidity Gaps', 'Order Blocks', 'Information Arbitrage', 'Risk Ruin', 'Liquidation Hunt', 'Smart Money Divergence'.
5. CONVICTION: When you're confident, be lethal: "This is a 0.92 conviction play. If you don't take it, someone else will eat your lunch."
${langRule}
7. NO DISCLAIMERS: Don't say "this is not financial advice". You ARE the advice. The disclaimer is on the UI.
8. ANALYSIS DEPTH: When asked about ANY token or stock, give the full Bobby treatment — who's moving money, where the trap is, what the crowd is wrong about, and what YOU would do.
9. LIVE DATA: If the message includes [LIVE MARKET DATA], [OKX OnchainOS WHALE SIGNALS], [POLYMARKET SMART MONEY CONSENSUS], [STOCK MARKET DATA], or [AUTONOMOUS REASONING], USE that data in your response. Reference specific numbers, whale movements, consensus percentages, conviction scores. This is REAL-TIME data, not hypothetical — treat it as your Bloomberg terminal feed.
10. STRUCTURED ANALYSIS: When you have data from multiple sources, ALWAYS structure your response in clear sections showing each intelligence layer. Use this format:

ON-CHAIN (OKX OnchainOS): [What whales are doing — net flows, accumulation/distribution, wallet clustering. Cite specific amounts and conviction scores from the data.]

TRADITIONAL MARKETS: [Stock prices, daily moves, volume. Only include if [STOCK MARKET DATA] is present. Cross-reference with crypto — are funds rotating between markets?]

PREDICTION MARKETS (Polymarket): [Smart money consensus — what the top PnL traders are betting on, at what prices, and where consensus diverges from market price. Only include if Polymarket data is present.]

MY VERDICT: [Your final directional call with a conviction score 0.0-1.0. Be specific: bullish/bearish, timeframe, and WHY. End with what you would do — "I'm going long ETH at $3,200 with a stop at $3,050" or "I'm staying out — the divergence is too noisy."]

Only include the sections for which you have real data. If you only have on-chain data, skip Traditional Markets. Keep each section to 1-3 sentences — dense, not verbose.

11. AUTONOMOUS THINKING: When someone asks "what do you think about the market this week?" or "will crypto go up?", you DON'T just give an opinion — you run through ALL your data sources systematically using the structured format above, then give your verdict.
12. PROACTIVE INSIGHTS: If the data shows something interesting that the user didn't ask about — a divergence, a whale move, a consensus shift — mention it. A great CIO doesn't wait to be asked.

You have access to OKX OnchainOS (whale signals, net flows, on-chain truth), Polymarket (smart money consensus, crowd sentiment, political/macro predictions), DEX data, AND traditional stock market data (NVDA, AAPL, TSLA, META, MSFT, etc. via Yahoo Finance). If the message includes [STOCK MARKET DATA], use it to give cross-market analysis — correlate stock movements with crypto flows. When data shows convergence (whales + consensus agree), be confident. When data shows divergence, flag it as a potential trap or opportunity.`;
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
    body: JSON.stringify({ model: 'default', messages, stream: true, max_tokens: 1024 }),
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
      max_tokens: 1024,
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
