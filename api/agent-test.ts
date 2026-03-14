// Lightweight test endpoint to diagnose agent-run
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { collectDexSignals } from './lib/agent-collectors';
import { filterSignals } from './lib/agent-filters';
import { runAgentCycle } from './lib/agent-runner';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {};

  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING';
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING';
  checks.OKX_API_KEY = process.env.OKX_API_KEY ? 'SET' : 'MISSING';
  checks.CRON_SECRET = process.env.CRON_SECRET ? 'SET' : 'MISSING';
  checks.imports = 'OK';

  try {
    const signals = await collectDexSignals(['1']);
    checks.collector = `OK — ${signals.length} signals from ETH`;

    const filtered = filterSignals(signals);
    checks.filter = `OK — ${filtered.length} passed filters`;
  } catch (err) {
    checks.error = err instanceof Error ? err.message : String(err);
  }

  return res.status(200).json({ ok: true, checks });
}
