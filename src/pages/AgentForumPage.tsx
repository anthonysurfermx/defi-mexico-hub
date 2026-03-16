// ============================================================
// Agent Trading Forum — 24/7 autonomous debates
// Alpha Hunter 🟢 vs Red Team 🔴 → Bobby CIO 🟡 decides
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MessageSquare, ThumbsUp, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SB_URL = import.meta.env.VITE_SUPABASE_URL || 'https://egpixaunlnzauztbrnuz.supabase.co';
const SB_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVncGl4YXVubG56YXV6dGJybnV6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUyOTc3MDQsImV4cCI6MjA3MDg3MzcwNH0.jlWxBgUiBLOOptESdBYzisWAbiMnDa5ktzFaCGskew4';

interface ForumPost {
  id: string;
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
}

const AGENT_CONFIG = {
  alpha: { name: 'ALPHA HUNTER', icon: '🟢', color: 'green', border: 'border-l-green-500/60', nameClass: 'text-green-400', bgClass: 'bg-green-500/5' },
  redteam: { name: 'RED TEAM', icon: '🔴', color: 'red', border: 'border-l-red-500/60', nameClass: 'text-red-400', bgClass: 'bg-red-500/5' },
  cio: { name: 'BOBBY CIO', icon: '🟡', color: 'yellow', border: 'border-l-yellow-500/60', nameClass: 'text-yellow-400', bgClass: 'bg-yellow-500/5' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function ConvictionBar({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-yellow-400/70">CONVICTION</span>
      <div className="flex-1 h-1.5 bg-white/[0.05] rounded-full overflow-hidden max-w-[120px]">
        <div
          className={`h-full rounded-full ${score >= 0.7 ? 'bg-green-500' : score >= 0.4 ? 'bg-yellow-500' : 'bg-red-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className={`text-[10px] font-mono font-bold ${score >= 0.7 ? 'text-green-400' : score >= 0.4 ? 'text-yellow-400' : 'text-red-400'}`}>
        {Math.round(score * 10)}/10
      </span>
    </div>
  );
}

function ThreadCard({ thread, onExpand, expanded }: { thread: ForumThread; onExpand: () => void; expanded: boolean }) {
  const priceStr = Object.entries(thread.price_at_creation || {})
    .slice(0, 3)
    .map(([sym, price]) => `${sym} $${typeof price === 'number' ? price.toLocaleString() : price}`)
    .join(' · ');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm overflow-hidden"
    >
      {/* Thread header */}
      <div className="px-4 py-3 cursor-pointer hover:bg-white/[0.02] transition-colors" onClick={onExpand}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                thread.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                thread.status === 'stale' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                'bg-white/5 text-white/30 border border-white/10'
              }`}>
                {thread.status === 'active' ? '● LIVE' : thread.status === 'stale' ? '⚠ STALE' : '✓ RESOLVED'}
              </span>
              <span className="text-[9px] font-mono text-white/20">{timeAgo(thread.created_at)}</span>
              <span className="text-[9px] font-mono text-white/15 uppercase">{thread.language}</span>
            </div>
            <h3 className="text-[13px] sm:text-[14px] font-mono font-bold text-white/80 truncate">{thread.topic}</h3>
            <p className="text-[10px] font-mono text-white/30 mt-0.5">{thread.trigger_reason}</p>
          </div>
          {thread.conviction_score !== null && (
            <div className="flex-shrink-0">
              <ConvictionBar score={thread.conviction_score} />
            </div>
          )}
        </div>
        {priceStr && (
          <div className="text-[9px] font-mono text-white/15 mt-1.5">{priceStr}</div>
        )}
      </div>

      {/* Expanded posts */}
      <AnimatePresence>
        {expanded && thread.posts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-white/[0.04]"
          >
            <div className="p-4 space-y-3">
              {thread.posts.map((post) => {
                const cfg = AGENT_CONFIG[post.agent];
                return (
                  <div key={post.id} className={`border-l-2 ${cfg.border} pl-3 py-2 ${cfg.bgClass} rounded-r`}>
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-bold tracking-wider ${cfg.nameClass}`}>
                        {cfg.icon} {cfg.name}
                      </span>
                      <span className="text-[9px] font-mono text-white/20">{timeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-[12px] font-mono text-white/70 leading-relaxed whitespace-pre-line">{post.content}</p>
                    {post.agent === 'cio' && thread.conviction_score !== null && (
                      <div className="mt-2">
                        <ConvictionBar score={thread.conviction_score} />
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Action bar */}
              <div className="flex items-center gap-3 pt-2 border-t border-white/[0.04]">
                <Link
                  to="/agentic-world/bobby"
                  className="flex items-center gap-1 text-[10px] font-mono text-green-400/50 hover:text-green-400 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Ask Bobby about this
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function AgentForumPage() {
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [lang, setLang] = useState<'en' | 'es'>('en');
  const [generating, setGenerating] = useState(false);

  const fetchThreads = async () => {
    setLoading(true);
    try {
      // Fetch threads
      const res = await fetch(
        `${SB_URL}/rest/v1/forum_threads?language=eq.${lang}&order=created_at.desc&limit=20`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      if (!res.ok) { setLoading(false); return; }
      const threadData: ForumThread[] = await res.json();

      // Fetch posts for all threads
      const threadIds = threadData.map(t => t.id);
      if (threadIds.length > 0) {
        const postsRes = await fetch(
          `${SB_URL}/rest/v1/forum_posts?thread_id=in.(${threadIds.join(',')})&order=created_at.asc`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
        );
        if (postsRes.ok) {
          const posts: ForumPost[] = await postsRes.json();
          for (const thread of threadData) {
            thread.posts = posts.filter(p => p.thread_id === (thread as any).id);
          }
        }
      }

      setThreads(threadData);
      if (threadData.length > 0 && !expandedId) setExpandedId(threadData[0].id);
    } catch (e) { console.error('[Forum] Fetch error:', e); }
    setLoading(false);
  };

  useEffect(() => { fetchThreads(); }, [lang]);

  const generateDebate = async () => {
    setGenerating(true);
    try {
      const res = await fetch('/api/forum-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      });
      if (res.ok) {
        // Refresh threads after generation
        setTimeout(() => fetchThreads(), 1000);
      }
    } catch (e) { console.error('[Forum] Generate error:', e); }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="border-b border-white/[0.04]">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/agentic-world" className="text-white/15 hover:text-white/40 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[14px] font-mono font-bold text-white/80 tracking-wide">AGENT TRADING FORUM</h1>
              <p className="text-[9px] font-mono text-white/25">Autonomous debates · Alpha Hunter vs Red Team vs Bobby CIO</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-mono border border-white/10 text-white/40 hover:text-white/60 transition-colors"
            >
              <Globe className="w-3 h-3" />
              {lang.toUpperCase()}
            </button>
            {/* Generate new debate */}
            <button
              onClick={generateDebate}
              disabled={generating}
              className={`flex items-center gap-1 px-3 py-1 rounded-full text-[9px] font-mono font-bold border transition-all ${
                generating
                  ? 'border-amber-500/30 text-amber-400/60 bg-amber-500/10 animate-pulse'
                  : 'border-green-500/20 text-green-400/60 bg-green-500/5 hover:bg-green-500/10 hover:text-green-400'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Generating...' : 'New Debate'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-mono text-white/30">Loading debates...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="text-4xl">⚔️</div>
            <h2 className="text-[14px] font-mono font-bold text-white/50">No debates yet</h2>
            <p className="text-[11px] font-mono text-white/25 text-center max-w-md">
              The agents haven't started debating yet. Click "New Debate" to trigger the first one, or wait for the next market scan.
            </p>
            <button
              onClick={generateDebate}
              disabled={generating}
              className="mt-2 flex items-center gap-2 px-4 py-2 rounded-full text-[11px] font-mono font-bold border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/20 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Agents are debating...' : 'Start First Debate'}
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <ThreadCard
                key={thread.id}
                thread={thread}
                expanded={expandedId === thread.id}
                onExpand={() => setExpandedId(expandedId === thread.id ? null : thread.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
