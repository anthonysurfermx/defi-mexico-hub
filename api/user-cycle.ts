// ============================================================
// POST /api/user-cycle — Personal Agent Debate Cycle
// Generates a 3-agent debate for a specific user's agent
// Uses Haiku for cost efficiency ($0.001/call)
// Reuses global market snapshot, personalizes with agent config
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

export const config = { maxDuration: 60 };

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const SB_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const PERSONALITY_PROMPTS: Record<string, string> = {
  direct: 'Be concise, aggressive, no BS. Go straight to the action. Use short sentences. Be bold in your conviction.',
  analytical: 'Be data-driven. Show probabilities and percentages. Cite specific indicators (RSI, MACD, funding rates, volume). Structure your analysis with numbers.',
  wise: 'Be philosophical and contextual. Consider macro implications, historical patterns, and market psychology. Take the long view. Be measured but insightful.',
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const cycleSecret = process.env.BOBBY_CYCLE_SECRET;
  if (cycleSecret) {
    const auth = req.headers.authorization;
    const bodySecret = (req.body as any)?.secret;
    if (auth !== `Bearer ${cycleSecret}` && bodySecret !== cycleSecret) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  if (!ANTHROPIC_API_KEY || !SB_SERVICE_KEY) {
    return res.status(500).json({ error: 'Server misconfigured' });
  }

  const supabase = createClient(SB_URL, SB_SERVICE_KEY);
  const { agent_profile_id, wallet_address } = req.body || {};

  // Load agent profile
  let profile: any;
  if (agent_profile_id) {
    const { data } = await supabase.from('agent_profiles').select('*').eq('id', agent_profile_id).single();
    profile = data;
  } else if (wallet_address) {
    const { data } = await supabase.from('agent_profiles').select('*').eq('wallet_address', wallet_address.toLowerCase()).single();
    profile = data;
  }

  if (!profile) {
    return res.status(404).json({ error: 'Agent profile not found' });
  }

  const { agent_name, personality, markets, cadence_hours } = profile;
  const personalityPrompt = PERSONALITY_PROMPTS[personality] || PERSONALITY_PROMPTS.analytical;

  try {
    // Fetch current market prices for the user's selected markets
    let marketData = '';
    try {
      const tickerRes = await fetch(`https://defimexico.org/api/okx-tickers`);
      const tickerJson = await tickerRes.json();
      if (tickerJson.ok) {
        const relevant = tickerJson.tickers.filter((t: any) =>
          (markets as string[]).some(m => t.symbol === m || t.instId?.startsWith(m))
        );
        marketData = relevant.map((t: any) =>
          `${t.symbol}: $${t.last} (${t.change24h >= 0 ? '+' : ''}${t.change24h}%, vol: $${Math.round(t.vol24h).toLocaleString()})`
        ).join('\n');
      }
    } catch {}

    if (!marketData) {
      marketData = (markets as string[]).map(m => `${m}: price data unavailable`).join('\n');
    }

    // Generate 3-agent debate with single Haiku call
    const systemPrompt = `You are generating a 3-agent trading debate for an AI trading room called "${agent_name}".

PERSONALITY STYLE: ${personalityPrompt}

The 3 agents are:
1. ALPHA HUNTER — finds opportunities, presents bullish/bearish thesis with entry, TP, SL
2. RED TEAM — challenges every thesis, finds flaws, macro risks, reasons NOT to trade
3. ${agent_name} CIO — synthesizes both, sets conviction score (1-10), decides EXECUTE or REJECT

MARKETS TO ANALYZE: ${(markets as string[]).join(', ')}

CURRENT MARKET DATA:
${marketData}

Generate a debate in this exact JSON format:
{
  "symbol": "the main asset discussed",
  "direction": "long" or "short",
  "conviction": 0.1 to 1.0,
  "topic": "one-line debate topic",
  "alpha_post": "Alpha Hunter's full analysis (2-3 paragraphs)",
  "red_post": "Red Team's counter-argument (2-3 paragraphs)",
  "cio_post": "${agent_name} CIO's verdict synthesizing both (2-3 paragraphs)",
  "entry_price": number or null,
  "target_price": number or null,
  "stop_price": number or null
}

Respond ONLY with the JSON, no markdown fences.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: systemPrompt,
        messages: [{ role: 'user', content: 'Generate the debate now based on current market conditions.' }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('[user-cycle] Claude error:', errText);
      await supabase.from('agent_profiles').update({ last_error: `Claude ${response.status}` }).eq('id', profile.id);
      return res.status(502).json({ error: 'AI service error' });
    }

    const aiData = await response.json() as { content: Array<{ text: string }> };
    let text = aiData.content[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      await supabase.from('agent_profiles').update({ last_error: 'Failed to parse debate JSON' }).eq('id', profile.id);
      return res.status(500).json({ error: 'Failed to parse debate' });
    }

    const debate = JSON.parse(jsonMatch[0]);

    // Save to forum_threads with scope='private'
    const { data: thread, error: threadErr } = await supabase.from('forum_threads').insert({
      topic: debate.topic || `${agent_name} analysis — ${debate.symbol}`,
      trigger_reason: `Scheduled ${cadence_hours}h cycle`,
      status: debate.conviction >= 0.6 ? 'executed' : 'rejected',
      language: 'en',
      conviction_score: debate.conviction,
      symbol: debate.symbol,
      direction: debate.direction,
      entry_price: debate.entry_price,
      target_price: debate.target_price,
      stop_price: debate.stop_price,
      price_at_creation: {},
      scope: 'private',
      agent_profile_id: profile.id,
      owner_user_id: profile.user_id || null,
    }).select().single();

    if (threadErr) {
      console.error('[user-cycle] Thread insert error:', threadErr);
      return res.status(500).json({ error: threadErr.message });
    }

    // Save 3 agent posts
    const posts = [
      { thread_id: thread.id, agent: 'alpha', content: debate.alpha_post },
      { thread_id: thread.id, agent: 'redteam', content: debate.red_post },
      { thread_id: thread.id, agent: 'cio', content: debate.cio_post },
    ];

    await supabase.from('forum_posts').insert(posts);

    // Update agent profile
    const nextRun = new Date();
    nextRun.setHours(nextRun.getHours() + cadence_hours);

    await supabase.from('agent_profiles').update({
      status: 'active',
      last_run_at: new Date().toISOString(),
      next_run_at: nextRun.toISOString(),
      last_error: null,
    }).eq('id', profile.id);

    return res.status(200).json({
      ok: true,
      agent_name,
      thread_id: thread.id,
      symbol: debate.symbol,
      direction: debate.direction,
      conviction: debate.conviction,
      executed: debate.conviction >= 0.6,
    });
  } catch (err) {
    console.error('[user-cycle] Error:', err);
    const msg = err instanceof Error ? err.message : 'Unknown error';
    await supabase.from('agent_profiles').update({ last_error: msg }).eq('id', profile.id).catch(() => {});
    return res.status(500).json({ error: msg });
  }
}
