// ============================================================
// GET /api/bobby-signals — Technical indicators from latest cycle
// Reads cached indicators from Supabase (forum_threads.trigger_data)
// OKX blocks Vercel IPs — we read from Bobby's cycle cache instead.
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    // Read last 10 threads and find one with technical data
    const sbRes = await fetch(
      `${SB_URL}/rest/v1/forum_threads?trigger_data=not.is.null&order=created_at.desc&limit=10&select=trigger_data,created_at,symbol,conviction_score`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );

    if (!sbRes.ok) {
      return res.status(503).json({ error: 'Supabase unavailable' });
    }

    const rows = await sbRes.json();
    if (!Array.isArray(rows) || !rows.length) {
      return res.status(503).json({ error: 'No cycle data available yet' });
    }

    // Find first thread that has technical data
    const withTech = rows.find((r: any) => r.trigger_data?.technical?.assets?.length > 0);

    if (!withTech) {
      return res.status(503).json({ error: 'No technical indicator data available yet. Waiting for next cycle with OKX Agent Trade Kit.' });
    }

    const tech = withTech.trigger_data.technical;
    const convictionModel = withTech.trigger_data.conviction_model || null;

    // Format assets with their indicator breakdowns
    const indicators = (tech.assets || []).map((asset: any) => ({
      symbol: asset.symbol,
      timeframe: '1H',
      compositeScore: asset.compositeScore,
      signal: asset.signal,
      conviction: asset.conviction,
      agreement: asset.agreement,
      tradePlan: asset.tradePlan || null,
      indicators: Object.fromEntries(
        Object.entries(asset.breakdown || {}).map(([name, reading]: [string, any]) => [
          name,
          { bias: reading.bias, score: reading.score, weight: reading.weight, raw: reading.raw }
        ])
      ),
    }));

    return res.status(200).json({
      ok: true,
      source: 'OKX Agent Trade Kit (cached from Bobby cycle)',
      ts: new Date(withTech.created_at).getTime(),
      age: Date.now() - new Date(withTech.created_at).getTime(),
      regime: tech.regime || withTech.trigger_data.regime || null,
      leader: tech.leader || null,
      convictionModel,
      indicators,
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}
