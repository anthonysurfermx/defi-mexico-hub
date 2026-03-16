// ============================================================
// GET /api/bobby-intel — Fast intelligence endpoint for Bobby's brain
// Returns: OKX whale signals + Polymarket smart money + conviction + mood
// Designed for real-time conversational context (~10-15s vs 2min full cycle)
// ============================================================

import type { VercelRequest, VercelResponse } from '@vercel/node';

export const config = { maxDuration: 30 };

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
  timestamp?: number;
}

interface FilteredSignal extends RawSignal {
  filterScore: number;
  reasons: string[];
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

interface CycleRecord {
  status: string;
  trades_executed: number;
  trades_successful?: number;
  total_usd_deployed?: number;
  llm_reasoning?: string;
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

// ---- OKX OnchainOS Whale Signals ----
async function collectDexSignals(): Promise<RawSignal[]> {
  const apiKey = process.env.OKX_API_KEY;
  const secretKey = process.env.OKX_SECRET_KEY;
  const passphrase = process.env.OKX_PASSPHRASE;
  const projectId = process.env.OKX_PROJECT_ID;
  if (!apiKey || !secretKey || !passphrase || !projectId) return [];

  const chains = ['1', '501', '8453']; // ETH, SOL, Base
  const signals: RawSignal[] = [];
  const now = Date.now();

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
          timestamp: now,
        });
      }
    } catch (err) {
      console.error(`[Bobby Intel] Chain ${chainIndex} signal error:`, err);
    }
  }

  return signals;
}

// ---- Filter Signals ----
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

// ---- Dynamic Conviction Score ----
function calculateDynamicConviction(
  okxScore: number,
  polyConsensus: number,
  latencyMs: number
): number {
  const minutes = latencyMs / 60000;
  const latencyPenalty = minutes <= 5 ? 0 : Math.min(0.5, 0.02 * Math.exp(0.04 * minutes));
  const raw = (okxScore * 0.4) + (polyConsensus * 0.6) - latencyPenalty;
  return Math.max(0, Math.min(1, raw));
}

// ---- Polymarket Intelligence ----
const POLY_DATA = 'https://data-api.polymarket.com';

