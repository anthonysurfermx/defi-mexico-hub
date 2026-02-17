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

  const strategy = data.strategy;
  const strategyBlock = strategy ? `
STRATEGY CLASSIFICATION: ${strategy.type} ("${strategy.label}") at ${strategy.confidence}% confidence
STRATEGY DESCRIPTION: ${strategy.description}
STRATEGY METRICS: avgROI=${strategy.avgROI}%, sizeCV=${strategy.sizeCV}, directionalBias=${strategy.directionalBias}%, bimodal=${strategy.bimodal}` : '';

  return `Analyze this Polymarket wallet behavior.

WALLET: ${data.wallet}
PORTFOLIO: $${data.metrics?.portfolioValue || 0}
P&L: $${data.metrics?.profitPnL || 0}
POSITIONS: ${data.positions?.length || 0} open
WIN RATE: ${data.winRate || 0}%
BOT SCORE: ${data.botSignals?.botScore || 0} (${data.botSignals?.classification || 'unknown'})

SIGNALS:
${signalLines}
${strategyBlock}

TOP POSITIONS:
${topPositions || 'None'}

${data.marketContext ? `ANALYZING IN CONTEXT OF MARKET: ${data.marketContext}` : ''}

Focus on: Explain the detected strategy type and what it means for this wallet's trading approach. Reference the strategy metrics (ROI, sizing consistency, directional bias, bimodality). What patterns stand out? Is this wallet worth following? What risks should a copy-trader consider?`;
}

function buildExchangeMetricsPrompt(data: any): string {
  const topChains = (data.topChains || [])
    .map((c: any) => `${c.name}: $${(c.tvl / 1e9).toFixed(2)}B`)
    .join(', ');

  const topProtocols = (data.topProtocols || [])
    .map((p: any) => `${p.name}: $${(p.tvl / 1e9).toFixed(2)}B (${p.change_1d >= 0 ? '+' : ''}${(p.change_1d || 0).toFixed(2)}% 24h)`)
    .join('\n');

  return `Analyze global DeFi metrics snapshot.

GLOBAL TVL: $${((data.globalTVL || 0) / 1e9).toFixed(2)}B (${data.globalTVLChange >= 0 ? '+' : ''}${(data.globalTVLChange || 0).toFixed(2)}% 24h)
24H DEX VOLUME: $${((data.dexVolume || 0) / 1e9).toFixed(2)}B (${data.dexVolumeChange >= 0 ? '+' : ''}${(data.dexVolumeChange || 0).toFixed(2)}% 24h)
24H PROTOCOL FEES: $${((data.totalFees || 0) / 1e6).toFixed(1)}M (${data.totalFeesChange >= 0 ? '+' : ''}${(data.totalFeesChange || 0).toFixed(2)}% 24h)
STABLECOINS MARKET CAP: $${((data.stablecoinsMcap || 0) / 1e9).toFixed(2)}B (${data.stablecoinsMcapChange >= 0 ? '+' : ''}${(data.stablecoinsMcapChange || 0).toFixed(2)}% 24h)

TOP CHAINS BY TVL: ${topChains || 'N/A'}

TOP PROTOCOLS:
${topProtocols || 'N/A'}

Identify key trends: Is DeFi growing or contracting? Which chains/protocols are gaining share? What does fee revenue vs TVL tell us? What should traders and builders pay attention to right now?`;
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

function buildLatamExchangesPrompt(data: any): string {
  const topExchanges = (data.topExchanges || [])
    .map((e: any) => `${e.name} (${e.type}): ${e.pairCount} LATAM pairs`)
    .join('\n');

  const currencyBreakdown = (data.currencyBreakdown || [])
    .map((c: any) => `${c.flag} ${c.code}: ${c.pairs} pairs across ${c.exchanges} exchanges`)
    .join('\n');

  return `Analyze LATAM exchange coverage data from live API scans.

TOTAL ACTIVE PAIRS: ${data.totalActivePairs || 0}
EXCHANGES WITH LATAM PAIRS: ${data.exchangesWithPairs || 0} / ${data.totalExchanges || 0}
CURRENCIES WITH PRESENCE: ${data.currenciesWithPresence || 0} / ${data.totalCurrencies || 0}
CURRENCIES WITH ZERO PAIRS: ${(data.currenciesWithNoPairs || []).join(', ') || 'None'}

TOP EXCHANGES BY LATAM COVERAGE:
${topExchanges || 'N/A'}

CURRENCY BREAKDOWN:
${currencyBreakdown || 'N/A'}

Analyze: Which countries have the best exchange coverage? Where are the biggest gaps? What does this mean for LATAM crypto adoption? Which exchanges are best positioned for LATAM growth?`;
}

const promptBuilders: Record<string, (data: any) => string> = {
  'wallet': buildWalletPrompt,
  'exchange-metrics': buildExchangeMetricsPrompt,
  'latam-exchanges': buildLatamExchangesPrompt,
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

When analyzing wallets with a STRATEGY CLASSIFICATION, explain what the strategy archetype means:
- MARKET_MAKER ("The House"): provides liquidity on both sides, collects the spread between YES+NO < $1.00, uses merges to recombine tokens. Consistent sizing, low risk per trade.
- SNIPER ("Latency Arb"): exploits oracle lag between spot exchanges and Polymarket odds. Buys underpriced directional bets, high ROI per trade. Reacts to price information faster than the market.
- HYBRID ("Spread + Alpha"): combines market-making base (both-sides, spreads) with directional overlays when model detects mispricing. Bimodal entry prices reveal the dual strategy.
- MOMENTUM ("Trend Rider"): scales into one direction with rhythmic intervals, follows short-term momentum signals.
Reference the specific metrics (avgROI, sizeCV, directionalBias, bimodal) to support your analysis.

After your analysis, output a single line starting with "TAGS:" followed by 2-4 comma-separated tags that classify this entity (e.g. "Market Maker, The House, 24/7 Operator" or "Sniper, Latency Arb, High ROI").`;

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
