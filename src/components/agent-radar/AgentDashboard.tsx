// ============================================================
// AgentDashboard — Live view of autonomous agent activity
// Shows: cycle history, trades, positions, performance
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Activity, TrendingUp, Shield, Clock, Zap, AlertCircle, CheckCircle, FlaskConical } from 'lucide-react';

interface AgentCycle {
  id: string;
  started_at: string;
  completed_at: string;
  signals_found: number;
  signals_filtered: number;
  llm_decisions: number;
  trades_executed: number;
  trades_blocked: number;
  total_usd_deployed: number;
  latency_ms: number;
  llm_reasoning: string;
  status: string;
  error: string | null;
}

interface AgentTrade {
  id: string;
  cycle_id: string;
  chain: string;
  token_symbol: string;
  direction: string;
  amount_usd: number;
  entry_price: number;
  tx_hash: string | null;
  status: string;
  llm_reasoning: string;
  confidence: number;
  signal_sources: string[];
  created_at: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function fetchSupabase<T>(path: string): Promise<T[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
      },
    });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'completed') return <CheckCircle className="w-3.5 h-3.5 text-green-400" />;
  if (status === 'failed') return <AlertCircle className="w-3.5 h-3.5 text-red-400" />;
  if (status === 'simulated') return <FlaskConical className="w-3.5 h-3.5 text-amber-400" />;
  return <Activity className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />;
}