async function fetchPolyLeaderboard(limit = 15): Promise<Array<{ proxyWallet: string; userName: string; rank: number; pnl: number; volume: number }>> {
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
  traders: Array<{ proxyWallet: string }>,
  positionsByWallet: Map<string, PolyPosition[]>
): SmartMoneyConsensus[] {
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

  const results: SmartMoneyConsensus[] = [];
  for (const [conditionId, m] of marketMap) {
    if (m.traders.size < 2) continue;
    let topOutcome = '';
    let topCapital = 0;
    for (const [outcome, capital] of m.outcomeCapital) {
      if (capital > topCapital) { topOutcome = outcome; topCapital = capital; }
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
  const traders = await fetchPolyLeaderboard(15);
  if (traders.length === 0) return [];

  const positionsByWallet = new Map<string, PolyPosition[]>();

  // Batch fetch: 5 at a time to avoid rate limits
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

  return aggregatePolyConsensus(traders, positionsByWallet);
}

// ---- Supabase: Recent Cycles (performance history) ----
async function fetchRecentCycles(limit = 5): Promise<CycleRecord[]> {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return [];

  try {
    const res = await fetch(
      `${url}/rest/v1/agent_cycles?select=status,trades_executed,trades_successful,total_usd_deployed,llm_reasoning&order=started_at.desc&limit=${limit}`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } },
    );
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch { return []; }
}

function calculateWinRate(cycles: CycleRecord[]): number {
  if (cycles.length === 0) return 1;
  const completed = cycles.filter(c => c.status === 'completed');
  if (completed.length === 0) return 1;
  const withTrades = completed.filter(c => c.trades_executed > 0);
  if (withTrades.length === 0) return 0.5;

  const hasSuccessData = withTrades.some(c => typeof c.trades_successful === 'number');
  if (hasSuccessData) {
    const totalExecuted = withTrades.reduce((sum, c) => sum + c.trades_executed, 0);
    const totalSuccessful = withTrades.reduce((sum, c) => sum + (c.trades_successful || 0), 0);
    return totalExecuted > 0 ? totalSuccessful / totalExecuted : 0.5;
  }
  return withTrades.length / completed.length;
}

function getAgentMood(winRate: number): 'confident' | 'cautious' | 'defensive' {
  if (winRate >= 0.7) return 'confident';
  if (winRate >= 0.5) return 'cautious';
  return 'defensive';
}

// ---- OKX CEX Prices (spot + commodities) ----
async function fetchLivePrices(): Promise<Array<{ symbol: string; price: number; change24h: number }>> {
  const instruments = ['BTC-USDT', 'ETH-USDT', 'SOL-USDT', 'OKB-USDT', 'XAUT-USDT', 'PAXG-USDT'];
  try {
    const res = await fetch('https://www.okx.com/api/v5/market/tickers?instType=SPOT');
    if (!res.ok) return [];
    const json = await res.json() as { code: string; data: Array<{ instId: string; last: string; open24h: string }> };
    if (json.code !== '0') return [];

    const tickerMap = new Map(json.data.map(t => [t.instId, t]));
    const prices = instruments.map(inst => {
      const t = tickerMap.get(inst);
      if (!t) return null;
      const last = parseFloat(t.last);
      const open = parseFloat(t.open24h);
      return {
        symbol: inst.split('-')[0],
        price: last,
        change24h: open > 0 ? parseFloat((((last - open) / open) * 100).toFixed(2)) : 0,
      };
    }).filter(Boolean) as Array<{ symbol: string; price: number; change24h: number }>;

    // Also fetch silver (SWAP only)
    try {
      const swapRes = await fetch('https://www.okx.com/api/v5/market/ticker?instId=XAG-USDT-SWAP');
      const swapJson = await swapRes.json() as { code: string; data: Array<{ last: string; open24h: string }> };
      if (swapJson.code === '0' && swapJson.data?.[0]) {
        const s = swapJson.data[0];
        const last = parseFloat(s.last);
        const open = parseFloat(s.open24h);
        prices.push({
          symbol: 'XAG',
          price: last,
          change24h: open > 0 ? parseFloat((((last - open) / open) * 100).toFixed(2)) : 0,
        });
      }
    } catch { /* non-critical */ }

    return prices;
  } catch { return []; }
}

// ============================================================
// HANDLER — Runs all intelligence pipelines in parallel
// ============================================================
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const startMs = Date.now();

  try {
    // Run all intelligence sources in parallel
    const [rawSignals, polyConsensus, recentCycles, livePrices] = await Promise.all([
      collectDexSignals(),
      collectPolymarketIntelligence(),
      fetchRecentCycles(5),
      fetchLivePrices(),
    ]);

    const filtered = filterSignals(rawSignals);
    const signalAgeMs = 0; // Fresh signals, just collected
    const winRate = calculateWinRate(recentCycles);
    const mood = getAgentMood(winRate);
    const isSafeMode = winRate < 0.7;

    // Compute conviction for top signals
    const bestPolyEdge = polyConsensus.length > 0
      ? Math.min(1, Math.max(0, polyConsensus[0].edgePct / 100))
      : 0;

    const signalsWithConviction = filtered.map(s => {
      const okxNorm = s.filterScore / 100;
      const conviction = calculateDynamicConviction(okxNorm, bestPolyEdge, signalAgeMs);
      return {
        symbol: s.tokenSymbol,
        chain: s.chain === '1' ? 'ETH' : s.chain === '501' ? 'SOL' : s.chain === '8453' ? 'Base' : s.chain,
        amountUsd: s.amountUsd,
        filterScore: s.filterScore,
        conviction: parseFloat(conviction.toFixed(3)),
        reasons: s.reasons,
        walletType: s.signalType === '1' ? 'Smart Money' : s.signalType === '3' ? 'Whale' : s.signalType === '2' ? 'KOL' : 'Unknown',
      };
    });

    // Format Polymarket consensus for Bobby's brain
    const polyFormatted = polyConsensus.map(m => ({
      title: m.title,
      traderCount: m.traderCount,
      topOutcome: m.topOutcome,
      topOutcomePct: parseFloat(m.topOutcomePct.toFixed(1)),
      currentPrice: parseFloat((m.currentPrice * 100).toFixed(1)), // in cents
      entryPrice: parseFloat((m.avgEntryPrice * 100).toFixed(1)),  // in cents
      edgePct: parseFloat(m.edgePct.toFixed(1)),
      totalCapital: parseFloat(m.totalCapital.toFixed(2)),
    }));

    // Performance context
    const performance = {
      winRate: parseFloat((winRate * 100).toFixed(0)),
      mood,
      isSafeMode,
      recentCycles: recentCycles.slice(0, 3).map(c => ({
        status: c.status,
        trades: c.trades_executed,
        successful: c.trades_successful || 0,
        deployed: c.total_usd_deployed || 0,
      })),
    };

    const latencyMs = Date.now() - startMs;

    // Build the intelligence briefing text for Bobby's brain
    const briefing = buildBriefing(signalsWithConviction, polyFormatted, livePrices, performance, latencyMs);

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    return res.status(200).json({
      ok: true,
      briefing,           // Pre-formatted text block for injection into LLM context
      signals: signalsWithConviction,
      polymarket: polyFormatted,
      prices: livePrices,
      performance,
      meta: {
        signalsRaw: rawSignals.length,
        signalsFiltered: filtered.length,
        polymarketsTracked: polyConsensus.length,
        latencyMs,
        ts: Date.now(),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'Unknown error';
    console.error('[Bobby Intel] Error:', msg);
    return res.status(500).json({ error: msg });
  }
}

// ---- Build pre-formatted intelligence briefing ----
function buildBriefing(
  signals: Array<{ symbol: string; chain: string; amountUsd: number; filterScore: number; conviction: number; reasons: string[]; walletType: string }>,
  polymarket: Array<{ title: string; traderCount: number; topOutcome: string; topOutcomePct: number; currentPrice: number; entryPrice: number; edgePct: number }>,
  prices: Array<{ symbol: string; price: number; change24h: number }>,
  performance: { winRate: number; mood: string; isSafeMode: boolean },
  latencyMs: number,
): string {
  const lines: string[] = [];

  // Live prices
  lines.push('[LIVE MARKET DATA]');
  for (const p of prices) {
    const dir = p.change24h >= 0 ? '+' : '';
    lines.push(`${p.symbol}: $${p.price.toLocaleString()} (${dir}${p.change24h}% 24h)`);
  }

  // OKX whale signals
  lines.push('');
  lines.push(`[OKX OnchainOS WHALE SIGNALS — ${signals.length} filtered from on-chain scan]`);
  if (signals.length === 0) {
    lines.push('No significant whale movements detected right now.');
  } else {
    for (const s of signals.slice(0, 5)) {
      lines.push(`• ${s.symbol} (${s.chain}) — $${(s.amountUsd / 1000).toFixed(1)}K — ${s.walletType} — conviction: ${(s.conviction * 100).toFixed(0)}% — ${s.reasons.join(', ')}`);
    }
  }

  // Polymarket smart money
  lines.push('');
  lines.push(`[POLYMARKET SMART MONEY CONSENSUS — ${polymarket.length} markets with 2+ top traders]`);
  if (polymarket.length === 0) {
    lines.push('No strong smart money consensus detected.');
  } else {
    for (const m of polymarket.slice(0, 5)) {
      const dir = m.edgePct >= 0 ? '+' : '';
      lines.push(`• "${m.title}" — ${m.traderCount} traders → ${m.topOutcome} (${m.topOutcomePct}%) — price: ${m.currentPrice}¢ (entry: ${m.entryPrice}¢, edge: ${dir}${m.edgePct}%)`);
    }
  }

  // Performance / metacognition
  lines.push('');
  lines.push(`[AGENT METACOGNITION]`);
  lines.push(`Win rate: ${performance.winRate}% | Mood: ${performance.mood} | Safe Mode: ${performance.isSafeMode ? 'ACTIVE — reduce position sizes, increase conviction threshold' : 'OFF'}`);
  lines.push(`Intelligence latency: ${(latencyMs / 1000).toFixed(1)}s`);

  return lines.join('\n');
}
