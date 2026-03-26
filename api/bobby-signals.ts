// ============================================================
// GET /api/bobby-signals — Technical indicators from latest cycle
// Reads cached indicators from Supabase (forum_threads.trigger_data)
// instead of calling OKX directly (Vercel IPs are blocked by OKX).
// Bobby's cycle already fetches indicators — we just read the cache.
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 10 };

const SB_URL = process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

  try {
    // Read latest thread that has technical data in trigger_data
    const sbRes = await fetch(
      `${SB_URL}/rest/v1/forum_threads?trigger_data->>technical=not.is.null&order=created_at.desc&limit=1&select=trigger_data,created_at,symbol,conviction_score`,
      { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
    );

    if (!sbRes.ok) {
      return res.status(503).json({ error: 'Supabase unavailable' });
    }

    const rows = await sbRes.json();
    if (!Array.isArray(rows) || !rows.length || !rows[0].trigger_data?.technical) {
      // Fallback: try reading technicalPulse from trigger_data
      const sbRes2 = await fetch(
        `${SB_URL}/rest/v1/forum_threads?order=created_at.desc&limit=5&select=trigger_data,created_at,symbol`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      const rows2 = await sbRes2.json();
      const withTech = rows2?.find((r: any) => r.trigger_data?.technical || r.trigger_data?.technicalLeader);

      if (!withTech) {
        return res.status(503).json({ error: 'No technical indicator data available yet. Waiting for next cycle.' });
      }

      return res.status(200).json({
        ok: true,
        source: 'OKX Agent Trade Kit (cached from Bobby cycle)',
        ts: new Date(withTech.created_at).getTime(),
        age: Date.now() - new Date(withTech.created_at).getTime(),
        technical: withTech.trigger_data.technical || withTech.trigger_data.technicalLeader,
        convictionModel: withTech.trigger_data.conviction_model || null,
        indicators: formatAsIndicators(withTech.trigger_data),
      });
    }

    const thread = rows[0];
    const td = thread.trigger_data;

    return res.status(200).json({
      ok: true,
      source: 'OKX Agent Trade Kit (cached from Bobby cycle)',
      ts: new Date(thread.created_at).getTime(),
      age: Date.now() - new Date(thread.created_at).getTime(),
      technical: td.technical,
      convictionModel: td.conviction_model || null,
      indicators: formatAsIndicators(td),
    });
  } catch (e: any) {
    return res.status(500).json({ error: e.message });
  }
}

function formatAsIndicators(triggerData: any): any[] {
  const tech = triggerData?.technical;
  if (!tech) return [];

  // If it's a single asset technical signal
  if (tech.symbol && tech.breakdown) {
    return [{
      symbol: tech.symbol,
      timeframe: '1H',
      compositeScore: tech.compositeScore,
      signal: tech.signal,
      conviction: tech.conviction,
      agreement: tech.agreement,
      indicators: Object.fromEntries(
        Object.entries(tech.breakdown).map(([name, reading]: [string, any]) => [
          name,
          { bias: reading.bias, score: reading.score, weight: reading.weight, raw: reading.raw }
        ])
      ),
      tradePlan: tech.tradePlan || null,
    }];
  }

  // If it's a full technicalPulse with multiple assets
  if (tech.assets) {
    return tech.assets.map((asset: any) => ({
      symbol: asset.symbol,
      timeframe: '1H',
      compositeScore: asset.compositeScore,
      signal: asset.signal,
      conviction: asset.conviction,
      agreement: asset.agreement,
      indicators: Object.fromEntries(
        Object.entries(asset.breakdown || {}).map(([name, reading]: [string, any]) => [
          name,
          { bias: reading.bias, score: reading.score, weight: reading.weight, raw: reading.raw }
        ])
      ),
      tradePlan: asset.tradePlan || null,
    }));
  }

  return [];
}
