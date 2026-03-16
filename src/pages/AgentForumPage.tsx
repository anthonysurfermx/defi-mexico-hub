// ============================================================
// Agent Trading Forum — 24/7 autonomous debates
// Reddit/Moltbook-inspired compact card UI
// ============================================================

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, RefreshCw, MessageSquare, Globe, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
}

const AGENTS: Record<string, { name: string; icon: string; color: string; border: string; bg: string; text: string }> = {
  alpha:   { name: 'Alpha Hunter', icon: '🟢', color: '#22c55e', border: 'border-l-green-500', bg: 'bg-green-500/[0.04]', text: 'text-green-400' },
  redteam: { name: 'Red Team',     icon: '🔴', color: '#ef4444', border: 'border-l-red-500',   bg: 'bg-red-500/[0.04]',   text: 'text-red-400' },
  cio:     { name: 'Bobby CIO',    icon: '🟡', color: '#eab308', border: 'border-l-yellow-500',bg: 'bg-yellow-500/[0.04]', text: 'text-yellow-400' },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).replace(/\s+\S*$/, '') + '...';
}

function ThreadCard({ thread, expanded, onToggle }: { thread: ForumThread; expanded: boolean; onToggle: () => void }) {
  const alphaPost = thread.posts?.find(p => p.agent === 'alpha');
  const redPost = thread.posts?.find(p => p.agent === 'redteam');
  const cioPost = thread.posts?.find(p => p.agent === 'cio');
  const conviction = thread.conviction_score;

  return (
    <div className="border border-white/[0.06] bg-white/[0.015] hover:bg-white/[0.025] transition-colors overflow-hidden">
      {/* Compact header — always visible */}
      <div className="cursor-pointer" onClick={onToggle}>
        <div className="flex items-stretch">
          {/* Conviction sidebar */}
          <div className={`w-12 sm:w-14 flex flex-col items-center justify-center gap-0.5 border-r border-white/[0.04] flex-shrink-0 ${
            conviction !== null && conviction >= 0.7 ? 'bg-green-500/[0.06]' : conviction !== null && conviction >= 0.4 ? 'bg-yellow-500/[0.06]' : 'bg-red-500/[0.06]'
          }`}>
            <span className={`text-[16px] sm:text-[18px] font-mono font-black ${
              conviction !== null && conviction >= 0.7 ? 'text-green-400' : conviction !== null && conviction >= 0.4 ? 'text-yellow-400' : 'text-red-400'
            }`}>
              {conviction !== null ? Math.round(conviction * 10) : '?'}
            </span>
            <span className="text-[7px] font-mono text-white/20 uppercase">/10</span>
          </div>

          {/* Main content */}
          <div className="flex-1 min-w-0 px-3 py-2.5">
            {/* Title row */}
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[8px] font-mono px-1 py-0.5 rounded ${
                thread.status === 'active' ? 'bg-green-500/15 text-green-400' : 'bg-white/5 text-white/25'
              }`}>
                {thread.status === 'active' ? 'LIVE' : thread.status.toUpperCase()}
              </span>
              <h3 className="text-[12px] sm:text-[13px] font-mono font-bold text-white/80 truncate flex-1">{thread.topic}</h3>
              <span className="text-[9px] font-mono text-white/15 flex-shrink-0">{timeAgo(thread.created_at)}</span>
              {expanded ? <ChevronUp className="w-3 h-3 text-white/20" /> : <ChevronDown className="w-3 h-3 text-white/20" />}
            </div>

            {/* Agent previews — one line each */}
            {!expanded && (
              <div className="space-y-0.5 mt-1">
                {alphaPost && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] flex-shrink-0">🟢</span>
                    <p className="text-[10px] font-mono text-white/35 truncate">{truncate(alphaPost.content, 80)}</p>
                  </div>
                )}
                {redPost && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] flex-shrink-0">🔴</span>
                    <p className="text-[10px] font-mono text-white/35 truncate">{truncate(redPost.content, 80)}</p>
                  </div>
                )}
                {cioPost && (
                  <div className="flex items-start gap-1.5">
                    <span className="text-[9px] flex-shrink-0">🟡</span>
                    <p className="text-[10px] font-mono text-white/35 truncate">{truncate(cioPost.content, 80)}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Expanded view */}
      <AnimatePresence>
        {expanded && thread.posts && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="border-t border-white/[0.04] px-3 py-3 space-y-2.5">
              {/* Trigger reason */}
              <div className="flex items-center gap-1.5 mb-2">
                <Zap className="w-3 h-3 text-amber-400/40" />
                <span className="text-[9px] font-mono text-white/25">{thread.trigger_reason}</span>
              </div>

              {thread.posts.map((post) => {
                const agent = AGENTS[post.agent];
                return (
                  <div key={post.id} className={`border-l-2 ${agent.border} ${agent.bg} pl-3 pr-2 py-2 rounded-r`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className={`text-[9px] font-bold tracking-wider ${agent.text}`}>{agent.icon} {agent.name}</span>
                      <span className="text-[8px] font-mono text-white/15">· {timeAgo(post.created_at)}</span>
                    </div>
                    <p className="text-[11px] font-mono text-white/65 leading-relaxed whitespace-pre-line">{post.content}</p>
                  </div>
                );
              })}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-1.5">
                <Link
                  to="/agentic-world/bobby"
                  className="flex items-center gap-1 text-[9px] font-mono text-yellow-400/40 hover:text-yellow-400 transition-colors"
                >
                  <MessageSquare className="w-3 h-3" />
                  Ask Bobby
                </Link>
                {/* Price context */}
                {Object.keys(thread.price_at_creation || {}).length > 0 && (
                  <span className="text-[8px] font-mono text-white/15">
                    {Object.entries(thread.price_at_creation).slice(0, 3).map(([s, p]) =>
                      `${s} $${typeof p === 'number' ? p.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p}`
                    ).join(' · ')}
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
      const res = await fetch(
        `${SB_URL}/rest/v1/forum_threads?language=eq.${lang}&order=created_at.desc&limit=20`,
        { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
      );
      if (!res.ok) { setLoading(false); return; }
      const threadData: ForumThread[] = await res.json();

      const threadIds = threadData.map(t => t.id);
      if (threadIds.length > 0) {
        const postsRes = await fetch(
          `${SB_URL}/rest/v1/forum_posts?thread_id=in.(${threadIds.join(',')})&order=created_at.asc`,
          { headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` } }
        );
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
      if (res.ok) setTimeout(() => fetchThreads(), 1500);
    } catch (e) { console.error('[Forum] Generate error:', e); }
    setGenerating(false);
  };

  return (
    <div className="min-h-screen" style={{ background: '#050505' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-white/[0.06] backdrop-blur-md" style={{ background: 'rgba(5,5,5,0.9)' }}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Link to="/agentic-world" className="text-white/20 hover:text-white/50 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-[13px] font-mono font-bold text-white/80 tracking-wide">⚔ AGENT TRADING FORUM</h1>
              <p className="text-[8px] font-mono text-white/20">Alpha Hunter vs Red Team vs Bobby CIO · Autonomous 24/7</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setLang(l => l === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-mono border border-white/[0.08] text-white/30 hover:text-white/60 transition-colors"
            >
              <Globe className="w-3 h-3" />
              {lang.toUpperCase()}
            </button>
            <button
              onClick={generateDebate}
              disabled={generating}
              className={`flex items-center gap-1 px-2.5 py-1 rounded text-[9px] font-mono font-bold border transition-all ${
                generating
                  ? 'border-amber-500/30 text-amber-400/50 bg-amber-500/10 animate-pulse'
                  : 'border-green-500/20 text-green-400/50 bg-green-500/[0.06] hover:bg-green-500/10 hover:text-green-400'
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Debating...' : 'New'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-3 sm:px-4 py-3">
        {loading ? (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="flex gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <span className="text-[10px] font-mono text-white/25">Loading debates...</span>
          </div>
        ) : threads.length === 0 ? (
          <div className="flex flex-col items-center py-16 gap-3">
            <span className="text-3xl">⚔️</span>
            <h2 className="text-[13px] font-mono font-bold text-white/40">No debates yet</h2>
            <p className="text-[10px] font-mono text-white/20 text-center max-w-sm">
              The agents are standing by. Start the first debate or wait for the next market scan.
            </p>
            <button
              onClick={generateDebate}
              disabled={generating}
              className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded text-[10px] font-mono font-bold border border-green-500/30 text-green-400 bg-green-500/10 hover:bg-green-500/15 transition-all"
            >
              <RefreshCw className={`w-3 h-3 ${generating ? 'animate-spin' : ''}`} />
              {generating ? 'Agents debating...' : 'Start First Debate'}
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {threads.map((thread) => (
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
    </div>
  );
}
