// src/pages/AgenticWorldPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bot, Sparkles, Search, ArrowRight, Crown, Lock, Twitter } from 'lucide-react';
import { PixelSearch, PixelFilter } from '@/components/ui/pixel-icons';
import { PixelLobster, PixelTarget } from '@/components/ui/pixel-icons';
import { ScrambleText } from '@/components/agentic/ScrambleText';
import { AGENTIC_PROJECTS, AGENTIC_CATEGORIES } from '@/data/agentic-projects';
import AgentCard from '@/components/agentic/AgentCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Viral wallets from Twitter threads
const FEATURED_WALLETS = [
  { address: '0x3453de4c2cbe97c4e8b77e0a0ea3d12e9f959394', pseudonym: 'k9Q2mX4L8A7ZP3R', pnl: 906066, trades: 17548, source: '@Shelpid_WI3M', score: 94 },
  { address: '0xbeb5e5ce37e6c0b4076ce8e2ed9d4b37c54c704c', pseudonym: 'PBot1', pnl: 7456, trades: 8894, source: '@rohanpaul_ai', score: 87 },
  { address: '0x0ea574f3204c5c9c0cdead90392ea0990f4d17e4', pseudonym: 'Clawdbot Alpha', pnl: 240000, trades: 1096, source: '@HHorsley', score: 78 },
];

const SOCIAL_PROOF = [
  {
    handle: '@rohanpaul_ai',
    image: '/images/tweet-rohanpaul.png',
    stat: '$150K',
    url: 'https://x.com/rohanpaul_ai/status/2023269106808447426',
  },
  {
    handle: '@Shelpid_WI3M',
    image: '/images/tweet-shelpid.png',
    stat: '$906K',
    url: 'https://x.com/Shelpid_WI3M/status/2023794118887944431',
  },
  {
    handle: '@0xMarioNawfal',
    image: '/images/tweet-mario.png',
    stat: '$500K/mo',
    url: 'https://x.com/0xMovez/status/2023766450406600740',
  },
];

interface LeaderboardEntry { rank: number; userName: string; pnl: number; vol: number; proxyWallet: string; }

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

// SVG donut chart component
function DonutChart({ percent, color, label, size = 100 }: { percent: number; color: string; label: string; size?: number }) {
  const r = 38;
  const circ = 2 * Math.PI * r;
  const offset = circ - (percent / 100) * circ;
  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/5" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
          className="transition-all duration-1000 ease-out"
        />
        <text x="50" y="46" textAnchor="middle" className="fill-current" style={{ fontSize: '18px', fontFamily: 'monospace', fontWeight: 'bold', fill: color }}>
          {percent}%
        </text>
        <text x="50" y="62" textAnchor="middle" style={{ fontSize: '8px', fontFamily: 'monospace', fill: `${color}80` }}>
          {label}
        </text>
      </svg>
    </div>
  );
}

