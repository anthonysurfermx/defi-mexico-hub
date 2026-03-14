// Lightweight test endpoint to diagnose agent-run failures
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  const checks: Record<string, string> = {};

  // 1. Check env vars
  checks.ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY ? 'SET' : 'MISSING';
  checks.SUPABASE_URL = process.env.SUPABASE_URL ? 'SET' : 'MISSING';
  checks.VITE_SUPABASE_URL = process.env.VITE_SUPABASE_URL ? 'SET' : 'MISSING';
  checks.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING';
  checks.OKX_API_KEY = process.env.OKX_API_KEY ? 'SET' : 'MISSING';
  checks.CRON_SECRET = process.env.CRON_SECRET ? 'SET' : 'MISSING';
  checks.ENABLE_LIVE_TRADING = process.env.ENABLE_LIVE_TRADING || 'NOT SET';

  // 2. Test imports
  try {
    const { collectDexSignals } = await import('../src/lib/agent/collectors');
    checks.import_collectors = 'OK';

    // Quick test: fetch just OKX signals
    const signals = await collectDexSignals(['1']);
    checks.okx_signals = `${signals.length} signals from ETH`;
  } catch (err) {
    checks.import_collectors = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { filterSignals } = await import('../src/lib/agent/filters');
    checks.import_filters = 'OK';
  } catch (err) {
    checks.import_filters = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { analyzeWithClaude } = await import('../src/lib/agent/reasoning');
    checks.import_reasoning = 'OK';
  } catch (err) {
    checks.import_reasoning = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { applyRiskGate } = await import('../src/lib/agent/risk-gate');
    checks.import_risk_gate = 'OK';
  } catch (err) {
    checks.import_risk_gate = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  try {
    const { runAgentCycle } = await import('../src/lib/agent/runner');
    checks.import_runner = 'OK';
  } catch (err) {
    checks.import_runner = `FAIL: ${err instanceof Error ? err.message : String(err)}`;
  }

  return res.status(200).json({ ok: true, checks });
}
