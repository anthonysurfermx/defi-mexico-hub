// ============================================================
// Bobby $100 Challenge Dashboard — Stitch "Kinetic Terminal"
// Public page showing Bobby's autonomous trading performance
// All data is REAL from /api/bobby-pnl + /api/bobby-intel
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Shield, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import { TradeHistory } from '@/components/adams/TradeHistory';

interface PnlData {
  summary: {
    startingCapital: number;
    currentEquity: number;
    totalReturn: number;
    totalTrades: number;
    wins: number;
    losses: number;
    winRate: number;
  };
  closedPositions: Array<{
    symbol: string;
    direction: string;
    entryPrice: number;
    exitPrice: number;
    realizedPnl: number;
    pnlPct: number;
    leverage: string;
    closeTime: string;
    result: string;
  }>;
  openPositions: Array<{
    symbol: string;
    direction: string;
    leverage: string;
    unrealizedPnl: number;
    unrealizedPnlPct: number;
  }>;
}

export default function BobbyChallengePage() {
  const [pnl, setPnl] = useState<PnlData | null>(null);
  const [loading, setLoading] = useState(true);
  const [nextScan, setNextScan] = useState('--:--:--');

  useEffect(() => {
    fetch('/api/bobby-pnl')
      .then(r => r.json())
      .then(d => { if (d.ok) setPnl(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // Countdown to next 4h scan
  useEffect(() => {
    const update = () => {
      const now = new Date();
      const hours = now.getUTCHours();
      const nextHour = Math.ceil(hours / 4) * 4;
      const next = new Date(now);
      next.setUTCHours(nextHour, 0, 0, 0);
      if (next <= now) next.setUTCHours(next.getUTCHours() + 4);
      const diff = next.getTime() - now.getTime();
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setNextScan(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, []);

  const s = pnl?.summary;

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      {/* Header */}
      <div className="border-b border-white/[0.04] px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/agentic-world/bobby" className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            <span className="text-[10px] font-mono tracking-[1px]">BACK_TO_TERMINAL</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono text-green-400/60 tracking-[2px]">CHALLENGE_ACTIVE</span>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <span className="text-[9px] font-mono text-green-400/40 tracking-[3px]">CHALLENGE_ACCEPTED · ACTIVE</span>
          <h1 className="text-4xl sm:text-6xl font-bold mt-2">
            BOBBY <span className="text-green-400">$100</span>
          </h1>
          <h2 className="text-3xl sm:text-5xl font-bold text-white/80">CHALLENGE</h2>
          <p className="text-white/30 text-xs font-mono mt-3 max-w-lg leading-relaxed">
            Watch Bobby autonomously trade with real $100 on OKX.
            Multi-agent debate before every decision. On-chain accountability.
          </p>
        </motion.div>

        {/* Next scan countdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex items-center gap-4 mb-8 p-3 border border-white/[0.04] bg-white/[0.01] rounded inline-flex">
          <Clock className="w-4 h-4 text-green-400/60" />
          <div>
            <span className="text-[8px] font-mono text-white/25 tracking-[2px] block">NEXT_NEURAL_RUN</span>
            <span className="text-xl font-bold font-mono text-green-400">{nextScan}</span>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <span className="text-[10px] font-mono text-white/20 animate-pulse">LOADING CHALLENGE DATA...</span>
          </div>
        ) : s ? (
          <>
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'ACC_BALANCE', value: `$${s.currentEquity.toFixed(2)}`, sub: `$${s.startingCapital} initial`, color: 'text-white' },
                { label: 'TOTAL_RETURN', value: `${s.totalReturn >= 0 ? '+' : ''}${s.totalReturn}%`, sub: 'since inception', color: s.totalReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'WIN_RATE', value: `${s.winRate.toFixed(1)}%`, sub: `${s.wins}W / ${s.losses}L`, color: s.winRate >= 50 ? 'text-green-400' : 'text-amber-400' },
                { label: 'TOTAL_TRADES', value: String(s.totalTrades), sub: 'executed', color: 'text-white' },
              ].map((stat, i) => (
                <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.05 }}
                  className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded">
                  <span className="text-[8px] font-mono text-white/25 tracking-[1px] block mb-1">{stat.label}</span>
                  <span className={`text-2xl font-bold font-mono ${stat.color}`}>{stat.value}</span>
                  <span className="text-[9px] font-mono text-white/20 block mt-1">{stat.sub}</span>
                </motion.div>
              ))}
            </div>

            {/* Equity curve — simple visual of trade PnL over time */}
            {pnl && pnl.closedPositions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded mb-8">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[9px] font-mono text-white/30 tracking-[2px]">EQUITY_CURVE</span>
                  <span className="text-[8px] font-mono text-white/20">{pnl.closedPositions.length} TRADES</span>
                </div>
                <div className="flex items-end gap-1 h-16">
                  {pnl.closedPositions.map((t, i) => {
                    const maxPnl = Math.max(...pnl.closedPositions.map(p => Math.abs(p.pnlPct)));
                    const h = Math.max(4, (Math.abs(t.pnlPct) / (maxPnl || 1)) * 60);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end">
                        <div
                          className={`w-full rounded-t ${t.result === 'WIN' ? 'bg-green-500/60' : 'bg-red-500/60'}`}
                          style={{ height: `${h}px` }}
                          title={`${t.symbol} ${t.direction} ${t.pnlPct >= 0 ? '+' : ''}${t.pnlPct.toFixed(1)}%`}
                        />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1 text-[7px] font-mono text-white/15">
                  <span>FIRST TRADE</span>
                  <span>LATEST</span>
                </div>
              </motion.div>
            )}

            {/* CTAs */}
            <div className="flex flex-wrap gap-3 mb-8">
              <Link to="/agentic-world/bobby"
                className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono tracking-wider hover:bg-green-500/20 transition-colors rounded">
                <Activity className="w-3 h-3" />
                OPEN TERMINAL ›
              </Link>
              <Link to="/agentic-world/forum"
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] text-white/40 text-[10px] font-mono tracking-wider hover:text-white/70 transition-colors rounded">
                VIEW DEBATES ›
              </Link>
              <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent('Bobby Agent Trader is running the $100 Challenge — autonomous AI trading with on-chain accountability. Watch live: https://defimexico.org/agentic-world/bobby/challenge #BobbyTrader #AI #Trading')}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/[0.06] text-white/40 text-[10px] font-mono tracking-wider hover:text-white/70 transition-colors rounded">
                SHARE ON X ›
              </a>
            </div>

            {/* Safety protocols */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded mb-8">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-3.5 h-3.5 text-green-400/60" />
                <span className="text-[9px] font-mono text-white/30 tracking-[2px]">SAFETY_PROTOCOLS</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'MAX_LEVERAGE', value: '5x', status: 'ACTIVE' },
                  { label: 'CIRCUIT_BREAKER', value: '-20%', status: 'ARMED' },
                  { label: 'MAX_POSITIONS', value: '2', status: 'ACTIVE' },
                  { label: 'STOP_LOSS', value: 'MANDATORY', status: 'ENFORCED' },
                ].map(p => (
                  <div key={p.label} className="flex items-center justify-between">
                    <div>
                      <span className="text-[7px] font-mono text-white/20 tracking-[1px] block">{p.label}</span>
                      <span className="text-xs font-mono text-white/70">{p.value}</span>
                    </div>
                    <span className="text-[7px] font-mono text-green-400/50 bg-green-500/10 px-1.5 py-0.5 rounded">{p.status}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Trade History */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <TradeHistory language="en" />
            </motion.div>

            {/* On-chain proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
              className="mt-8 p-4 border border-white/[0.04] bg-white/[0.01] rounded text-center">
              <span className="text-[8px] font-mono text-white/20 tracking-[2px] block mb-2">ON-CHAIN VERIFICATION</span>
              <p className="text-[10px] font-mono text-white/30 mb-3">
                Every trade is committed to X Layer before the outcome is known.
                Verify Bobby's track record on-chain.
              </p>
              <a href="https://www.oklink.com/xlayer/address/0xF841b428E6d743187D7BE2242eccC1078fdE2395"
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono tracking-wider hover:bg-green-500/20 transition-colors rounded">
                VIEW ON X LAYER ›
              </a>
            </motion.div>
          </>
        ) : (
          <div className="text-center py-20 text-white/20 text-sm font-mono">No challenge data available</div>
        )}
      </div>
    </div>
  );
}