export function AgentDashboard() {
  const [cycles, setCycles] = useState<AgentCycle[]>([]);
  const [trades, setTrades] = useState<AgentTrade[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCycle, setExpandedCycle] = useState<string | null>(null);
  const [triggerLoading, setTriggerLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    const [c, t] = await Promise.all([
      fetchSupabase<AgentCycle>('agent_cycles?order=started_at.desc&limit=10'),
      fetchSupabase<AgentTrade>('agent_trades?order=created_at.desc&limit=20'),
    ]);
    setCycles(c);
    setTrades(t);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const triggerManualRun = async () => {
    setTriggerLoading(true);
    try {
      const res = await fetch('/api/agent-run?manual=true');
      const data = await res.json();
      if (data.ok) {
        await loadData(); // Refresh
      }
    } catch (err) {
      console.error('Manual trigger failed:', err);
    }
    setTriggerLoading(false);
  };

  // Stats
  const totalTrades = trades.length;
  const totalDeployed = cycles.reduce((sum, c) => sum + (c.total_usd_deployed || 0), 0);
  const avgLatency = cycles.length > 0
    ? Math.round(cycles.reduce((sum, c) => sum + (c.latency_ms || 0), 0) / cycles.length)
    : 0;
  const lastCycle = cycles[0];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-green-500/10 flex items-center justify-center">
            <Bot className="w-4.5 h-4.5 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-neutral-200">Agent Radar Autonomous</h3>
            <p className="text-[10px] text-neutral-500">Runs every 8h · Simulation mode</p>
          </div>
        </div>
        <button
          onClick={triggerManualRun}
          disabled={triggerLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium bg-green-500/15 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/25 transition-colors disabled:opacity-40"
        >
          {triggerLoading ? (
            <>
              <Activity className="w-3 h-3 animate-spin" />
              Running...
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              Run Now
            </>
          )}
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-2">
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-neutral-100">{cycles.length}</div>
          <div className="text-[9px] text-neutral-500">Cycles</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-green-400">{totalTrades}</div>
          <div className="text-[9px] text-neutral-500">Trades</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-amber-400">${totalDeployed.toFixed(0)}</div>
          <div className="text-[9px] text-neutral-500">Deployed</div>
        </div>
        <div className="bg-neutral-900/60 border border-neutral-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-neutral-300">{(avgLatency / 1000).toFixed(1)}s</div>
          <div className="text-[9px] text-neutral-500">Avg Speed</div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-8 text-neutral-500 text-xs">
          <Activity className="w-4 h-4 animate-spin mr-2" />
          Loading agent history...
        </div>
      )}

      {/* No data */}
      {!loading && cycles.length === 0 && (
        <div className="text-center py-8 space-y-2">
          <Bot className="w-8 h-8 text-neutral-700 mx-auto" />
          <p className="text-sm text-neutral-500">No cycles yet</p>
          <p className="text-[10px] text-neutral-600">Click "Run Now" to trigger the first cycle, or wait for the next scheduled run.</p>
        </div>
      )}

      {/* Cycle list */}
      {!loading && cycles.length > 0 && (
        <div className="space-y-2">
          <div className="text-[10px] text-neutral-500 uppercase tracking-wider">Recent Cycles</div>

          {cycles.map(cycle => {
            const isExpanded = expandedCycle === cycle.id;
            const cycleTrades = trades.filter(t => t.cycle_id === cycle.id);

            return (
              <div key={cycle.id}>
                <button
                  onClick={() => setExpandedCycle(isExpanded ? null : cycle.id)}
                  className="w-full text-left bg-neutral-900/60 hover:bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-3 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <StatusIcon status={cycle.status} />
                      <span className="text-xs text-neutral-300">{timeAgo(cycle.started_at)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[10px]">
                      <span className="text-neutral-500">{cycle.signals_found} signals</span>
                      <span className="text-neutral-500">→ {cycle.signals_filtered} filtered</span>
                      {cycle.trades_executed > 0 && (
                        <span className="text-green-400 font-bold">{cycle.trades_executed} trades</span>
                      )}
                      {cycle.trades_blocked > 0 && (
                        <span className="text-red-400/60">{cycle.trades_blocked} blocked</span>
                      )}
                      <span className="text-neutral-600">{(cycle.latency_ms / 1000).toFixed(1)}s</span>
                    </div>
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-neutral-900/40 border border-t-0 border-neutral-800 rounded-b-xl p-3 space-y-3">
                        {/* Claude's reasoning */}
                        {cycle.llm_reasoning && (
                          <div className="bg-neutral-800/40 rounded-lg p-2.5">
                            <div className="text-[9px] text-cyan-400/60 uppercase tracking-wider mb-1">Claude's Analysis</div>
                            <p className="text-[11px] text-neutral-300 leading-relaxed">{cycle.llm_reasoning}</p>
                          </div>
                        )}

                        {/* Error */}
                        {cycle.error && (
                          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-2.5">
                            <div className="text-[10px] text-red-400">{cycle.error}</div>
                          </div>
                        )}

                        {/* Trades */}
                        {cycleTrades.length > 0 && (
                          <div>
                            <div className="text-[9px] text-neutral-500 uppercase tracking-wider mb-1.5">Trades</div>
                            <div className="space-y-1.5">
                              {cycleTrades.map(trade => (
                                <div
                                  key={trade.id}
                                  className="flex items-center justify-between bg-neutral-800/30 rounded-lg px-2.5 py-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <StatusIcon status={trade.status} />
                                    <span className="text-xs font-medium text-neutral-200">
                                      {trade.direction} {trade.token_symbol}
                                    </span>
                                    <span className="text-[9px] text-neutral-500">{trade.chain}</span>
                                  </div>
                                  <div className="flex items-center gap-2 text-[10px]">
                                    <span className="text-neutral-400">${trade.amount_usd}</span>
                                    <span className={`font-bold ${
                                      trade.confidence >= 0.8 ? 'text-green-400' : 'text-amber-400'
                                    }`}>
                                      {(trade.confidence * 100).toFixed(0)}%
                                    </span>
                                    {trade.tx_hash && (
                                      <span className="text-neutral-600 font-mono text-[8px]">
                                        {trade.tx_hash.startsWith('SIM') ? '🧪 SIM' : trade.tx_hash.slice(0, 8)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-2 text-[10px]">
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <Clock className="w-3 h-3" />
                            {new Date(cycle.started_at).toLocaleString()}
                          </div>
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <Shield className="w-3 h-3" />
                            ${cycle.total_usd_deployed?.toFixed(2) || '0'} deployed
                          </div>
                          <div className="flex items-center gap-1.5 text-neutral-500">
                            <TrendingUp className="w-3 h-3" />
                            {cycle.llm_decisions} LLM decisions
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-600">
        <Bot className="w-3 h-3" />
        <span>Powered by Claude + OKX OnchainOS + Polymarket Intelligence</span>
      </div>
    </div>
  );
}
