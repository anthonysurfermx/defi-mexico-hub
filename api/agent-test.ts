// Minimal test — no external imports beyond @vercel/node
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {};

  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING';
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  checks.OKX_API_KEY = process.env.OKX_API_KEY ? 'SET' : 'MISSING';
  checks.CRON_SECRET = process.env.CRON_SECRET ? 'SET' : 'MISSING';

  // Test OKX signal fetch directly
  try {
    const BASE_URL = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'https://defi-mexico-hub.vercel.app';

    const r = await fetch(`${BASE_URL}/api/okx-signal?chains=1&walletType=1,3&minAmountUsd=5000`);
    const d = await r.json();
    checks.okx_signals = d.ok ? `OK — ${d.signals?.length || 0} signals` : `FAIL: ${d.error}`;
  } catch (err) {
    checks.okx_signals = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test Claude API directly
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      checks.claude = 'SKIP — no API key';
    } else {
      const r = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 50,
          messages: [{ role: 'user', content: 'Say "Agent Radar online" in 5 words or less.' }],
        }),
      });
      if (r.ok) {
        const data = await r.json();
        const text = data.content?.[0]?.text || 'no response';
        checks.claude = `OK — "${text}"`;
      } else {
        const text = await r.text();
        checks.claude = `FAIL ${r.status}: ${text.slice(0, 100)}`;
      }
    }
  } catch (err) {
    checks.claude = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  // Test Supabase connection
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      checks.supabase = 'SKIP — missing env vars';
    } else {
      const r = await fetch(`${url}/rest/v1/agent_cycles?select=id&limit=1`, {
        headers: { apikey: key, Authorization: `Bearer ${key}` },
      });
      if (r.ok) {
        checks.supabase = 'OK — table exists';
      } else {
        const t = await r.text();
        checks.supabase = `${r.status}: ${t.slice(0, 100)}`;
      }
    }
  } catch (err) {
    checks.supabase = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  return res.status(200).json({ ok: true, checks });
}
