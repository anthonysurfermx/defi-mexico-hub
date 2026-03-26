// ============================================================
// GET /api/bobby-signals — Fast technical indicators endpoint
// Only fetches OKX Agent Trade Kit indicators (no whale signals,
// no Polymarket, no Fear & Greed). ~2-3s response time.
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 15 };

interface IndicatorResult {
  symbol: string;
  timeframe: string;
  indicators: Record<string, any>;
}

async function fetchIndicators(instId: string, bar = '1H'): Promise<IndicatorResult | null> {
  try {
    const body = {
      instId,
      timeframes: [bar],
      indicators: {
        RSI: { paramList: [14] },
        MACD: { paramList: [12, 26, 9] },
        BB: { paramList: [20, 2] },
        MA: { paramList: [50, 200] },
        EMA: { paramList: [12, 26] },
        KDJ: { paramList: [9, 3, 3] },
        ATR: { paramList: [14] },
        SUPERTREND: { paramList: [10, 3] },
        AHR999: {},
        BTCRAINBOW: {},
      },
    };
    const res = await fetch('https://www.okx.com/api/v5/aigc/mcp/indicators', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const nested = data?.data?.[0]?.data?.[0]?.timeframes?.[bar]?.indicators;
    if (!nested) return null;
    const flat: Record<string, any> = {};
    for (const [key, arr] of Object.entries(nested)) {
      if (Array.isArray(arr) && arr.length > 0) {
        flat[key] = (arr as any[])[0].values || (arr as any[])[0];
      }
    }
    return { symbol: instId, timeframe: bar, indicators: flat };
  } catch { return null; }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  res.setHeader('Cache-Control', 's-maxage=120, stale-while-revalidate=60');

  try {
    const [btc, eth] = await Promise.all([
      fetchIndicators('BTC-USDT', '1H'),
      fetchIndicators('ETH-USDT', '1H'),
    ]);

    const results = [btc, eth].filter(Boolean) as IndicatorResult[];

    if (!results.length) {
      return res.status(503).json({ error: 'OKX indicator API unavailable' });
    }

    return res.status(200).json({
      ok: true,
      source: 'OKX Agent Trade Kit',
      ts: Date.now(),
      indicators: results,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
