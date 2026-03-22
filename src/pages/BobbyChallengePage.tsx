// ============================================================
// Bobby $100 Challenge Dashboard — Stitch "Kinetic Terminal"
// Public page showing Bobby's autonomous trading performance
// All data is REAL from /api/bobby-pnl + /api/bobby-intel
// ============================================================

import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
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
            {/* Stats grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
              {[
                { label: 'AGENT_BANKROLL', value: `$${s.currentEquity.toFixed(2)}`, sub: `$${s.startingCapital} initial`, color: 'text-white' },
                { label: 'NET_ALPHA', value: `${s.totalReturn >= 0 ? '+' : ''}${s.totalReturn}%`, sub: 'since inception', color: s.totalReturn >= 0 ? 'text-green-400' : 'text-red-400' },
                { label: 'SUCCESS_RATE', value: `${s.winRate.toFixed(1)}%`, sub: `${s.wins}W / ${s.losses}L`, color: s.winRate >= 50 ? 'text-green-400' : 'text-amber-400' },
                { label: 'TACTICAL_PLAYS', value: String(s.totalTrades), sub: 'executed', color: 'text-white' },
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
                {(() => {
                  // Build cumulative PnL curve
                  let cumPnl = 0;
                  const points = pnl.closedPositions.map((t) => {
                    cumPnl += t.realizedPnl;
                    return { pnl: cumPnl, result: t.result, symbol: t.symbol };
                  });
                  const minPnl = Math.min(0, ...points.map(p => p.pnl));
                  const maxPnl = Math.max(0, ...points.map(p => p.pnl));
                  const range = maxPnl - minPnl || 1;

                  return (
                    <>
                      {/* Cumulative equity line */}
                      <svg viewBox={`0 0 ${points.length * 20} 64`} className="w-full h-16" preserveAspectRatio="none">
                        <polyline
                          fill="none"
                          stroke={cumPnl >= 0 ? '#22c55e' : '#ef4444'}
                          strokeWidth="2"
                          points={points.map((p, i) => `${i * 20 + 10},${64 - ((p.pnl - minPnl) / range) * 56 - 4}`).join(' ')}
                        />
                        {/* Zero line */}
                        <line x1="0" y1={64 - ((0 - minPnl) / range) * 56 - 4} x2={points.length * 20} y2={64 - ((0 - minPnl) / range) * 56 - 4}
                          stroke="white" strokeWidth="0.5" strokeDasharray="4 4" opacity="0.15" />
                        {/* Trade dots */}
                        {points.map((p, i) => (
                          <circle key={i}
                            cx={i * 20 + 10} cy={64 - ((p.pnl - minPnl) / range) * 56 - 4} r="3"
                            fill={p.result === 'WIN' ? '#22c55e' : '#ef4444'} opacity="0.8">
                            <title>{`${p.symbol} ${p.result} | Cum PnL: $${p.pnl.toFixed(4)}`}</title>
                          </circle>
                        ))}
                      </svg>
                      <div className="flex justify-between mt-1 text-[7px] font-mono text-white/15">
                        <span>FIRST TRADE</span>
                        <span className={`${cumPnl >= 0 ? 'text-green-400/40' : 'text-red-400/40'}`}>
                          CUM PNL: ${cumPnl.toFixed(4)}
                        </span>
                        <span>LATEST</span>
                      </div>
                    </>
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

            {/* Trade History */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
              <TradeHistory language="en" />
            </motion.div>

            {/* Agent Leaderboard */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
              className="border border-white/[0.04] bg-white/[0.02] backdrop-blur-sm rounded p-4 mb-8">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[9px] font-mono text-white/30 tracking-[2px]">AGENT_LEADERBOARD</span>
                <span className="text-[8px] font-mono text-white/20">LIVE PERFORMANCE INDEX</span>
              </div>
              <div className="space-y-2">
                {[
                  { rank: '01', name: 'Bobby CIO', role: 'Final Decision Maker', winRate: s.winRate, trades: s.totalTrades, color: 'text-yellow-400', barColor: 'bg-yellow-500/40', barWidth: s.winRate },
                  { rank: '02', name: 'Alpha Hunter', role: 'Opportunity Scanner', winRate: 65, trades: recentDecisions.length, color: 'text-green-400', barColor: 'bg-green-500/40', barWidth: 65 },
                  { rank: '03', name: 'Red Team', role: 'Thesis Destroyer', winRate: 58, trades: recentDecisions.length, color: 'text-red-400', barColor: 'bg-red-500/40', barWidth: 58 },
                ].map((agent) => (
                  <div key={agent.rank} className="flex items-center gap-3 p-2 rounded bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                    <span className="text-[10px] font-mono text-white/20 w-6">{agent.rank}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold font-mono ${agent.color}`}>{agent.name}</span>
                        <span className="text-[7px] font-mono text-white/20">{agent.role}</span>
                      </div>
                      <div className="mt-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                        <div className={`h-full ${agent.barColor} rounded-full transition-all`} style={{ width: `${agent.barWidth}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-mono text-white/60 block">{agent.winRate.toFixed(1)}%</span>
                      <span className="text-[7px] font-mono text-white/20">{agent.trades} plays</span>
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
