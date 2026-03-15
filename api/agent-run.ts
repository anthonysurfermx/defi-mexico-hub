// ============================================================
// GET /api/agent-run — Self-contained autonomous agent cycle
// Vercel cron every 8h or manual trigger
// All logic inlined (Vercel serverless can't import from src/)
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 60 };

// ---- Types ----
interface RawSignal {
  source: string;
  chain: string;
  tokenSymbol: string;
  tokenAddress: string;
  signalType: string;
  amountUsd: number;
  triggerWalletCount?: number;
  soldRatioPct?: number;
  marketCapUsd?: number;
  confidence?: number;
  metadata?: Record<string, unknown>;
}

interface FilteredSignal extends RawSignal {
  filterScore: number;
  reasons: string[];
}

interface TradeDecision {
  action: 'BUY' | 'SKIP';
  chain: string;
  tokenAddress: string;
  tokenSymbol: string;
  amountUsd: number;
  reason: string;
  confidence: number;
  signalSources: string[];
}

// ---- HMAC for OKX ----
async function hmacSign(message: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}

// ---- Collect OKX dex signals directly ----
async function collectDexSignals(): Promise<RawSignal[]> {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;
  const projectId = process.env.OKX_PROJECT_ID;

  if (!apiKey || !secretKey || !passphrase || !projectId) return [];

  const chains = ['1', '501', '8453']; // ETH, SOL, Base
  const signals: RawSignal[] = [];

  for (const chainIndex of chains) {
    try {
      const path = '/api/v6/dex/market/signal/list';
      const body = JSON.stringify({ chainIndex, walletType: '1,2,3', minAmountUsd: '5000' });
      const timestamp = new Date().toISOString();
      const signature = await hmacSign(timestamp + 'POST' + path + body, secretKey);

      const res = await fetch(`https://web3.okx.com${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'OK-ACCESS-KEY': apiKey,
          'OK-ACCESS-SIGN': signature,
          'OK-ACCESS-TIMESTAMP': timestamp,
          'OK-ACCESS-PASSPHRASE': passphrase,
          'OK-ACCESS-PROJECT': projectId,
        },
        body,
      });

      if (!res.ok) continue;
      const json = await res.json() as { code: string; data: unknown };
      if (json.code !== '0' || !Array.isArray(json.data)) continue;

      for (const s of json.data as Array<Record<string, unknown>>) {
        const token = s.token as Record<string, unknown> | undefined;
        signals.push({
          source: 'okx_dex_signal',
          chain: chainIndex,
          tokenSymbol: String(token?.symbol || 'UNKNOWN'),
          tokenAddress: String(token?.tokenAddress || ''),
          signalType: String(s.walletType || ''),
          amountUsd: parseFloat(String(s.amountUsd || '0')),
          triggerWalletCount: parseInt(String(s.triggerWalletCount || '0')),
          soldRatioPct: parseFloat(String(s.soldRatioPercent || '0')),
          marketCapUsd: parseFloat(String(token?.marketCapUsd || '0')),
        });
      }
    } catch (err) {
      console.error(`[Agent] Chain ${chainIndex} signal error:`, err);
    }
  }

  return signals;
}

// ---- Filter signals ----
function filterSignals(signals: RawSignal[]): FilteredSignal[] {
  const filtered: FilteredSignal[] = [];

  for (const signal of signals) {
    const reasons: string[] = [];
    let score = 0;

    if (signal.source === 'okx_dex_signal') {
      if (signal.amountUsd < 5000) continue;

      const wallets = signal.triggerWalletCount || 0;
      if (wallets >= 3) { score += 30; reasons.push(`${wallets} wallets`); }
      else if (wallets >= 2) { score += 15; reasons.push(`${wallets} wallets`); }
      else score += 5;

      const sold = signal.soldRatioPct || 0;
      if (sold < 10) { score += 25; reasons.push(`Only ${sold}% sold`); }
      else if (sold < 30) { score += 15; }
      else if (sold > 70) continue;

      if (signal.amountUsd > 100000) { score += 20; reasons.push(`$${(signal.amountUsd / 1000).toFixed(0)}K`); }
      else if (signal.amountUsd > 25000) { score += 10; }

      if (signal.signalType === '1') { score += 10; reasons.push('Smart Money'); }
      else if (signal.signalType === '3') { score += 8; reasons.push('Whale'); }
      else if (signal.signalType === '2') { score += 5; reasons.push('KOL'); }

      if (signal.marketCapUsd && signal.marketCapUsd < 100000) continue;
    }

    if (score < 20) continue;

    filtered.push({ ...signal, filterScore: Math.min(100, score), reasons });
  }

  filtered.sort((a, b) => b.filterScore - a.filterScore);
  return filtered.slice(0, 10);
}

// ---- Claude reasoning ----
async function analyzeWithClaude(signals: FilteredSignal[]): Promise<{ decisions: TradeDecision[]; reasoning: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { decisions: [], reasoning: 'No API key' };

  const systemPrompt = `You are Agent Radar, an autonomous crypto trading agent.
RULES: Max 3 trades, max $50 each, min 0.7 confidence. Prefer low sold ratio (<20%), multiple wallet triggers.
SKIP honeypots, rug pulls, low liquidity. Be concise. Call execute_decisions with your analysis.`;

  const userMsg = `Signals (${signals.length}):\n${signals.map((s, i) =>
    `[${i + 1}] ${s.tokenSymbol} (chain ${s.chain}) — $${s.amountUsd.toLocaleString()} — score ${s.filterScore} — ${s.reasons.join(', ')}`
  ).join('\n')}\n\nAnalyze and call execute_decisions.`;

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: systemPrompt,
        tools: [{
          name: 'execute_decisions',
          description: 'Submit trading decisions',
          input_schema: {
            type: 'object',
            properties: {
              reasoning: { type: 'string' },
              trades: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    action: { type: 'string', enum: ['BUY', 'SKIP'] },
                    chain: { type: 'string' },
                    token_address: { type: 'string' },
                    token_symbol: { type: 'string' },
                    amount_usd: { type: 'number' },
                    reason: { type: 'string' },
                    confidence: { type: 'number' },
                  },
                  required: ['action', 'token_symbol', 'reason', 'confidence'],
                },
              },
            },
            required: ['reasoning', 'trades'],
          },
        }],
        tool_choice: { type: 'tool', name: 'execute_decisions' },
        messages: [{ role: 'user', content: userMsg }],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { decisions: [], reasoning: `Claude ${res.status}: ${text.slice(0, 100)}` };
    }

    const result = await res.json() as { content: Array<{ type: string; input?: Record<string, unknown> }> };
    const toolUse = result.content.find((b) => b.type === 'tool_use');
    if (!toolUse?.input) return { decisions: [], reasoning: 'No tool call' };

    const input = toolUse.input as { reasoning: string; trades: Array<Record<string, unknown>> };

    const decisions: TradeDecision[] = (input.trades || [])
      .filter(t => t.action === 'BUY' && Number(t.confidence) >= 0.7)
      .slice(0, 3)
      .map(t => ({
        action: 'BUY' as const,
        chain: String(t.chain || '1'),
        tokenAddress: String(t.token_address || ''),
        tokenSymbol: String(t.token_symbol),
        amountUsd: Math.min(Number(t.amount_usd) || 25, 50),
        reason: String(t.reason),
        confidence: Number(t.confidence),
        signalSources: ['okx_dex_signal'],
      }));

    return { decisions, reasoning: input.reasoning || '' };
  } catch (err) {
    return { decisions: [], reasoning: `Error: ${err instanceof Error ? err.message : String(err)}` };
  }
}

// ---- Risk gate ----
function applyRiskGate(decisions: TradeDecision[]): { approved: TradeDecision[]; blocked: number } {
  const approved: TradeDecision[] = [];
  let exposure = 0;

  for (const d of decisions) {
    if (d.amountUsd > 50) d.amountUsd = 50;
    if (exposure + d.amountUsd > 150) { continue; }
    if (d.confidence < 0.7) continue;
    approved.push(d);
    exposure += d.amountUsd;
  }

  return { approved, blocked: decisions.length - approved.length };
}

// ---- Fetch advisor profiles for personalized greetings ----
interface AdvisorProfile {
  wallet_address: string;
  user_name: string;
  advisor_name: string;
  categories: string[];
  language: string;
}

async function fetchAdvisorProfiles(): Promise<AdvisorProfile[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(`${url}/rest/v1/agent_profiles?select=*`, {
      headers: { apikey: key, Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function generateGreeting(
  profile: AdvisorProfile,
  cycle: { signals_found: number; signals_filtered: number; trades_executed: number; llm_reasoning: string; total_usd_deployed: number },
): string {
  const hour = new Date().getUTCHours();
  const isES = profile.language === 'es';

  // Time-aware greeting
  let greeting: string;
  if (hour >= 5 && hour < 12) {
    greeting = isES ? `Buenos días ${profile.user_name}!` : `Good morning ${profile.user_name}!`;
  } else if (hour >= 12 && hour < 18) {
    greeting = isES ? `Buenas tardes ${profile.user_name}!` : `Good afternoon ${profile.user_name}!`;
  } else {
    greeting = isES ? `Buenas noches ${profile.user_name}!` : `Good evening ${profile.user_name}!`;
  }

  const lines: string[] = [
    `*${profile.advisor_name}*`,
    '',
    greeting,
    '',
  ];

  if (isES) {
    lines.push(`Acabo de completar mi análisis del mercado.`);
    lines.push(`Escaneé ${cycle.signals_found} señales y ${cycle.signals_filtered} pasaron mis filtros.`);

    if (cycle.trades_executed > 0) {
      lines.push('');
      lines.push(`Ejecuté ${cycle.trades_executed} operaciones por un total de $${cycle.total_usd_deployed.toFixed(2)}.`);
    } else {
      lines.push('');
      lines.push('No encontré oportunidades que cumplan mis criterios de riesgo esta vez. Seguiré monitoreando.');
    }

    if (cycle.llm_reasoning) {
      lines.push('');
      lines.push(`Mi análisis: _${cycle.llm_reasoning}_`);
    }

    lines.push('');
    lines.push(`Tus categorías: ${profile.categories.join(', ')}`);
    lines.push('Nos vemos en 8 horas.');
  } else {
    lines.push(`I just completed my market analysis.`);
    lines.push(`Scanned ${cycle.signals_found} signals, ${cycle.signals_filtered} passed my filters.`);

    if (cycle.trades_executed > 0) {
      lines.push('');
      lines.push(`Executed ${cycle.trades_executed} trades totaling $${cycle.total_usd_deployed.toFixed(2)}.`);
    } else {
      lines.push('');
      lines.push('No opportunities met my risk criteria this cycle. Still watching.');
    }

    if (cycle.llm_reasoning) {
      lines.push('');
      lines.push(`My analysis: _${cycle.llm_reasoning}_`);
    }

    lines.push('');
    lines.push(`Your categories: ${profile.categories.join(', ')}`);
    lines.push('See you in 8 hours.');
  }

  return lines.join('\n');
}

// ---- Save greeting messages to Supabase ----
async function saveGreetings(greetings: Array<{ wallet_address: string; advisor_name: string; message: string }>) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || greetings.length === 0) return;

  try {
    await fetch(`${url}/rest/v1/agent_messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(greetings.map(g => ({
        wallet_address: g.wallet_address,
        advisor_name: g.advisor_name,
        message: g.message,
        created_at: new Date().toISOString(),
      }))),
    });
  } catch (err) {
    console.warn('[Agent] Greeting save failed:', err);
  }
}