export default function AgenticWorldPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [walletInput, setWalletInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [scanCount, setScanCount] = useState<number | null>(null);
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [showDirectory, setShowDirectory] = useState(false);
  const [topTraders, setTopTraders] = useState<LeaderboardEntry[]>([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(true);

  useEffect(() => {
    supabase.from('scan_counter').select('count').eq('id', 'total_scans').maybeSingle()
      .then(({ data }) => { if (data?.count) setScanCount(data.count); });
  }, []);

  useEffect(() => {
    fetch('/api/polymarket-data/v1/leaderboard?category=OVERALL&timePeriod=ALL&orderBy=PNL&limit=5')
      .then(r => r.json())
      .then((data: LeaderboardEntry[]) => { if (Array.isArray(data)) setTopTraders(data); })
      .catch(() => {})
      .finally(() => setLoadingLeaderboard(false));
  }, []);

  const maxPnl = useMemo(() => topTraders.length ? topTraders[0]?.pnl || 1 : 1, [topTraders]);

  const handleWalletScan = () => {
    const addr = walletInput.trim().toLowerCase();
    if (!addr || !addr.startsWith('0x')) { toast.error('Enter a valid wallet address (0x...)'); return; }
    navigate(`/agentic-world/consensus?wallet=${addr}`);
  };

  const handleWaitlist = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) { toast.error('Enter a valid email'); return; }
    setWaitlistSubmitting(true);
    try {
      const { error } = await supabase.from('pro_waitlist').insert({ email: waitlistEmail.toLowerCase() });
      if (error?.code === '23505') toast.success("You're already on the list!");
      else if (error) throw error;
      else toast.success("You're on the Pro waitlist!");
      setWaitlistEmail('');
    } catch { toast.error('Something went wrong'); }
    setWaitlistSubmitting(false);
  };

  const filteredProjects = useMemo(() => {
    return AGENTIC_PROJECTS.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Agent Intelligence | DeFi Hub México</title>
        <meta name="description" content="70% of Polymarket traders lose money. AI agents capture $3.7B. You don't need to build an agent. Just follow one." />
        <meta property="og:title" content="AI Agent Intelligence | DeFi Hub México" />
        <meta property="og:description" content="70% of traders lose. AI agents win. Follow the smartest wallets on Polymarket." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">

        {/* ============ PROBLEM: TWEET SCREENSHOTS ============ */}
        <div className="mb-3">
          <div className="text-center mb-4">
            <span className="text-red-400/60 text-[10px] font-mono tracking-widest uppercase">While you trade manually, AI agents are printing money</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {SOCIAL_PROOF.map((tweet) => (
              <a
                key={tweet.handle}
                href={tweet.url}
                target="_blank"
                rel="noopener noreferrer"
                className="block border border-blue-500/20 bg-black/60 overflow-hidden hover:border-blue-500/50 hover:scale-[1.02] transition-all group"
              >
                <img
                  src={tweet.image}
                  alt={`${tweet.handle} tweet about AI agent profits`}
                  className="w-full h-auto"
                  loading="eager"
                />
                <div className="flex items-center justify-between px-3 py-2 border-t border-blue-500/10 font-mono">
                  <div className="flex items-center gap-1.5">
                    <Twitter className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-400/60 text-[10px]">{tweet.handle}</span>
                  </div>
                  <span className="text-green-400 text-xs font-bold">{tweet.stat}</span>
                </div>
              </a>
            ))}
          </div>
        </div>

        {/* ============ HERO: HEADLINE + SCANNER ============ */}
        <div className="border border-cyan-500/30 bg-black/60 overflow-hidden mb-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border-b border-cyan-500/20">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-cyan-400 text-[10px] font-mono ml-2 flex items-center gap-2">
              <PixelLobster size={14} className="text-cyan-400" />
              openclaw --agent-intelligence
            </span>
            <div className="ml-auto flex items-center gap-2">
              {scanCount && scanCount > 0 && (
                <span className="text-cyan-400/40 text-[10px] font-mono">{scanCount.toLocaleString()} scanned</span>
              )}
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
          </div>

          <div className="p-6 md:p-10 font-mono">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-cyan-300 mb-2 leading-tight">
              <ScrambleText text="You don't need to build an agent." speed={20} iterations={12} />
            </h1>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-cyan-400 leading-tight mb-8">
              <ScrambleText text="You just need to follow one." speed={20} iterations={15} />
            </h2>

            {/* Wallet scanner */}
            <div className="max-w-xl">
              <div className="flex gap-2">
                <Input
                  placeholder="0x... paste any wallet"
                  value={walletInput}
                  onChange={(e) => setWalletInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleWalletScan()}
                  className="h-12 font-mono text-base bg-black/60 border-cyan-500/30 text-cyan-300 placeholder:text-cyan-500/20 focus:border-cyan-400"
                />
                <Button onClick={handleWalletScan} className="h-12 px-6 bg-cyan-600 hover:bg-cyan-500 text-white font-mono font-bold text-sm">
                  <PixelTarget size={16} className="mr-2" />
                  X-RAY
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* ============ VISUAL STATS: DONUTS + VS BAR ============ */}
        <div className="border border-red-500/20 bg-black/60 overflow-hidden mb-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border-b border-red-500/20">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-red-400 text-[10px] font-mono ml-1">polymarket --reality-check</span>
          </div>

          <div className="p-6 md:p-8">
            {/* Donut charts row */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 mb-6">
              <DonutChart percent={70} color="#f87171" label="LOSE" />
              <DonutChart percent={0.04} color="#fbbf24" label="WIN BIG" />
              <DonutChart percent={95} color="#4ade80" label="AI WIN RATE" />
            </div>

            {/* Visual "You vs Agents" bar */}
            <div className="space-y-3 font-mono">
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-red-400/70">Average trader</span>
                  <span className="text-red-400 font-bold">-$847</span>
                </div>
                <div className="h-3 bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-red-500 to-red-600" style={{ width: '15%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-green-400/70">Top AI agents</span>
                  <span className="text-green-400 font-bold">+$906K to +$22M</span>
                </div>
                <div className="h-3 bg-white/5 overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-cyan-500 animate-pulse" style={{ width: '95%' }} />
                </div>
              </div>
            </div>

            <div className="text-red-400/15 text-[8px] font-mono mt-4">
              TU Berlin (1.7M wallets) | IMDEA Networks (86M bets)
            </div>
          </div>
        </div>

        {/* ============ AGENT LEADERBOARD: VISUAL BARS ============ */}
        <div className="border border-green-500/30 bg-black/60 overflow-hidden mb-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/20">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-green-400 text-[10px] font-mono ml-1 flex items-center gap-1.5">
              <PixelLobster size={12} className="text-green-400" />
              agent.leaderboard --top-pnl --live
            </span>
            <div className="ml-auto flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400/40 text-[9px] font-mono">LIVE</span>
            </div>
          </div>

          <div className="p-4 md:p-6 font-mono">
            {loadingLeaderboard ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-10 bg-green-500/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {topTraders.map((trader, i) => {
                  const barWidth = Math.max(10, (trader.pnl / maxPnl) * 100);
                  return (
                    <div
                      key={trader.proxyWallet}
                      className="group cursor-pointer hover:bg-green-500/5 transition-colors p-2 -mx-2"
                      onClick={() => navigate(`/agentic-world/consensus?wallet=${trader.proxyWallet}`)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-green-400/30 text-xs w-5">#{i + 1}</span>
                          <span className="text-green-300 text-sm font-bold">{trader.userName || trader.proxyWallet.slice(0, 10)}</span>
                        </div>
                        <span className="text-green-400 text-sm font-bold">+{formatUsd(trader.pnl)}</span>
                      </div>
                      <div className="h-2 bg-white/5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-600 to-green-400 group-hover:from-green-500 group-hover:to-cyan-400 transition-colors"
                          style={{ width: `${barWidth}%`, transition: 'width 0.8s ease-out' }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="text-green-400/15 text-[8px] mt-3 pt-2 border-t border-green-500/10">
              Polymarket Data API | click any trader to scan
            </div>
          </div>
        </div>

        {/* ============ 3 TOOLS ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div
            className="group border border-cyan-500/20 bg-black/40 overflow-hidden cursor-pointer hover:border-cyan-500/50 transition-all"
            onClick={() => navigate('/agentic-world/polymarket')}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/5 border-b border-cyan-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
              <span className="text-cyan-400 text-[10px] font-mono">market.scanner</span>
            </div>
            <div className="p-4 font-mono flex items-center gap-4">
              <div className="w-10 h-10 border border-cyan-500/30 bg-cyan-500/10 flex items-center justify-center shrink-0 text-cyan-400">
                <Search className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-cyan-300 text-sm font-bold">Market Scanner</div>
                <div className="text-cyan-400/40 text-[11px]">Paste URL. Detect agents.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-cyan-400/30 group-hover:text-cyan-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <div
            className="group border border-amber-500/20 bg-black/40 overflow-hidden cursor-pointer hover:border-amber-500/50 transition-all"
            onClick={() => navigate('/agentic-world/polymarket')}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/5 border-b border-amber-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-400 text-[10px] font-mono">wallet.xray</span>
            </div>
            <div className="p-4 font-mono flex items-center gap-4">
              <div className="w-10 h-10 border border-amber-500/30 bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-400">
                <PixelTarget size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-amber-300 text-sm font-bold">Wallet X-Ray</div>
                <div className="text-amber-400/40 text-[11px]">Deep scan. Strategy + score.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400/30 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>

          <div
            className="group border border-violet-500/20 bg-black/40 overflow-hidden cursor-pointer hover:border-violet-500/50 transition-all"
            onClick={() => navigate('/agentic-world/leaderboard')}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 bg-violet-500/5 border-b border-violet-500/15">
              <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
              <span className="text-violet-400 text-[10px] font-mono">ai.leaderboard</span>
            </div>
            <div className="p-4 font-mono flex items-center gap-4">
              <div className="w-10 h-10 border border-violet-500/30 bg-violet-500/10 flex items-center justify-center shrink-0 text-violet-400">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-violet-300 text-sm font-bold">AI Leaderboard</div>
                <div className="text-violet-400/40 text-[11px]">Live ranking. TVL + fees.</div>
              </div>
              <ArrowRight className="w-4 h-4 text-violet-400/30 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </div>

        {/* ============ VIRAL WALLETS: VISUAL CARDS ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          {FEATURED_WALLETS.map((w) => (
            <div
              key={w.address}
              className="border border-cyan-500/20 bg-black/60 overflow-hidden cursor-pointer hover:border-cyan-500/40 transition-all group"
              onClick={() => navigate(`/agentic-world/consensus?wallet=${w.address}`)}
            >
              <div className="p-4 font-mono">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-cyan-300 text-sm font-bold">{w.pseudonym}</span>
                  <span className={`text-[10px] px-2 py-0.5 border font-bold ${
                    w.score >= 80 ? 'text-red-400 border-red-500/30 bg-red-500/10' : 'text-orange-400 border-orange-500/30 bg-orange-500/10'
                  }`}>
                    <PixelLobster size={10} className="inline mr-1" />{w.score}
                  </span>
                </div>

                {/* Visual PnL bar */}
                <div className="mb-3">
                  <div className={`text-xl font-bold ${w.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {w.pnl >= 0 ? '+' : ''}{formatUsd(w.pnl)}
                  </div>
                  <div className="h-1.5 bg-white/5 mt-1.5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-500 to-cyan-400" style={{ width: `${Math.min(100, (w.pnl / 906066) * 100)}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-cyan-400/40">{w.trades.toLocaleString()} trades</span>
                  <span className="text-cyan-400/30">{w.source}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============ PRO WAITLIST ============ */}
        <div className="border border-amber-500/20 bg-black/60 overflow-hidden mb-3 font-mono">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-amber-400 text-[10px] ml-1 flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> pro.waitlist
            </span>
          </div>

          <div className="p-4 md:p-6">
            <div className="md:flex items-center gap-6">
              {/* Visual features as icons */}
              <div className="flex-1 grid grid-cols-2 gap-2 mb-4 md:mb-0">
                {[
                  { icon: '🔔', text: 'Alerts' },
                  { icon: '♾️', text: 'Unlimited scans' },
                  { icon: '🧠', text: 'AI explainer' },
                  { icon: '📊', text: 'CSV + API' },
                ].map((f) => (
                  <div key={f.text} className="flex items-center gap-2 text-amber-300/60 text-xs">
                    <span>{f.icon}</span> {f.text}
                  </div>
                ))}
              </div>
              <div className="max-w-sm w-full">
                <div className="flex gap-2">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={waitlistEmail}
                    onChange={(e) => setWaitlistEmail(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWaitlist()}
                    className="h-10 font-mono text-sm bg-black/60 border-amber-500/30 text-amber-300 placeholder:text-amber-500/20"
                  />
                  <Button onClick={handleWaitlist} disabled={waitlistSubmitting} className="h-10 px-5 bg-amber-600 hover:bg-amber-500 text-white font-mono text-xs font-bold">
                    {waitlistSubmitting ? '...' : 'JOIN PRO'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ FREE vs PRO: VISUAL COMPARISON ============ */}
        <div className="grid grid-cols-2 gap-3 mb-3 max-w-2xl mx-auto font-mono">
          <div className="border border-cyan-500/20 bg-black/60 p-4">
            <div className="text-cyan-400 text-[10px] font-bold mb-3">FREE</div>
            <div className="space-y-2 text-[11px]">
              {['7 signals', '5 scans/day', '3 follows', 'Score cards'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-cyan-300/60">
                  <div className="w-1.5 h-1.5 bg-green-500" style={{ imageRendering: 'pixelated' as const }} />
                  {item}
                </div>
              ))}
              <div className="flex items-center gap-2 text-cyan-300/30">
                <Lock className="w-3 h-3" /> AI explainer
              </div>
            </div>
          </div>
          <div className="border border-amber-500/20 bg-black/60 p-4">
            <div className="text-amber-400 text-[10px] font-bold mb-3 flex items-center gap-1.5">
              <Crown className="w-3 h-3" /> PRO
            </div>
            <div className="space-y-2 text-[11px]">
              {['Everything free +', 'Alpha Feed', 'Alerts', 'Unlimited', 'CSV + API'].map((item) => (
                <div key={item} className="flex items-center gap-2 text-amber-300/60">
                  <div className="w-1.5 h-1.5 bg-amber-500" style={{ imageRendering: 'pixelated' as const }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ============ DIRECTORY (collapsible) ============ */}
        <div className="border border-cyan-500/10 bg-black/30 overflow-hidden mb-8">
          <button
            onClick={() => setShowDirectory(!showDirectory)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-left hover:bg-cyan-500/5 transition-colors font-mono"
          >
            <Sparkles className="w-4 h-4 text-cyan-500" />
            <span className="text-cyan-400 text-xs font-bold">AI Agent Directory</span>
            <span className="text-cyan-400/30 text-[10px]">{AGENTIC_PROJECTS.length} projects</span>
            <span className="text-cyan-400/20 text-[10px] ml-auto">{showDirectory ? '[-]' : '[+]'}</span>
          </button>

          {showDirectory && (
            <div className="p-4 border-t border-cyan-500/10">
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <PixelSearch size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input placeholder="Search projects..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <PixelFilter size={14} className="mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('agenticWorld.categories.all')}</SelectItem>
                    {AGENTIC_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{t(`agenticWorld.categories.${cat}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <AgentCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <div className="p-12 text-center font-mono">
                  <Bot size={48} className="mx-auto mb-4 text-cyan-500/30" />
                  <p className="text-cyan-400/40 text-sm">{t('agenticWorld.noResults')}</p>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
