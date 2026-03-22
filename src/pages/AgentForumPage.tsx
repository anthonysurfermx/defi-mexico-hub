// ============================================================
// Agent Trading Forum — Stitch Bloomberg-style design
// Multi-agent debates with glass-card feed, agent avatars,
// confidence bars, expandable threads with TradingView charts
// All data REAL from Supabase forum_threads + forum_posts
// ============================================================

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
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

      {/* Expanded debate */}
      <AnimatePresence>
        {expanded && thread.posts && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04]">
              {/* Trade parameters */}
              {thread.entry_price && (
                <div className="flex items-center gap-3 p-3 bg-white/[0.02] rounded mt-3">
                  <span className={`text-[9px] font-mono font-bold ${thread.direction === 'long' ? 'text-green-400' : 'text-red-400'}`}>
                    {thread.direction === 'long' ? '↑ LONG' : '↓ SHORT'} {thread.symbol}
                  </span>
                  <div className="flex items-center gap-2 text-[8px] font-mono">
                    <span className="text-white/30">Entry: <span className="text-white/60">${thread.entry_price.toLocaleString()}</span></span>
                    {thread.stop_price && <span className="text-red-400/40">SL: <span className="text-red-400/70">${thread.stop_price.toLocaleString()}</span></span>}
                    {thread.target_price && <span className="text-green-400/40">TP: <span className="text-green-400/70">${thread.target_price.toLocaleString()}</span></span>}
                  </div>
                  {thread.resolution && thread.resolution !== 'pending' && (
                    <span className={`text-[9px] font-mono font-bold ml-auto ${
                      thread.resolution === 'win' ? 'text-green-400' : 'text-red-400'
                    }`}>{thread.resolution === 'win' ? `+${thread.resolution_pnl_pct}%` : `${thread.resolution_pnl_pct}%`}</span>
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

              {/* Agent posts — Bloomberg style with border-l-4 */}
              {thread.posts.map((post) => {
                const agent = AGENTS[post.agent] || AGENTS.cio;
                return (
                  <div key={post.id} className={`border-l-4 ${agent.borderColor} ${agent.bgTint} rounded-r pl-4 pr-3 py-3`}>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded flex items-center justify-center bg-white/[0.04]">
                          <span className="text-[9px] font-mono font-black" style={{ color: agent.color }}>{agent.name.charAt(0)}</span>
                        </div>
                        <span className={`text-[9px] font-mono font-bold tracking-wider ${agent.badge.split(' ')[1]}`}>{agent.name}</span>
                      </div>
                      <span className="text-[8px] font-mono text-white/15">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/50 leading-relaxed whitespace-pre-line">{post.content}</p>
                    {post.agent === 'cio' && conviction !== null && (
                      <div className="mt-3 flex items-center gap-3">
                        <span className="text-[8px] font-mono text-amber-400/50 tracking-widest">CONVICTION</span>
                        <div className="flex-1 h-2 bg-white/[0.04] rounded-full overflow-hidden max-w-[160px]">
                          <div className={`h-full rounded-full ${convPct >= 70 ? 'bg-green-500' : convPct >= 40 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${convPct}%`, boxShadow: `0 0 8px ${convPct >= 70 ? 'rgba(34,197,94,0.4)' : convPct >= 40 ? 'rgba(245,158,11,0.4)' : 'rgba(239,68,68,0.4)'}` }} />
                        </div>
                        <span className={`text-[10px] font-mono font-bold ${convPct >= 70 ? 'text-green-400' : convPct >= 40 ? 'text-amber-400' : 'text-red-400'}`}>
                          {Math.round(conviction * 10)}/10
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-2 border-t border-white/[0.04]">
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
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('new');

  const fetchThreads = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${SB_URL}/rest/v1/forum_threads?order=created_at.desc&limit=50`, {
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
  }, [threads, category, sort]);

  return (
    <KineticShell showSidebar>
      <Helmet><title>Agent Trading Forum | Bobby Agent Trader</title></Helmet>

      <div className="max-w-5xl mx-auto px-4 md:px-8 py-6 pb-20">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">AGENT_FORUM</h1>
          <p className="font-mono text-xs text-white/30 mt-1">
            Every trade is preceded by a 3-agent debate. Read the reasoning. Judge the logic.
          </p>
        </motion.div>

        {/* Stats strip */}
        <div className="flex flex-wrap gap-4 mb-6 text-[10px] font-mono">
          {[
            { label: 'DEBATES', value: forumStats.total, color: 'text-white/60' },
            { label: 'EXECUTED', value: forumStats.executed, color: 'text-green-400' },
            { label: 'REJECTED', value: forumStats.rejected, color: 'text-red-400' },
            { label: 'AVG CONVICTION', value: `${forumStats.avgConviction}/10`, color: 'text-amber-400' },
            { label: 'WIN RATE', value: `${forumStats.winRate}%`, color: 'text-green-400' },
          ].map(s => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="text-white/20">{s.label}:</span>
              <span className={`font-bold ${s.color}`}>{s.value}</span>
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
