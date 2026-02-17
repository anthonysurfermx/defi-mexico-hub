import Anthropic from '@anthropic-ai/sdk';
import type { VercelRequest, VercelResponse } from '@vercel/node';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Rate limiting: simple in-memory store (resets on cold start, good enough for MVP)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

// Prompt builders per context
function buildWalletPrompt(data: any): string {
  const signals = data.botSignals?.signals || {};
  const signalLines = Object.entries(signals)
    .map(([k, v]) => `- ${k}: ${v}/100`)
    .join('\n');

  const topPositions = (data.positions || [])
    .slice(0, 10)
    .map((p: any) => `${p.outcome} | ${p.title} | $${p.currentValue?.toFixed(2)} | PnL: $${p.cashPnl?.toFixed(2)}`)
    .join('\n');

  return `Analyze this Polymarket wallet behavior.

WALLET: ${data.wallet}
PORTFOLIO: $${data.metrics?.portfolioValue || 0}
P&L: $${data.metrics?.profitPnL || 0}
POSITIONS: ${data.positions?.length || 0} open
WIN RATE: ${data.winRate || 0}%
BOT SCORE: ${data.botSignals?.botScore || 0} (${data.botSignals?.classification || 'unknown'})

SIGNALS:
${signalLines}

TOP POSITIONS:
${topPositions || 'None'}

${data.marketContext ? `ANALYZING IN CONTEXT OF MARKET: ${data.marketContext}` : ''}

Focus on: What type of trader is this? What patterns stand out? Is this wallet worth following? What risks should a copy-trader consider?`;
}

function buildExchangeMetricsPrompt(data: any): string {
  const exchanges = (data.exchanges || [])
    .map((e: any) => `${e.name} | Vol: $${e.volume} | Users: ${e.users} | Growth: ${e.growth}%`)
    .join('\n');

  const trends = (data.trends || [])
    .map((t: string) => `- ${t}`)
    .join('\n');

  return `Analyze LATAM crypto exchange data.

REGION: ${data.region || 'LATAM'}
PERIOD: ${data.period || 'current'}
TOTAL VOLUME: $${data.totalVolume || 0}

EXCHANGES:
${exchanges || 'No data'}

KEY TRENDS:
${trends || 'None provided'}

Identify which exchanges are growing fastest, what is driving adoption, and what this means for the LATAM DeFi landscape.`;
}

function buildMarketPrompt(data: any): string {
  return `Analyze this Polymarket prediction market.

MARKET: ${data.title || 'Unknown'}
VOLUME: $${data.volume || 0}
LIQUIDITY: $${data.liquidity || 0}
TOP OUTCOME: ${data.topOutcome || 'N/A'} at ${data.topPrice || 0}%

HOLDER DISTRIBUTION:
- Agents: ${data.agentPercent || 0}%
- Humans: ${data.humanPercent || 0}%
- Top 10 holders control: ${data.top10Percent || 0}% of volume

Explain what the smart money is doing and what the holder composition tells us about market conviction.`;
}

const promptBuilders: Record<string, (data: any) => string> = {
  'wallet': buildWalletPrompt,
  'exchange-metrics': buildExchangeMetricsPrompt,
  'market': buildMarketPrompt,
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Rate limiting
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: 'Rate limit exceeded. Try again later.' });
  }

  const { context, data, language = 'en' } = req.body || {};

  if (!context || !data) {
    return res.status(400).json({ error: 'Missing context or data' });
  }

  const builder = promptBuilders[context];
  if (!builder) {
    return res.status(400).json({ error: `Invalid context: ${context}. Valid: ${Object.keys(promptBuilders).join(', ')}` });
  }

  const systemPrompt = `You are an on-chain analyst at DeFi Mexico.
Write in short terminal-style lines, each starting with ">".
Be direct, use data points, identify patterns.
Write 4-6 paragraphs max. Keep each line under 100 characters.
${language === 'es' ? 'Respond in Spanish.' : 'Respond in English.'}
Never speculate beyond the data provided. Never hallucinate numbers.
After your analysis, output a single line starting with "TAGS:" followed by 2-4 comma-separated tags that classify this entity (e.g. "High Conviction, Sniper, 24/7 Operator" or "Growing Exchange, Stablecoin Hub").`;

  const userPrompt = builder(data);

  try {
    // Set up SSE streaming
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');

    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        res.write(`data: ${JSON.stringify({ text: event.delta.text })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('AI explain error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to generate explanation' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  }
}
