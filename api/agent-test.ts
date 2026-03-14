// Lightweight test endpoint to diagnose agent-run failures
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {};

  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING';
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING';
  checks.OKX_API_KEY = process.env.OKX_API_KEY ? 'SET' : 'MISSING';
  checks.CRON_SECRET = process.env.CRON_SECRET ? 'SET' : 'MISSING';

  try {
    const { collectDexSignals } = await import('./lib/agent-collectors');
    const signals = await collectDexSignals(['1']);
    checks.collector = `OK — ${signals.length} signals`;
  } catch (err) {
    checks.collector = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { filterSignals } = await import('./lib/agent-filters');
    checks.filters = 'OK';
  } catch (err) {
    checks.filters = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { runAgentCycle } = await import('./lib/agent-runner');
    checks.runner = 'OK (import)';
  } catch (err) {
    checks.runner = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  return res.status(200).json({ ok: true, checks });
}
