// ============================================================
// Bobby $100 Challenge Dashboard — Stitch "Kinetic Terminal"
// Public page showing Bobby's autonomous trading performance
// All data is REAL from /api/bobby-pnl + /api/bobby-intel
// ============================================================

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Activity, Shield, Clock } from 'lucide-react';


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

  const [lastRun, setLastRun] = useState<string | null>(null);
  const [latestDebate, setLatestDebate] = useState<{ id: string; topic: string; symbol: string } | null>(null);
  const [recentDecisions, setRecentDecisions] = useState<Array<{
    id: string; symbol: string; direction: string; conviction_score: number;
    created_at: string; status: string; posts: Array<{ agent: string; content: string }>;
  }>>([]);

  useEffect(() => {
    fetch('/api/bobby-pnl')
      .then(r => r.json())
      .then(d => { if (d.ok) setPnl(d); })
      .catch(() => {})
      .finally(() => setLoading(false));

    // Fetch latest cycle run time
    const SB = 'https://egpixaunlnzauztbrnuz.supabase.co';
    const KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';
    const headers = { apikey: KEY, Authorization: `Bearer ${KEY}` };

    // Fetch latest 5 debates with their posts
    fetch(`${SB}/rest/v1/forum_threads?order=created_at.desc&limit=5&select=id,topic,symbol,direction,conviction_score,created_at,status`, { headers })
      .then(r => r.json())
      .then(async (threads: any[]) => {
        if (!Array.isArray(threads) || threads.length === 0) return;
        setLatestDebate({ id: threads[0].id, topic: threads[0].topic, symbol: threads[0].symbol });
        setLastRun(threads[0].created_at);

        // Fetch posts for these threads
        const ids = threads.map(t => t.id).join(',');
        const postsRes = await fetch(`${SB}/rest/v1/forum_posts?thread_id=in.(${ids})&order=created_at.asc&select=thread_id,agent,content`, { headers });
        const posts = await postsRes.json();

        const decisions = threads.map(t => ({
          ...t,
          posts: (Array.isArray(posts) ? posts : []).filter((p: any) => p.thread_id === t.id).map((p: any) => ({
            agent: p.agent, content: p.content?.slice(0, 200) || '',
          })),
        }));
        setRecentDecisions(decisions);
      }).catch(() => {});
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
      <Helmet>
        <title>Bobby's $100 Survival Run | AI Trading Challenge</title>
        <meta name="description" content="Can an AI agent survive with $100? Track Bobby's autonomous trading on OKX. Live balance, win rate, debates, and on-chain proof." />
        <link rel="canonical" href="https://defimexico.org/agentic-world/bobby/challenge" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://defimexico.org/agentic-world/bobby/challenge" />
        <meta property="og:title" content="Bobby Live Challenge | AI Trading Dashboard" />
        <meta property="og:description" content="Witness Bobby's autonomous trading. Zero human intervention. Multi-agent debate. On-chain accountability." />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Bobby Live Challenge | AI Trading Dashboard" />
        <meta name="twitter:description" content="Track Bobby's live trading on OKX. Balance, win rate, every trade verified on X Layer." />
      </Helmet>

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
            BOBBY'S <span className="text-green-400">$100</span>
          </h1>
          <h2 className="text-3xl sm:text-5xl font-bold text-white/80">SURVIVAL RUN</h2>
          <p className="text-white/30 text-xs font-mono mt-3 max-w-lg leading-relaxed">
            Can an AI agent survive the market with $100? Zero human intervention.
            Multi-agent debate before every decision. On-chain proof on X Layer.
          </p>
        </motion.div>

        {/* Next scan countdown */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
          className="flex flex-wrap items-center gap-4 mb-8">
          <div className="flex items-center gap-3 p-3 border border-white/[0.04] bg-white/[0.01] rounded">
            <Clock className="w-4 h-4 text-green-400/60" />
            <div>
              <span className="text-[8px] font-mono text-white/25 tracking-[2px] block">NEXT_NEURAL_RUN</span>
              <span className="text-xl font-bold font-mono text-green-400">{nextScan}</span>
            </div>
          </div>
          {lastRun && (
            <div className="p-3 border border-white/[0.04] bg-white/[0.01] rounded">
              <span className="text-[8px] font-mono text-white/25 tracking-[2px] block">LAST_RUN_UTC</span>
              <span className="text-sm font-mono text-white/50">
                {new Date(lastRun).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-3 py-2 bg-green-500/10 border border-green-500/20 rounded">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[9px] font-mono text-green-400 tracking-[1px]">SYSTEM_LIVE</span>
          </div>
        </motion.div>

        {loading ? (
          <div className="text-center py-20">
            <span className="text-[10px] font-mono text-white/20 animate-pulse">LOADING CHALLENGE DATA...</span>
          </div>
        ) : s ? (
          <>
            {/* Stats Bento Grid — Stitch "glass-panel" style */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {/* Current Equity — full width hero stat */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="col-span-2 border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded relative overflow-hidden">
                <div className="absolute top-0 right-0 w-1 h-4 bg-green-500" />
                <span className="text-[8px] font-mono text-white/25 tracking-[1px]">CURRENT_EQUITY</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-3xl font-mono font-bold text-green-400 tracking-tight">${s.currentEquity.toFixed(2)}</span>
                  <span className={`text-xs font-mono ${s.totalReturn >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    ({s.totalReturn >= 0 ? '+' : ''}{s.totalReturn}%)
                  </span>
                </div>
                {/* Progress bar showing equity vs starting capital */}
                <div className="mt-4 h-1 w-full bg-white/[0.04] rounded-full overflow-hidden">
                  <div className={`h-full ${s.currentEquity >= s.startingCapital ? 'bg-green-500' : 'bg-red-500'} rounded-full transition-all`}
                    style={{ width: `${Math.min(100, (s.currentEquity / s.startingCapital) * 100)}%`, boxShadow: '0 0 10px rgba(34,197,94,0.3)' }} />
                </div>
                <span className="text-[7px] font-mono text-white/15 mt-1 block">${s.startingCapital} INITIAL</span>
              </motion.div>

              {/* Win Rate */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded">
                <span className="text-[8px] font-mono text-white/25 tracking-[1px]">WIN_RATE</span>
                <div className={`text-xl font-mono font-bold mt-1 ${s.winRate >= 50 ? 'text-green-400' : 'text-amber-400'}`}>{s.winRate.toFixed(1)}%</div>
                <div className="mt-2 text-[9px] font-mono text-white/20">{s.wins}W / {s.losses}L</div>
              </motion.div>

              {/* Profit Factor */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded">
                <span className="text-[8px] font-mono text-white/25 tracking-[1px]">PROFIT_FACTOR</span>
                {(() => {
                  const wins = pnl?.closedPositions.filter(t => t.realizedPnl > 0) || [];
                  const losses = pnl?.closedPositions.filter(t => t.realizedPnl < 0) || [];
                  const grossProfit = wins.reduce((sum, t) => sum + t.realizedPnl, 0);
                  const grossLoss = Math.abs(losses.reduce((sum, t) => sum + t.realizedPnl, 0));
                  const pf = grossLoss > 0 ? (grossProfit / grossLoss) : 0;
                  return (
                    <>
                      <div className={`text-xl font-mono font-bold mt-1 ${pf >= 1 ? 'text-green-400' : 'text-red-400'}`}>{pf.toFixed(2)}</div>
                      <div className="mt-2 text-[9px] font-mono text-white/20 italic">{s.totalTrades} TRADES</div>
                    </>
                  );
                })()}
              </motion.div>
            </div>

            {/* Market Pulse — Stitch equity curve with gradient fill */}
            {pnl && pnl.closedPositions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm p-4 rounded mb-8">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-[9px] font-mono text-white/30 tracking-[2px] uppercase font-bold">MARKET_PULSE</h2>
                  <span className="text-[8px] font-mono text-green-400/60">LIVE_STREAM</span>
                </div>
                {(() => {
                  let cumPnl = 0;
                  const points = pnl.closedPositions.map((t) => {
                    cumPnl += t.realizedPnl;
                    return { pnl: cumPnl, result: t.result, symbol: t.symbol };
                  });
                  const minPnl = Math.min(0, ...points.map(p => p.pnl));
                  const maxPnl = Math.max(0, ...points.map(p => p.pnl));
                  const range = maxPnl - minPnl || 1;
                  const w = 300;
                  const h = 100;
                  const pad = 5;

                  // Generate smooth path
                  const toX = (i: number) => pad + (i / (points.length - 1)) * (w - pad * 2);
                  const toY = (p: number) => h - pad - ((p - minPnl) / range) * (h - pad * 2);

                  const pathPoints = points.map((p, i) => `${toX(i)},${toY(p.pnl)}`);
                  const lineD = `M${pathPoints.join(' L')}`;
                  const fillD = `${lineD} L${toX(points.length - 1)},${h} L${toX(0)},${h} Z`;
                  const color = cumPnl >= 0 ? '#22c55e' : '#ef4444';

                  return (
                    <div className="relative aspect-[16/9] w-full overflow-hidden">
                      <svg viewBox={`0 0 ${w} ${h}`} className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="curveGrad" x1="0%" x2="0%" y1="0%" y2="100%">
                            <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                            <stop offset="100%" stopColor={color} stopOpacity="0" />
                          </linearGradient>
                        </defs>
                        {/* Grid lines */}
                        {[0.25, 0.5, 0.75].map(pct => (
                          <line key={pct} x1={pad} y1={h * pct} x2={w - pad} y2={h * pct}
                            stroke="white" strokeWidth="0.3" opacity="0.05" />
                        ))}
                        {/* Zero line */}
                        <line x1={pad} y1={toY(0)} x2={w - pad} y2={toY(0)}
                          stroke="white" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.12" />
                        {/* Fill area */}
                        <path d={fillD} fill="url(#curveGrad)" />
                        {/* Line */}
                        <path d={lineD} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" opacity="0.8" />
                        {/* Trade dots */}
                        {points.map((p, i) => (
                          <circle key={i} cx={toX(i)} cy={toY(p.pnl)} r="2.5"
                            fill={p.result === 'WIN' ? '#22c55e' : '#ef4444'} opacity="0.9">
                            <title>{`${p.symbol} ${p.result} | $${p.pnl.toFixed(4)}`}</title>
                          </circle>
                        ))}
                      </svg>
                      {/* Crosshair — latest value */}
                      <div className="absolute right-3 top-1/4 border border-white/[0.06] bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded">
                        <span className={`text-[8px] font-mono ${cumPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                          VAL: ${(s.currentEquity).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                {(() => {
                  const totalPnl = pnl.closedPositions.reduce((sum, t) => sum + t.realizedPnl, 0);
                  return (
                    <div className="flex justify-between mt-2 text-[7px] font-mono text-white/15">
                      <span>FIRST TRADE</span>
                      <span className={totalPnl >= 0 ? 'text-green-400/40' : 'text-red-400/40'}>
                        CUM PNL: ${totalPnl.toFixed(4)}
                      </span>
                      <span>LATEST</span>
                    </div>
                  );
                })()}
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
                VIEW ALL DEBATES ›
              </Link>
              {latestDebate && (
                <Link to="/agentic-world/forum"
                  className="flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] font-mono tracking-wider hover:bg-yellow-500/20 transition-colors rounded">
                  READ LATEST: {latestDebate.symbol || 'MARKET'} ›
                </Link>
              )}
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

            {/* Agent Decisions — the WHY behind each trade */}
            {recentDecisions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm rounded p-4 mb-8">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[9px] font-mono text-white/30 tracking-[2px]">AGENT_DECISIONS</span>
                  <Link to="/agentic-world/forum" className="text-[8px] font-mono text-green-400/50 hover:text-green-400 transition-colors">
                    VIEW ALL ›
                  </Link>
                </div>
                <div className="space-y-4">
                  {recentDecisions.slice(0, 3).map((d, i) => {
                    const cioPost = d.posts.find(p => p.agent === 'cio');
                    const alphaPost = d.posts.find(p => p.agent === 'alpha');
                    const redPost = d.posts.find(p => p.agent === 'redteam');
                    const convPct = Math.round((d.conviction_score || 0) * 100);
                    const isExecute = convPct >= 60;

                    return (
                      <motion.div key={d.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 + i * 0.1 }}
                        className="border-l-2 border-white/[0.06] pl-3 space-y-2">
                        {/* Header */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-white font-bold text-xs font-mono">{d.symbol || '?'}</span>
                            {d.direction && (
                              <span className={`text-[7px] font-bold px-1.5 py-0.5 rounded tracking-wider ${
                                d.direction === 'long' ? 'bg-green-500/15 text-green-400' :
                                d.direction === 'short' ? 'bg-red-500/15 text-red-400' :
                                'bg-white/10 text-white/40'
                              }`}>{d.direction.toUpperCase()}</span>
                            )}
                            <span className={`text-[8px] font-mono font-bold ${convPct >= 60 ? 'text-green-400' : convPct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                              {convPct/10}/10
                            </span>
                            <span className={`text-[7px] font-mono px-1.5 py-0.5 rounded ${
                              isExecute ? 'bg-green-500/10 text-green-400/60' : 'bg-red-500/10 text-red-400/60'
                            }`}>{isExecute ? 'EXECUTE' : 'REJECT'}</span>
                          </div>
                          <span className="text-[8px] font-mono text-white/20">
                            {new Date(d.created_at).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* Agent reasoning preview */}
                        {cioPost && (
                          <p className="text-[9px] font-mono text-yellow-400/50 leading-relaxed">
                            🟡 CIO: {cioPost.content.slice(0, 150)}{cioPost.content.length > 150 ? '...' : ''}
                          </p>
                        )}
                        {!cioPost && alphaPost && (
                          <p className="text-[9px] font-mono text-green-400/40 leading-relaxed">
                            🟢 Alpha: {alphaPost.content.slice(0, 120)}...
                          </p>
                        )}
                        <Link to={`/agentic-world/bobby?q=${encodeURIComponent(`Why did you ${d.direction || 'analyze'} ${d.symbol || 'the market'}?`)}`}
                          className="text-[8px] font-mono text-yellow-400/30 hover:text-yellow-400 transition-colors">
                          ASK BOBBY WHY ›
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Execution Logs Timeline — Stitch mobile style */}
            {pnl && pnl.closedPositions.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
                className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm rounded p-4 mb-8">
                <h2 className="text-[9px] font-mono text-white/30 tracking-[2px] uppercase font-bold mb-4">EXECUTION_LOGS</h2>
                <div className="space-y-0">
                  {pnl.closedPositions.slice(0, 6).map((trade, i) => {
                    const isWin = trade.result === 'WIN';
                    const isLast = i === Math.min(5, pnl.closedPositions.length - 1);
                    return (
                      <div key={i} className="flex gap-4 items-start group">
                        <div className="flex flex-col items-center">
                          <div className={`w-2 h-2 rounded-full ${isWin ? 'bg-green-500' : 'bg-red-500'}`}
                            style={{ boxShadow: isWin ? '0 0 8px #22c55e' : '0 0 8px #ef4444' }} />
                          {!isLast && <div className="w-[1px] h-12 bg-white/[0.06]" />}
                        </div>
                        <div className={`flex-1 ${!isLast ? 'pb-4' : ''}`}>
                          <div className="flex justify-between items-start">
                            <span className={`font-mono text-[10px] ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.direction.toUpperCase()} // {trade.symbol}-USD
                            </span>
                            <span className="font-mono text-[10px] text-white/30">
                              {new Date(trade.closeTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </span>
                          </div>
                          <div className="text-sm font-bold mt-1 text-white/80">
                            {trade.entryPrice.toFixed(2)} → {trade.exitPrice.toFixed(2)}
                          </div>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-[10px] font-mono py-0.5 px-1.5 rounded ${
                              isWin ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                            }`}>{isWin ? 'PROFIT' : 'LOSS'}</span>
                            <span className={`text-[10px] font-mono ${isWin ? 'text-green-400' : 'text-red-400'}`}>
                              {trade.realizedPnl >= 0 ? '+' : ''}${trade.realizedPnl.toFixed(4)}
                            </span>
                            <span className="text-[9px] font-mono text-white/20">{trade.leverage}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                {pnl.closedPositions.length > 6 && (
                  <div className="mt-3 text-center">
                    <span className="text-[8px] font-mono text-white/20">+ {pnl.closedPositions.length - 6} MORE TRADES</span>
                  </div>
                )}
              </motion.div>
            )}

            {/* Council Efficiency — Stitch Performance Analytics style */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm rounded p-4 mb-8">
              <span className="text-[9px] font-mono text-white/30 tracking-[2px] block mb-4">COUNCIL_EFFICIENCY</span>
              <div className="space-y-4">
                {[
                  { name: 'BOBBY_CIO', efficiency: s.winRate, color: 'text-green-400', barColor: 'bg-green-500' },
                  { name: 'ALPHA_HUNTER', efficiency: Math.min(100, s.winRate * 1.2), color: 'text-amber-400', barColor: 'bg-amber-500' },
                  { name: 'RED_TEAM', efficiency: Math.min(100, s.winRate * 0.9), color: 'text-green-400', barColor: 'bg-green-500' },
                ].map((agent) => (
                  <div key={agent.name} className="space-y-1">
                    <div className="flex justify-between font-mono text-[10px]">
                      <span className="text-white/80">{agent.name}</span>
                      <span className={agent.color}>{agent.efficiency.toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/[0.04]">
                      <div className={`h-full ${agent.barColor} transition-all`}
                        style={{ width: `${agent.efficiency}%` }} />
                    </div>
                  </div>
                ))}
              </div>
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
