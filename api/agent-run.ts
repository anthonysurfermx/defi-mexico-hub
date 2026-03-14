// ============================================================
// GET /api/agent-run
// Autonomous Agent Cycle — triggered by Vercel cron every 8 hours
// or manually for testing
// Flow: Collect signals → Filter → Claude reasoning → Risk gate → Execute → Log
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { runAgentCycle } from '../src/lib/agent/runner';
import { DEFAULT_RISK_CONFIG } from '../src/lib/agent/risk-gate';

export const config = {
  maxDuration: 60, // 60 second timeout for serverless
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Accept GET (cron) and POST (manual trigger)
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Verify cron secret for automated runs (skip for manual testing)
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.authorization;
  const isManualTrigger = req.query.manual === 'true';

  if (cronSecret && !isManualTrigger) {
    if (authHeader !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized — invalid CRON_SECRET' });
    }
  }

  // Allow overriding live trading via query param (default: simulation)
  const enableLive = req.query.live === 'true' && process.env.ENABLE_LIVE_TRADING === 'true';

  const riskConfig = {
    ...DEFAULT_RISK_CONFIG,
    enableLiveTrading: enableLive,
  };

  try {
    const result = await runAgentCycle(riskConfig);

    // No cache — each run is unique
    res.setHeader('Cache-Control', 'no-store');

    return res.status(200).json({
      ok: true,
      cycle: result,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[AgentRun] Fatal error:', msg);
    return res.status(500).json({ error: msg });
  }
}
