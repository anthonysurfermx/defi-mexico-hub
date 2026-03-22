// ============================================================
// Agent Trading Forum — Stitch Bloomberg-style design
// Multi-agent debates with glass-card feed, agent avatars,
// confidence bars, expandable threads with TradingView charts
// All data REAL from Supabase forum_threads + forum_posts
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { RefreshCw, MessageSquare, ChevronDown, ChevronUp, Zap, TrendingUp, Clock, Flame, Share2, Filter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { TradingViewChart } from '@/components/charts/TradingViewChart';
import KineticShell from '@/components/kinetic/KineticShell';

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

interface ForumPost {
  id: string;
  thread_id: string;
  agent: 'alpha' | 'redteam' | 'cio';
  content: string;
  upvotes: number;
  created_at: string;
}

interface ForumThread {
  id: string;
  topic: string;
  trigger_reason: string;
  status: string;
  language: string;
  conviction_score: number | null;
  price_at_creation: Record<string, number>;
  created_at: string;
  posts?: ForumPost[];
  symbol?: string;
  direction?: string;
  entry_price?: number;
  stop_price?: number;
  target_price?: number;
  resolution?: string;
  resolution_price?: number;
  resolution_pnl_pct?: number;
  resolved_at?: string;
  scope?: string;
  owner_wallet?: string;
  agent_profile_id?: string;
}

const AGENTS: Record<string, { name: string; badge: string; color: string; borderColor: string; bgTint: string }> = {
  alpha:   { name: 'ALPHA HUNTER', badge: 'bg-green-500/15 text-green-400', color: '#22c55e', borderColor: 'border-green-500', bgTint: 'bg-green-500/[0.03]' },
  redteam: { name: 'RED TEAM',     badge: 'bg-red-500/15 text-red-400',     color: '#ef4444', borderColor: 'border-red-500',   bgTint: 'bg-red-500/[0.03]' },
  cio:     { name: 'BOBBY CIO',    badge: 'bg-yellow-500/15 text-yellow-400', color: '#f59e0b', borderColor: 'border-yellow-500', bgTint: 'bg-yellow-500/[0.03]' },
};

const FILTERS = [
  { id: 'all', label: 'ALL' },
  { id: 'btc', label: 'BTC' },
  { id: 'eth', label: 'ETH' },
  { id: 'sol', label: 'SOL' },
];

const SORTS = [
  { id: 'new', label: 'NEWEST', Icon: Clock },
  { id: 'hot', label: 'HOT', Icon: Flame },
  { id: 'conviction', label: 'CONVICTION', Icon: TrendingUp },
];

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function detectSymbol(topic: string): string {
  const t = topic.toLowerCase();
  if (/\bbtc\b|bitcoin/i.test(t)) return 'btc';
  if (/\beth\b|ethereum/i.test(t)) return 'eth';
  if (/\bsol\b|solana/i.test(t)) return 'sol';
  return 'all';
}

// Bloomberg-style Thread Card
function ThreadCard({ thread, expanded, onToggle }: { thread: ForumThread; expanded: boolean; onToggle: () => void }) {
  const conviction = thread.conviction_score;
  const convPct = conviction !== null ? Math.round(conviction * 100) : 0;
  const alphaPost = thread.posts?.find(p => p.agent === 'alpha');
  const cioPost = thread.posts?.find(p => p.agent === 'cio');

  const statusBadge = thread.resolution === 'win'
    ? { text: `WIN +${thread.resolution_pnl_pct}%`, cls: 'bg-green-500/15 text-green-400' }
    : thread.resolution === 'loss'
    ? { text: `LOSS ${thread.resolution_pnl_pct}%`, cls: 'bg-red-500/15 text-red-400' }
    : thread.status === 'active'
    ? { text: 'LIVE', cls: 'bg-green-500/10 text-green-400' }
    : { text: thread.status?.toUpperCase() || 'PENDING', cls: 'bg-white/5 text-white/30' };

  return (
    <motion.article layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`bg-white/[0.02] backdrop-blur-sm border rounded overflow-hidden transition-all ${
        expanded ? 'border-green-500/20' : 'border-white/[0.04] hover:border-white/[0.08]'
      } ${thread.resolution === 'win' ? 'border-l-2 border-l-green-500' : thread.resolution === 'loss' ? 'border-l-2 border-l-red-500' : ''}`}>

      {/* Compact card header */}
      <div className="cursor-pointer p-4 flex items-start gap-4" onClick={onToggle}>
        {/* Conviction score */}
        <div className="flex flex-col items-center flex-shrink-0 w-12">
          <span className={`text-2xl font-mono font-black ${
            convPct >= 70 ? 'text-green-400' : convPct >= 40 ? 'text-amber-400' : 'text-red-400'
          }`}>{conviction !== null ? Math.round(conviction * 10) : '?'}</span>
          <span className="text-[7px] font-mono text-white/20">/10</span>
          {/* Confidence bars */}
          <div className="flex gap-[2px] mt-1.5">
            {Array.from({ length: 7 }, (_, i) => (
              <div key={i} className={`w-1.5 h-3 ${i < Math.round(convPct / 14) ? (convPct >= 70 ? 'bg-green-500' : convPct >= 40 ? 'bg-amber-500' : 'bg-red-500') : 'bg-white/[0.04]'}`} />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded tracking-wider ${statusBadge.cls}`}>{statusBadge.text}</span>
            {thread.direction && thread.symbol && (
              <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded ${
                thread.direction === 'long' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}>{thread.direction === 'long' ? '↑' : '↓'} {thread.symbol}</span>
            )}
            <span className="text-[8px] font-mono text-white/15 ml-auto">{timeAgo(thread.created_at)}</span>
          </div>

          <h3 className="text-sm font-bold text-white/80 leading-snug mb-1.5">{thread.topic}</h3>

          {/* Agent preview — collapsed */}
          {!expanded && cioPost && (
            <p className="text-[10px] font-mono text-white/25 truncate leading-relaxed">
              CIO: {cioPost.content.slice(0, 120)}...
            </p>
          )}
        </div>

        <div className="text-white/15 flex-shrink-0 mt-1">
          {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </div>

      {/* Expanded debate — Stitch "Expanded Agent Debate" design */}
      <AnimatePresence>
        {expanded && thread.posts && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-4 pb-5 border-t border-white/[0.04]">

              {/* Entry/Target/Stop grid — Stitch style */}
              {thread.entry_price && (
                <div className="grid grid-cols-3 gap-3 mt-4 mb-4">
                  <div className="bg-[#0e0e0e] p-3 border-b-2 border-green-500/30">
                    <span className="text-[8px] font-mono text-white/30 block uppercase">ENTRY</span>
                    <span className="text-green-400 font-mono font-bold text-lg">${thread.entry_price.toLocaleString()}</span>
                  </div>
                  {thread.target_price && (
                    <div className="bg-[#0e0e0e] p-3 border-b-2 border-green-500/30">
                      <span className="text-[8px] font-mono text-white/30 block uppercase">TARGET</span>
                      <span className="text-green-400 font-mono font-bold text-lg">${thread.target_price.toLocaleString()}</span>
                    </div>
                  )}
                  {thread.stop_price && (
                    <div className="bg-[#0e0e0e] p-3 border-b-2 border-red-500/30">
                      <span className="text-[8px] font-mono text-white/30 block uppercase">STOP_LOSS</span>
                      <span className="text-red-400 font-mono font-bold text-lg">${thread.stop_price.toLocaleString()}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Chart */}
              <TradingViewChart
                symbol={thread.symbol || (detectSymbol(thread.topic) === 'eth' ? 'ETH' : detectSymbol(thread.topic) === 'sol' ? 'SOL' : 'BTC')}
                entryPrice={thread.entry_price}
                stopPrice={thread.stop_price}
                targetPrice={thread.target_price}
                direction={thread.direction}
                height={220}
              />

              {/* Thread visual line + Agent posts — Stitch expanded debate */}
              <div className="space-y-4 mt-4 relative">
                <div className="absolute left-5 top-8 bottom-8 w-px bg-white/[0.05] -z-10" />

                {thread.posts.map((post, idx) => {
                  const agent = AGENTS[post.agent] || AGENTS.cio;
                  const isRedTeam = post.agent === 'redteam';
                  const isCio = post.agent === 'cio';
                  return (
                    <div key={post.id} className={`bg-white/[0.02] backdrop-blur-sm border-l-4 ${agent.borderColor} ${agent.bgTint} rounded-r p-4 ${isRedTeam ? 'ml-6' : ''} hover:bg-white/[0.04] transition-all ${isCio ? 'shadow-[0_0_20px_rgba(245,158,11,0.03)]' : ''}`}>
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded flex items-center justify-center border`}
                            style={{ borderColor: `${agent.color}30`, background: `${agent.color}10` }}>
                            <span className="text-sm font-black font-mono" style={{ color: agent.color }}>{agent.name.charAt(0)}</span>
                          </div>
                          <div>
                            <h3 className="font-bold text-sm uppercase">{agent.name}</h3>
                            <span className="text-[7px] font-mono tracking-widest" style={{ color: agent.color }}>
                              {post.agent === 'alpha' ? 'SIGNAL HUNTER' : post.agent === 'redteam' ? 'RISK MITIGATOR' : 'STRATEGIC OVERSEER'}
                            </span>
                          </div>
                        </div>
                        {/* CIO conviction big number */}
                        {isCio && conviction !== null && (
                          <div className="text-right">
                            <span className="font-mono text-2xl font-black text-amber-400 tracking-tighter">
                              {Math.round(conviction * 10)}<span className="text-xs text-white/20">/10</span>
                            </span>
                            <span className="block text-[7px] font-mono text-white/20 uppercase">CONVICTION</span>
                          </div>
                        )}
                        {!isCio && (
                          <span className="text-[8px] font-mono text-white/15">{timeAgo(post.created_at)}</span>
                        )}
                      </div>

                      <p className="text-[11px] font-mono text-white/50 leading-relaxed whitespace-pre-line">{post.content}</p>

                      {/* CIO conviction bar + verdict */}
                      {isCio && conviction !== null && (
                        <div className="mt-4 space-y-3">
                          <div className="w-full h-2 bg-white/[0.04] rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${convPct >= 70 ? 'bg-gradient-to-r from-green-500 to-green-400' : convPct >= 40 ? 'bg-gradient-to-r from-amber-500 to-amber-400' : 'bg-gradient-to-r from-red-500 to-red-400'}`}
                              style={{ width: `${convPct}%`, boxShadow: `0 0 10px ${convPct >= 70 ? '#22c55e' : convPct >= 40 ? '#f59e0b' : '#ef4444'}` }} />
                          </div>
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${convPct >= 60 ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className={`text-sm font-black tracking-widest ${convPct >= 60 ? 'text-green-400' : 'text-red-400'}`}>
                              {convPct >= 60 ? 'EXECUTE' : 'REJECT'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Resolution Card — "TE LO DIJE" — Stitch style */}
              {thread.resolution && thread.resolution !== 'pending' && (
                <div className={`relative overflow-hidden mt-4 p-6 rounded border ${
                  thread.resolution === 'win' ? 'border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent' : 'border-red-500/30 bg-gradient-to-br from-red-500/5 to-transparent'
                }`}>
                  {/* Background decoration */}
                  <div className={`absolute -right-8 -bottom-8 font-black text-8xl italic pointer-events-none ${
                    thread.resolution === 'win' ? 'text-green-500/5' : 'text-red-500/5'
                  }`}>{thread.resolution === 'win' ? 'WIN' : 'LOSS'}</div>

                  <div className="relative z-10">
                    <span className={`inline-block px-3 py-1 text-[8px] font-mono font-black tracking-widest mb-3 ${
                      thread.resolution === 'win' ? 'bg-green-500 text-black' : 'bg-red-500 text-white'
                    }`}>TE LO DIJE</span>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h2 className={`text-4xl sm:text-5xl font-black tracking-tighter italic ${
                          thread.resolution === 'win' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {thread.resolution_pnl_pct ? `${thread.resolution_pnl_pct >= 0 ? '+' : ''}${thread.resolution_pnl_pct}%` : thread.resolution.toUpperCase()}
                        </h2>
                        <p className="text-[9px] font-mono text-white/25 uppercase tracking-widest mt-1">
                          PNL REALIZED · {thread.symbol}
                        </p>
                      </div>
                      <div className="flex gap-6 text-[9px] font-mono">
                        {thread.resolved_at && (
                          <div>
                            <span className="text-white/20 block uppercase">RESOLVED</span>
                            <span className="text-white/50">{new Date(thread.resolved_at).toLocaleDateString()}</span>
                          </div>
                        )}
                        <div>
                          <span className="text-white/20 block uppercase">STATUS</span>
                          <span className={thread.resolution === 'win' ? 'text-green-400' : 'text-red-400'}>
                            {thread.resolution === 'win' ? 'SUCCESS' : 'STOPPED'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 mt-3 border-t border-white/[0.04]">
                <Link to={`/agentic-world/bobby?q=${encodeURIComponent(`Why did you ${thread.direction || 'analyze'} ${thread.symbol || 'the market'}?`)}`}
                  className="flex items-center gap-1.5 text-[9px] font-mono text-yellow-400/40 hover:text-yellow-400 transition-colors">
                  <MessageSquare className="w-3 h-3" /> ASK BOBBY WHY
                </Link>
                <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`${thread.topic}\n\nBobby CIO: ${conviction !== null ? `${Math.round(conviction * 10)}/10 conviction` : ''}\n\nAgent Trading Forum`)}&url=${encodeURIComponent(`${window.location.origin}/agentic-world/forum`)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1 text-[9px] font-mono text-white/20 hover:text-blue-400/60 transition-colors">
                  <Share2 className="w-3 h-3" /> SHARE
                </a>
                <span className="text-[8px] font-mono text-white/10 ml-auto">
                  {(thread.posts || []).length} agent posts
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.article>
  );
}

export default function AgentForumPage() {
  const { address } = useAccount();
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('new');
  const [scope, setScope] = useState<'public' | 'my'>('public');
  const agentName = localStorage.getItem('bobby_agent_name') || 'BOBBY';

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SB_URL}/rest/v1/forum_threads?order=created_at.desc&limit=50&select=*`, {
        headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      });
      if (!res.ok) { setLoading(false); return; }
      const threadData: ForumThread[] = await res.json();

      const threadIds = threadData.map(t => t.id);
      if (threadIds.length > 0) {
        const postsRes = await fetch(`${SB_URL}/rest/v1/forum_posts?thread_id=in.(${threadIds.join(',')})&order=created_at.asc`, {
          headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
        });
        if (postsRes.ok) {
          const posts: ForumPost[] = await postsRes.json();
          for (const thread of threadData) {
            thread.posts = posts.filter(p => p.thread_id === thread.id);
          }
        }
      }
      setThreads(threadData);
      if (threadData.length > 0 && !expandedId) setExpandedId(threadData[0].id);
    } catch (e) { console.error('[Forum] Fetch error:', e); }
    setLoading(false);
  }, [expandedId]);

  useEffect(() => { fetchThreads(); }, []);

  // Stats
  const forumStats = useMemo(() => {
    const resolved = threads.filter(t => t.resolution && t.resolution !== 'pending');
    const wins = resolved.filter(t => t.resolution === 'win').length;
    const avgConv = threads.length > 0
      ? (threads.reduce((s, t) => s + (t.conviction_score || 0), 0) / threads.length * 10).toFixed(1)
      : '0';
    return {
      total: threads.length,
      executed: threads.filter(t => t.status === 'executed' || t.resolution).length,
      rejected: threads.filter(t => t.status === 'rejected').length,
      avgConviction: avgConv,
      winRate: resolved.length > 0 ? Math.round((wins / resolved.length) * 100) : 0,
    };
  }, [threads]);

  // Filter + sort
  const filteredThreads = useMemo(() => {
    let filtered = threads;

    // Scope filter: public = Bobby's debates, my = user's private debates
    if (scope === 'my' && address) {
      filtered = filtered.filter(t => t.scope === 'private' && t.owner_wallet?.toLowerCase() === address.toLowerCase());
    } else {
      filtered = filtered.filter(t => !t.scope || t.scope === 'public');
    }

    if (category !== 'all') {
      filtered = filtered.filter(t => detectSymbol(t.topic) === category || t.symbol?.toLowerCase() === category);
    }
    if (sort === 'conviction') {
      filtered = [...filtered].sort((a, b) => (b.conviction_score || 0) - (a.conviction_score || 0));
    } else if (sort === 'hot') {
      filtered = [...filtered].sort((a, b) => {
        const sa = (a.conviction_score || 0) * 10 + (1 / (Date.now() - new Date(a.created_at).getTime()));
        const sb = (b.conviction_score || 0) * 10 + (1 / (Date.now() - new Date(b.created_at).getTime()));
        return sb - sa;
      });
    }
    return filtered;
  }, [threads, category, sort, scope, address]);

  return (
    <KineticShell showSidebar>
      <Helmet><title>Debates | Bobby Agent Trader</title></Helmet>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">AGENT DEBATES</h1>
          <p className="font-mono text-xs text-white/30 mt-1">
            Three agents debate every market move. Read the reasoning. Judge the logic. You decide.
          </p>
        </motion.div>

        {/* Scope tabs: PUBLIC vs MY ROOM */}
        <div className="flex gap-2 mb-5">
          <button onClick={() => setScope('public')}
            className={`px-4 py-2 text-[10px] font-mono font-bold tracking-wider rounded transition-all ${
              scope === 'public'
                ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                : 'bg-white/[0.02] border border-white/[0.04] text-white/30 hover:text-white/50'
            }`}>
            BOBBY'S CHALLENGE
          </button>
          <button onClick={() => setScope('my')}
            className={`px-4 py-2 text-[10px] font-mono font-bold tracking-wider rounded transition-all ${
              scope === 'my'
                ? 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
                : 'bg-white/[0.02] border border-white/[0.04] text-white/30 hover:text-white/50'
            }`}>
            {agentName}'S ROOM
          </button>
        </div>

        {/* Stats strip — Stitch mobile style with colored left borders */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          {[
            { label: 'ACTIVE DEBATES', value: forumStats.total, color: 'text-green-400', border: 'border-l-2 border-green-500' },
            { label: 'AVG CONVICTION', value: `${forumStats.avgConviction}/10`, color: 'text-amber-400', border: 'border-l-2 border-amber-500' },
            { label: 'WIN RATE', value: `${forumStats.winRate}%`, color: 'text-green-400', border: 'border-l-2 border-green-500' },
          ].map(s => (
            <div key={s.label} className={`bg-[#0e0e0e] ${s.border} p-3`}>
              <span className="text-[8px] font-mono text-white/25 uppercase tracking-wider block">{s.label}</span>
              <span className={`text-lg font-mono font-bold ${s.color}`}>{s.value}</span>
            </div>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 mb-6">
          <Filter className="w-3.5 h-3.5 text-white/20" />
          {FILTERS.map(f => (
            <button key={f.id} onClick={() => setCategory(f.id)}
              className={`px-3 py-1 text-[9px] font-mono tracking-wider rounded transition-all ${
                category === f.id
                  ? 'bg-green-500/15 border border-green-500/30 text-green-400'
                  : 'bg-white/[0.02] border border-white/[0.04] text-white/30 hover:text-white/50'
              }`}>{f.label}</button>
          ))}
          <div className="h-4 w-px bg-white/[0.06] mx-1" />
          {SORTS.map(s => (
            <button key={s.id} onClick={() => setSort(s.id)}
              className={`flex items-center gap-1 px-3 py-1 text-[9px] font-mono tracking-wider rounded transition-all ${
                sort === s.id
                  ? 'bg-white/[0.06] text-white/60'
                  : 'text-white/20 hover:text-white/40'
              }`}>
              <s.Icon className="w-3 h-3" /> {s.label}
            </button>
          ))}
          <button onClick={fetchThreads} disabled={loading}
            className="ml-auto flex items-center gap-1 px-3 py-1 text-[9px] font-mono text-white/20 hover:text-green-400 transition-colors">
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} /> REFRESH
          </button>
        </div>

        {/* Thread list */}
        {loading ? (
          <div className="text-center py-20">
            <span className="text-[10px] font-mono text-white/20 animate-pulse">LOADING DEBATES...</span>
          </div>
        ) : filteredThreads.length === 0 ? (
          <div className="text-center py-20">
            <span className="text-[10px] font-mono text-white/20">NO DEBATES FOUND</span>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredThreads.map(thread => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                expanded={expandedId === thread.id}
                onToggle={() => setExpandedId(expandedId === thread.id ? null : thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </KineticShell>
  );
}