// ---- Supabase logging ----
async function logToSupabase(data: Record<string, unknown>) {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;

  try {
    await fetch(`${url}/rest/v1/agent_cycles`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: key,
        Authorization: `Bearer ${key}`,
        Prefer: 'return=minimal',
      },
      body: JSON.stringify(data),
    });
  } catch (err) {
    console.warn('[Agent] Supabase log failed:', err);
  }
}

// ============================================================
// HANDLER
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Auth check for cron (skip for manual)
  const cronSecret = process.env.CRON_SECRET;
  const isManual = req.query.manual === 'true';
  if (cronSecret && !isManual) {
    if (req.headers.authorization !== `Bearer ${cronSecret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const startMs = Date.now();
  const startedAt = new Date().toISOString();

  try {
    // Phase 1: Collect
    console.log('[Agent] Collecting signals...');
    const raw = await collectDexSignals();
    console.log(`[Agent] ${raw.length} raw signals`);

    // Phase 2: Filter
    const filtered = filterSignals(raw);
    console.log(`[Agent] ${filtered.length} passed filters`);

    if (filtered.length === 0) {
      const result = {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        signals_found: raw.length,
        signals_filtered: 0,
        llm_decisions: 0,
        trades_executed: 0,
        trades_blocked: 0,
        total_usd_deployed: 0,
        latency_ms: Date.now() - startMs,
        llm_reasoning: 'No actionable signals this cycle.',
        status: 'completed',
      };
      await logToSupabase(result);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({ ok: true, cycle: result });
    }

    // Phase 3: Claude analysis
    console.log('[Agent] Claude analyzing...');
    const { decisions, reasoning } = await analyzeWithClaude(filtered);
    console.log(`[Agent] ${decisions.length} decisions`);

    // Phase 4: Risk gate
    const { approved, blocked } = applyRiskGate(decisions);
    console.log(`[Agent] ${approved.length} approved, ${blocked} blocked`);

    // Phase 5: Execute (simulation mode — real execution needs wallet)
    const trades = approved.map(d => ({
      ...d,
      txHash: `SIM-${Date.now()}-${d.tokenSymbol}`,
      status: 'simulated',
    }));

    const totalDeployed = trades.reduce((sum, t) => sum + t.amountUsd, 0);

    // Phase 6: Log
    const result = {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      signals_found: raw.length,
      signals_filtered: filtered.length,
      llm_decisions: decisions.length,
      trades_executed: trades.length,
      trades_blocked: blocked,
      total_usd_deployed: totalDeployed,
      latency_ms: Date.now() - startMs,
      llm_model: 'claude-sonnet-4-20250514',
      llm_reasoning: reasoning,
      status: 'completed',
    };

    await logToSupabase(result);

    // Phase 7: Generate personalized greetings for all advisors
    console.log('[Agent] Generating greetings...');
    const profiles = await fetchAdvisorProfiles();
    const greetings = profiles.map(p => ({
      wallet_address: p.wallet_address,
      advisor_name: p.advisor_name,
      message: generateGreeting(p, result),
    }));
    await saveGreetings(greetings);
    console.log(`[Agent] ${greetings.length} greetings sent`);

    console.log(`[Agent] Done in ${result.latency_ms}ms — ${trades.length} trades`);

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({
      ok: true,
      cycle: result,
      trades,
      greetings: greetings.map(g => ({ advisor: g.advisor_name, wallet: g.wallet_address.slice(0, 8) + '...' })),
      topSignals: filtered.slice(0, 5).map(s => ({
        token: s.tokenSymbol,
        chain: s.chain,
        score: s.filterScore,
        reasons: s.reasons,
      })),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Agent] Fatal:', msg);

    await logToSupabase({
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      signals_found: 0,
      signals_filtered: 0,
      llm_decisions: 0,
      trades_executed: 0,
      trades_blocked: 0,
      total_usd_deployed: 0,
      latency_ms: Date.now() - startMs,
      llm_reasoning: '',
      error: msg,
      status: 'failed',
    });

    return res.status(500).json({ error: msg });
  }
}
