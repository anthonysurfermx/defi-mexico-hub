// ============================================================
// GET /api/stock-chart?symbol=NVDA&range=5d
// Yahoo Finance Chart API — returns OHLCV candles for stock charts
// Used by Bobby's stock chart views and technical overlays
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const VALID_RANGES: Record<string, { range: string; interval: string }> = {
  '1d': { range: '1d', interval: '15m' },
  '5d': { range: '5d', interval: '1h' },
  '1mo': { range: '1mo', interval: '1d' },
  '3mo': { range: '3mo', interval: '1d' },
  '6mo': { range: '6mo', interval: '1d' },
  '1y': { range: '1y', interval: '1wk' },
};

interface YahooChartResult {
  meta?: {
    symbol?: string;
    currency?: string;
    exchangeName?: string;
    instrumentType?: string;
  };
  timestamp?: number[];
  indicators?: {
    quote?: Array<{
      open?: Array<number | null>;
      high?: Array<number | null>;
      low?: Array<number | null>;
      close?: Array<number | null>;
      volume?: Array<number | null>;
    }>;
  };
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const symbol = ((req.query.symbol as string) || 'NVDA').toUpperCase();
  const rangeKey = ((req.query.range as string) || '5d').toLowerCase();
  const rangeConfig = VALID_RANGES[rangeKey] || VALID_RANGES['5d'];

  if (!/^[A-Z][A-Z0-9.-]{0,9}$/.test(symbol)) {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=${rangeConfig.interval}&range=${rangeConfig.range}`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BobbyAgentTrader/1.0)',
      },
    });

    if (!response.ok) {
      return res.status(502).json({ error: `Yahoo Finance: ${response.status}` });
    }

    const data = await response.json() as {
      chart?: {
        error?: { code?: string; description?: string } | null;
        result?: YahooChartResult[];
      };
    };

    if (data.chart?.error) {
      return res.status(502).json({
        error: data.chart.error.description || data.chart.error.code || 'Yahoo chart error',
      });
    }

    const result = data.chart?.result?.[0];
    const timestamps = result?.timestamp;
    const quote = result?.indicators?.quote?.[0];

    if (!timestamps?.length || !quote) {
      return res.status(502).json({ error: 'No chart data' });
    }

    const candles = timestamps.map((ts, index) => {
      const o = quote.open?.[index];
      const h = quote.high?.[index];
      const l = quote.low?.[index];
      const c = quote.close?.[index];
      const vol = quote.volume?.[index] ?? 0;

      return {
        ts: ts * 1000,
        o: isFiniteNumber(o) ? o : NaN,
        h: isFiniteNumber(h) ? h : NaN,
        l: isFiniteNumber(l) ? l : NaN,
        c: isFiniteNumber(c) ? c : NaN,
        vol: isFiniteNumber(vol) ? vol : 0,
      };
    }).filter(candle =>
      Number.isFinite(candle.o) &&
      Number.isFinite(candle.h) &&
      Number.isFinite(candle.l) &&
      Number.isFinite(candle.c) &&
      candle.c > 0
    );

    if (candles.length === 0) {
      return res.status(502).json({ error: 'No valid candles' });
    }

    res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

    return res.status(200).json({
      ok: true,
      symbol,
      range: rangeKey,
      interval: rangeConfig.interval,
      meta: {
        currency: result?.meta?.currency || 'USD',
        exchange: result?.meta?.exchangeName || null,
        instrumentType: result?.meta?.instrumentType || null,
      },
      candles,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Stock Chart] Error:', msg);
    return res.status(500).json({ error: msg });
  }
}
