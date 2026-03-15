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
async function analyzeWithClaude(signals: FilteredSignal[], polyConsensusData?: SmartMoneyConsensus[]): Promise<{ decisions: TradeDecision[]; reasoning: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return { decisions: [], reasoning: 'No API key' };

  const systemPrompt = `You are Agent Radar, an autonomous crypto trading agent.
RULES: Max 3 trades, max $50 each, min 0.7 confidence. Prefer low sold ratio (<20%), multiple wallet triggers.
SKIP honeypots, rug pulls, low liquidity. Be concise. Call execute_decisions with your analysis.`;

  // Build Polymarket context if available
  const polyContext = polyConsensusData && polyConsensusData.length > 0
    ? `\n\nPolymarket Smart Money Consensus (${polyConsensusData.length} markets with 2+ top traders):\n${polyConsensusData.slice(0, 5).map((m, i) =>
        `[P${i + 1}] "${m.title}" — ${m.traderCount} traders, ${m.topOutcomePct.toFixed(0)}% on ${m.topOutcome}, price ${Math.round(m.currentPrice * 100)}¢, entry ${Math.round(m.avgEntryPrice * 100)}¢, edge ${m.edgePct.toFixed(1)}%`
      ).join('\n')}\nConsider these prediction markets when assessing macro sentiment.`
    : '';

  const userMsg = `Signals (${signals.length}):\n${signals.map((s, i) =>
    `[${i + 1}] ${s.tokenSymbol} (chain ${s.chain}) — $${s.amountUsd.toLocaleString()} — score ${s.filterScore} — ${s.reasons.join(', ')}`
  ).join('\n')}${polyContext}\n\nAnalyze and call execute_decisions.`;

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

// ---- Polymarket Intelligence — Direct API calls ----

const POLY_DATA = 'https://data-api.polymarket.com';
const POLY_GAMMA = 'https://gamma-api.polymarket.com';

interface PolyLeaderboardEntry {
  proxyWallet: string;
  userName: string;
  rank: number;
  pnl: number;
  volume: number;
}

interface PolyPosition {
  conditionId: string;
  title: string;
  outcome: string;
  size: number;
  avgPrice: number;
  curPrice: number;
  currentValue: number;
  slug: string;
}

interface SmartMoneyConsensus {
  conditionId: string;
  title: string;
  slug: string;
  traderCount: number;
  totalCapital: number;
  topOutcome: string;
  topOutcomePct: number;
  avgEntryPrice: number;
  currentPrice: number;
  edgePct: number;
}

async function fetchPolyLeaderboard(limit = 20): Promise<PolyLeaderboardEntry[]> {
  try {
    const res = await fetch(`${POLY_DATA}/v1/leaderboard?limit=${limit}&timePeriod=MONTH&category=OVERALL`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.map((t: Record<string, unknown>) => ({
      proxyWallet: String(t.proxyWallet || ''),
      userName: String(t.userName || 'Unknown'),
      rank: Number(t.rank || 0),
      pnl: Number(t.pnl || 0),
      volume: Number(t.volume || 0),
    }));
  } catch { return []; }
}

async function fetchPolyPositions(wallet: string): Promise<PolyPosition[]> {
  try {
    const res = await fetch(`${POLY_DATA}/positions?user=${wallet}&limit=100&sortBy=CURRENT`);
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((p: Record<string, unknown>) => Number(p.currentValue || 0) > 0.5)
      .map((p: Record<string, unknown>) => ({
        conditionId: String(p.conditionId || ''),
        title: String(p.title || ''),
        outcome: String(p.outcome || ''),
        size: Number(p.size || 0),
        avgPrice: Number(p.avgPrice || 0),
        curPrice: Number(p.curPrice || 0),
        currentValue: Number(p.currentValue || 0),
        slug: String(p.slug || ''),
      }));
  } catch { return []; }
}

function aggregatePolyConsensus(
  traders: PolyLeaderboardEntry[],
  positionsByWallet: Map<string, PolyPosition[]>
): SmartMoneyConsensus[] {
  // Group all positions by conditionId
  const marketMap = new Map<string, {
    title: string;
    slug: string;
    traders: Set<string>;
    outcomeCapital: Map<string, number>;
    totalCapital: number;
    entryPrices: number[];
    currentPrices: number[];
  }>();

  for (const trader of traders) {
    const positions = positionsByWallet.get(trader.proxyWallet) || [];
    for (const pos of positions) {
      if (!pos.conditionId) continue;
      let market = marketMap.get(pos.conditionId);
      if (!market) {
        market = {
          title: pos.title,
          slug: pos.slug,
          traders: new Set(),
          outcomeCapital: new Map(),
          totalCapital: 0,
          entryPrices: [],
          currentPrices: [],
        };
        marketMap.set(pos.conditionId, market);
      }
      market.traders.add(trader.proxyWallet);
      market.outcomeCapital.set(
        pos.outcome,
        (market.outcomeCapital.get(pos.outcome) || 0) + pos.currentValue
      );
      market.totalCapital += pos.currentValue;
      market.entryPrices.push(pos.avgPrice);
      market.currentPrices.push(pos.curPrice);
    }
  }

  // Convert to consensus array, filter 2+ traders
  const results: SmartMoneyConsensus[] = [];
  for (const [conditionId, m] of marketMap) {
    if (m.traders.size < 2) continue;

    // Find top outcome
    let topOutcome = '';
    let topCapital = 0;
    for (const [outcome, capital] of m.outcomeCapital) {
      if (capital > topCapital) {
        topOutcome = outcome;
        topCapital = capital;
      }
    }

    const avgEntry = m.entryPrices.reduce((a, b) => a + b, 0) / m.entryPrices.length;
    const avgCurrent = m.currentPrices.reduce((a, b) => a + b, 0) / m.currentPrices.length;

    results.push({
      conditionId,
      title: m.title,
      slug: m.slug,
      traderCount: m.traders.size,
      totalCapital: m.totalCapital,
      topOutcome,
      topOutcomePct: m.totalCapital > 0 ? (topCapital / m.totalCapital) * 100 : 0,
      avgEntryPrice: avgEntry,
      currentPrice: avgCurrent,
      edgePct: avgCurrent > 0 ? ((avgCurrent - avgEntry) / avgEntry) * 100 : 0,
    });
  }

  results.sort((a, b) => b.traderCount - a.traderCount || b.totalCapital - a.totalCapital);
  return results.slice(0, 10);
}

async function collectPolymarketIntelligence(): Promise<SmartMoneyConsensus[]> {
  console.log('[Agent] Fetching Polymarket leaderboard...');
  const traders = await fetchPolyLeaderboard(15);
  if (traders.length === 0) return [];

  console.log(`[Agent] ${traders.length} top traders, fetching positions...`);
  const positionsByWallet = new Map<string, PolyPosition[]>();

  // Batch fetch: 5 at a time
  for (let i = 0; i < traders.length; i += 5) {
    const batch = traders.slice(i, i + 5);
    const results = await Promise.allSettled(
      batch.map(t => fetchPolyPositions(t.proxyWallet))
    );
    results.forEach((r, idx) => {
      if (r.status === 'fulfilled') {
        positionsByWallet.set(batch[idx].proxyWallet, r.value);
      }
    });
  }

  const consensus = aggregatePolyConsensus(traders, positionsByWallet);
  console.log(`[Agent] ${consensus.length} Polymarket consensus markets found`);
  return consensus;
}

// ---- Fetch advisor profiles for personalized greetings ----
interface AdvisorProfile {
  wallet_address: string;
  user_name: string;
  advisor_name: string;
  categories: string[];
  language: string;
  scan_interval_hours: number;
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

interface GreetingContext {
  cycle: {
    signals_found: number;
    signals_filtered: number;
    trades_executed: number;
    trades_blocked: number;
    llm_reasoning: string;
    total_usd_deployed: number;
    latency_ms: number;
  };
  topFilteredSignals: FilteredSignal[];
  trades: Array<{ tokenSymbol: string; amountUsd: number; confidence: number; chain: string }>;
  polymarketData: SmartMoneyConsensus[];
}

function generateGreeting(profile: AdvisorProfile, ctx: GreetingContext): string {
  const hour = new Date().getUTCHours();
  const lang = profile.language || 'es';
  const hrs = profile.scan_interval_hours || 8;
  const { cycle, topFilteredSignals, trades, polymarketData } = ctx;

  // Time-aware greeting
  const greetingMap: Record<string, [string, string, string]> = {
    es: [`Buenos días ${profile.user_name}!`, `Buenas tardes ${profile.user_name}!`, `Buenas noches ${profile.user_name}!`],
    pt: [`Bom dia ${profile.user_name}!`, `Boa tarde ${profile.user_name}!`, `Boa noite ${profile.user_name}!`],
    en: [`Good morning ${profile.user_name}!`, `Good afternoon ${profile.user_name}!`, `Good evening ${profile.user_name}!`],
  };
  const greetings = greetingMap[lang] || greetingMap.en;
  const greeting = hour >= 5 && hour < 12 ? greetings[0] : hour >= 12 && hour < 18 ? greetings[1] : greetings[2];

  const chainName = (c: string) => c === '1' ? 'ETH' : c === '501' ? 'SOL' : c === '8453' ? 'Base' : c;

  const L: string[] = [
    `*${profile.advisor_name}*`,
    '',
    greeting,
    '',
  ];

  // ── OKX SECTION: COLLECT → FILTER → THINK → EXECUTE ──

  if (lang === 'es') {
    // COLLECT
    L.push(`--- OKX OnchainOS ---`);
    L.push(`Escaneé ${cycle.signals_found} señales on-chain (ETH, SOL, Base).`);
    if (topFilteredSignals.length > 0) {
      L.push(`Top señales detectadas:`);
      for (const s of topFilteredSignals.slice(0, 3)) {
        L.push(`  • ${s.tokenSymbol} (${chainName(s.chain)}) — $${(s.amountUsd / 1000).toFixed(1)}K — ${s.reasons.join(', ')}`);
      }
    }

    // FILTER
    L.push('');
    L.push(`${cycle.signals_found} → ${cycle.signals_filtered} pasaron filtros de calidad.`);

    // THINK
    if (cycle.llm_reasoning) {
      L.push('');
      L.push(`Mi análisis: _${cycle.llm_reasoning}_`);
    }

    // EXECUTE
    if (trades.length > 0) {
      L.push('');
      for (const t of trades) {
        L.push(`  BUY ${t.tokenSymbol} — $${t.amountUsd} — confianza ${(t.confidence * 100).toFixed(0)}%`);
      }
      L.push(`Total desplegado: $${cycle.total_usd_deployed.toFixed(2)}`);
      if (cycle.trades_blocked > 0) {
        L.push(`${cycle.trades_blocked} operación(es) bloqueada(s) por risk gate.`);
      }
    } else {
      L.push('');
      L.push('Sin operaciones esta vez — seguiré monitoreando.');
    }

    // ── POLYMARKET SECTION ──
    if (polymarketData.length > 0) {
      L.push('');
      L.push(`--- Polymarket Smart Money ---`);
      L.push(`${polymarketData.length} mercados con consenso de 2+ top traders:`);
      for (const m of polymarketData.slice(0, 3)) {
        const price = Math.round(m.currentPrice * 100);
        const entry = Math.round(m.avgEntryPrice * 100);
        const dir = m.edgePct > 0 ? '+' : '';
        L.push(`  • "${m.title}"`);
        L.push(`    ${m.traderCount} traders → ${m.topOutcome} (${m.topOutcomePct.toFixed(0)}%) | ${price}¢ (entrada ${entry}¢, edge ${dir}${m.edgePct.toFixed(1)}%)`);
      }
      const best = polymarketData[0];
      L.push('');
      L.push(`Recomendación: "${best.title}" → ${best.topOutcome} a ${Math.round(best.currentPrice * 100)}¢.`);
      L.push(`Si en ${hrs}h se confirma, potencial ${(1 / best.currentPrice).toFixed(2)}x.`);
    }

    L.push('');
    L.push(`Latencia: ${(cycle.latency_ms / 1000).toFixed(1)}s | Categorías: ${profile.categories.join(', ')}`);
    L.push(`Nos vemos en ${hrs} horas.`);

  } else if (lang === 'pt') {
    L.push(`--- OKX OnchainOS ---`);
    L.push(`Escaneei ${cycle.signals_found} sinais on-chain (ETH, SOL, Base).`);
    if (topFilteredSignals.length > 0) {
      L.push(`Top sinais detectados:`);
      for (const s of topFilteredSignals.slice(0, 3)) {
        L.push(`  • ${s.tokenSymbol} (${chainName(s.chain)}) — $${(s.amountUsd / 1000).toFixed(1)}K — ${s.reasons.join(', ')}`);
      }
    }

    L.push('');
    L.push(`${cycle.signals_found} → ${cycle.signals_filtered} passaram filtros de qualidade.`);

    if (cycle.llm_reasoning) {
      L.push('');
      L.push(`Minha análise: _${cycle.llm_reasoning}_`);
    }

    if (trades.length > 0) {
      L.push('');
      for (const t of trades) {
        L.push(`  BUY ${t.tokenSymbol} — $${t.amountUsd} — confiança ${(t.confidence * 100).toFixed(0)}%`);
      }
      L.push(`Total: $${cycle.total_usd_deployed.toFixed(2)}`);
    } else {
      L.push('');
      L.push('Sem operações desta vez — continuarei monitorando.');
    }

    if (polymarketData.length > 0) {
      L.push('');
      L.push(`--- Polymarket Smart Money ---`);
      L.push(`${polymarketData.length} mercados com consenso de 2+ top traders:`);
      for (const m of polymarketData.slice(0, 3)) {
        const price = Math.round(m.currentPrice * 100);
        const entry = Math.round(m.avgEntryPrice * 100);
        const dir = m.edgePct > 0 ? '+' : '';
        L.push(`  • "${m.title}"`);
        L.push(`    ${m.traderCount} traders → ${m.topOutcome} (${m.topOutcomePct.toFixed(0)}%) | ${price}¢ (entrada ${entry}¢, edge ${dir}${m.edgePct.toFixed(1)}%)`);
      }
      const best = polymarketData[0];
      L.push('');
      L.push(`Recomendação: "${best.title}" → ${best.topOutcome} a ${Math.round(best.currentPrice * 100)}¢.`);
      L.push(`Se em ${hrs}h a tendência confirmar, potencial ${(1 / best.currentPrice).toFixed(2)}x.`);
    }

    L.push('');
    L.push(`Latência: ${(cycle.latency_ms / 1000).toFixed(1)}s | Categorias: ${profile.categories.join(', ')}`);
    L.push(`Nos vemos em ${hrs} horas.`);

  } else {
    L.push(`--- OKX OnchainOS ---`);
    L.push(`Scanned ${cycle.signals_found} on-chain signals (ETH, SOL, Base).`);
    if (topFilteredSignals.length > 0) {
      L.push(`Top signals detected:`);
      for (const s of topFilteredSignals.slice(0, 3)) {
        L.push(`  • ${s.tokenSymbol} (${chainName(s.chain)}) — $${(s.amountUsd / 1000).toFixed(1)}K — ${s.reasons.join(', ')}`);
      }
    }

    L.push('');
    L.push(`${cycle.signals_found} → ${cycle.signals_filtered} passed quality filters.`);

    if (cycle.llm_reasoning) {
      L.push('');
      L.push(`My analysis: _${cycle.llm_reasoning}_`);
    }

    if (trades.length > 0) {
      L.push('');
      for (const t of trades) {
        L.push(`  BUY ${t.tokenSymbol} — $${t.amountUsd} — confidence ${(t.confidence * 100).toFixed(0)}%`);
      }
      L.push(`Total deployed: $${cycle.total_usd_deployed.toFixed(2)}`);
      if (cycle.trades_blocked > 0) {
        L.push(`${cycle.trades_blocked} trade(s) blocked by risk gate.`);
      }
    } else {
      L.push('');
      L.push('No trades this cycle — still watching.');
    }

    if (polymarketData.length > 0) {
      L.push('');
      L.push(`--- Polymarket Smart Money ---`);
      L.push(`${polymarketData.length} markets with 2+ top trader consensus:`);
      for (const m of polymarketData.slice(0, 3)) {
        const price = Math.round(m.currentPrice * 100);
        const entry = Math.round(m.avgEntryPrice * 100);
        const dir = m.edgePct > 0 ? '+' : '';
        L.push(`  • "${m.title}"`);
        L.push(`    ${m.traderCount} traders → ${m.topOutcome} (${m.topOutcomePct.toFixed(0)}%) | ${price}¢ (entry ${entry}¢, edge ${dir}${m.edgePct.toFixed(1)}%)`);
      }
      const best = polymarketData[0];
      L.push('');
      L.push(`Recommendation: "${best.title}" → ${best.topOutcome} at ${Math.round(best.currentPrice * 100)}¢.`);
      L.push(`If trend holds in ${hrs}h, potential ${(1 / best.currentPrice).toFixed(2)}x return.`);
    }

    L.push('');
    L.push(`Latency: ${(cycle.latency_ms / 1000).toFixed(1)}s | Categories: ${profile.categories.join(', ')}`);
    L.push(`See you in ${hrs} hours.`);
  }

  return L.join('\n');
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
    // Phase 0: Polymarket Intelligence (parallel with OKX)
    console.log('[Agent] Collecting signals + Polymarket intelligence...');
    const [raw, polyConsensus] = await Promise.all([
      collectDexSignals(),
      collectPolymarketIntelligence(),
    ]);
    console.log(`[Agent] ${raw.length} raw signals, ${polyConsensus.length} Polymarket consensus markets`);

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
        llm_reasoning: polyConsensus.length > 0
          ? `No OKX signals, but ${polyConsensus.length} Polymarket consensus markets detected.`
          : 'No actionable signals this cycle.',
        status: 'completed',
      };
      await logToSupabase(result);

      // Still generate greetings with Polymarket data even if no OKX signals
      const allProfiles0 = await fetchAdvisorProfiles();
      const profiles0 = isManual
        ? allProfiles0
        : allProfiles0.filter(p => new Date().getUTCHours() % (p.scan_interval_hours || 8) === 0);
      const greetings0 = profiles0.map(p => ({
        wallet_address: p.wallet_address,
        advisor_name: p.advisor_name,
        message: generateGreeting(p, {
          cycle: { ...result, trades_blocked: 0 },
          topFilteredSignals: [],
          trades: [],
          polymarketData: polyConsensus,
        }),
      }));
      await saveGreetings(greetings0);

      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json({
        ok: true,
        cycle: result,
        greetings: greetings0.map(g => ({ advisor: g.advisor_name, wallet: g.wallet_address.slice(0, 8) + '...' })),
        polymarket: polyConsensus.slice(0, 5).map(m => ({
          title: m.title,
          traders: m.traderCount,
          consensus: `${m.topOutcome} ${m.topOutcomePct.toFixed(0)}%`,
          price: `${Math.round(m.currentPrice * 100)}¢`,
          edge: `${m.edgePct.toFixed(1)}%`,
        })),
      });
    }

    // Phase 3: Claude analysis
    console.log('[Agent] Claude analyzing...');
    const { decisions, reasoning } = await analyzeWithClaude(filtered, polyConsensus);
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

    // Phase 7: Generate personalized greetings for advisors whose interval matches
    console.log('[Agent] Generating greetings...');
    const allProfiles = await fetchAdvisorProfiles();
    const currentHour = new Date().getUTCHours();

    // For manual triggers, send to all profiles. For cron, only send to profiles
    // whose scan_interval_hours divides evenly into the current hour.
    const profiles = isManual
      ? allProfiles
      : allProfiles.filter(p => {
          const interval = p.scan_interval_hours || 8;
          return currentHour % interval === 0;
        });

    const greetings = profiles.map(p => ({
      wallet_address: p.wallet_address,
      advisor_name: p.advisor_name,
      message: generateGreeting(p, {
        cycle: result,
        topFilteredSignals: filtered,
        trades: trades.map(t => ({ tokenSymbol: t.tokenSymbol, amountUsd: t.amountUsd, confidence: t.confidence, chain: t.chain })),
        polymarketData: polyConsensus,
      }),
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
      polymarket: polyConsensus.slice(0, 5).map(m => ({
        title: m.title,
        traders: m.traderCount,
        consensus: `${m.topOutcome} ${m.topOutcomePct.toFixed(0)}%`,
        price: `${Math.round(m.currentPrice * 100)}¢`,
        edge: `${m.edgePct.toFixed(1)}%`,
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
