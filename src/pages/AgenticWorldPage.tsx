// src/pages/AgenticWorldPage.tsx
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Bot, Sparkles, Search, ScanSearch, BarChart3,
  TrendingUp, Wallet, ArrowRight, Users, Zap, Crown, Lock
} from 'lucide-react';
import { PixelSearch, PixelFilter } from '@/components/ui/pixel-icons';
import { PixelLobster } from '@/components/ui/pixel-icons';
import { ScrambleText } from '@/components/agentic/ScrambleText';
import { AGENTIC_PROJECTS, AGENTIC_CATEGORIES } from '@/data/agentic-projects';
import AgentCard from '@/components/agentic/AgentCard';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// Viral wallets from Twitter threads (pre-loaded showcases)
const FEATURED_WALLETS = [
  {
    address: '0x3453de4c2cbe97c4e8b77e0a0ea3d12e9f959394',
    pseudonym: 'k9Q2mX4L8A7ZP3R',
    pnl: 906066,
    positions: 328,
    trades: 17548,
    tag: '$906K PnL',
    source: '@Shelpid_WI3M',
  },
  {
    address: '0xbeb5e5ce37e6c0b4076ce8e2ed9d4b37c54c704c',
    pseudonym: 'PBot1',
    pnl: 7456,
    positions: 2953,
    trades: 8894,
    tag: '8,894 trades',
    source: '@rohanpaul_ai',
  },
  {
    address: '0x0ea574f3204c5c9c0cdead90392ea0990f4d17e4',
    pseudonym: 'Clawdbot Alpha',
    pnl: 240000,
    positions: 565,
    trades: 1096,
    tag: '$2K to $240K',
    source: '@HHorsley',
  },
];

function formatUsd(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
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

  // Fetch scan count
  useEffect(() => {
    supabase
      .from('scan_counter')
      .select('count')
      .eq('id', 'total_scans')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.count) setScanCount(data.count);
      });
  }, []);

  const handleWalletScan = () => {
    const addr = walletInput.trim().toLowerCase();
    if (!addr || !addr.startsWith('0x')) {
      toast.error('Enter a valid wallet address (0x...)');
      return;
    }
    navigate(`/agentic-world/consensus?wallet=${addr}`);
  };

  const handleWaitlist = async () => {
    if (!waitlistEmail || !waitlistEmail.includes('@')) {
      toast.error('Enter a valid email');
      return;
    }
    setWaitlistSubmitting(true);
    try {
      const { error } = await supabase
        .from('pro_waitlist')
        .insert({ email: waitlistEmail.toLowerCase() });
      if (error?.code === '23505') {
        toast.success("You're already on the list!");
      } else if (error) {
        throw error;
      } else {
        toast.success("You're on the Pro waitlist!");
      }
      setWaitlistEmail('');
    } catch {
      toast.error('Something went wrong');
    }
    setWaitlistSubmitting(false);
  };

  const filteredProjects = useMemo(() => {
    return AGENTIC_PROJECTS.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>AI Agent Intelligence | DeFi Hub México</title>
        <meta name="description" content="Detect AI agents on Polymarket. Analyze wallet behavior, classify trading strategies, and track the most profitable bots in prediction markets." />
        <meta property="og:title" content="AI Agent Intelligence | DeFi Hub México" />
        <meta property="og:description" content="Detect AI agents on Polymarket. Analyze wallets, classify strategies, track profitable bots." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">

        {/* ============ HERO: Wallet Scanner ============ */}
        <div className="relative mb-12">
          {/* Background glow */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent rounded-2xl" />

          <div className="relative text-center py-8 md:py-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <PixelLobster size={36} className="text-cyan-400" />
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 bg-clip-text text-transparent">
                Agent Intelligence
              </h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto mb-2">
              Detect bots. Classify strategies. Track the smartest wallets on Polymarket.
            </p>
            {scanCount && scanCount > 100 && (
              <div className="text-cyan-400/60 text-sm font-mono mb-6">
                {scanCount.toLocaleString()} wallets analyzed
              </div>
            )}

            {/* Main wallet input */}
            <div className="max-w-xl mx-auto">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <ScanSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Paste any Polymarket wallet (0x...)"
                    value={walletInput}
                    onChange={(e) => setWalletInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleWalletScan()}
                    className="pl-10 h-12 text-base font-mono bg-black/40 border-cyan-500/30 focus:border-cyan-400"
                  />
                </div>
                <Button
                  onClick={handleWalletScan}
                  className="h-12 px-6 bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-bold"
                >
                  <Search className="w-4 h-4 mr-2" />
                  X-Ray
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Free: bot score, strategy classification, 7 behavioral signals, positions
              </p>
            </div>
          </div>
        </div>

        {/* ============ 3 TOOLS ============ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {/* Market Scanner */}
          <Card
            className="group cursor-pointer border-cyan-500/20 hover:border-cyan-500/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-cyan-500/10"
            onClick={() => navigate('/agentic-world/polymarket')}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Search className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1">Market Scanner</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Paste a Polymarket URL. Scan all holders. Find the agents.
              </p>
              <div className="flex items-center text-cyan-400 text-sm font-medium">
                Scan Market <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Wallet X-Ray */}
          <Card
            className="group cursor-pointer border-amber-500/20 hover:border-amber-500/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/10"
            onClick={() => navigate('/agentic-world/polymarket')}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1">Wallet X-Ray</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Deep behavioral analysis. Bot score + strategy + AI explanation.
              </p>
              <div className="flex items-center text-amber-400 text-sm font-medium">
                Analyze Wallet <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>

          {/* Leaderboard */}
          <Card
            className="group cursor-pointer border-violet-500/20 hover:border-violet-500/50 transition-all hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/10"
            onClick={() => navigate('/agentic-world/leaderboard')}
          >
            <CardContent className="p-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-1">AI Agent Leaderboard</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Live ranking of AI agent protocols by TVL, fees, and market cap.
              </p>
              <div className="flex items-center text-violet-400 text-sm font-medium">
                View Rankings <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ============ FEATURED SCANS: Viral Wallets ============ */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-cyan-400" />
            <h2 className="text-xl font-bold">Trending on Twitter</h2>
            <Badge className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]">LIVE</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            These wallets are going viral right now. Click to run a full behavioral scan.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {FEATURED_WALLETS.map((w) => (
              <div
                key={w.address}
                className="group border border-cyan-500/20 bg-black/40 p-4 cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all font-mono"
                onClick={() => navigate(`/agentic-world/consensus?wallet=${w.address}`)}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-cyan-300 text-sm font-bold">{w.pseudonym}</span>
                  <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                    {w.tag}
                  </Badge>
                </div>
                <div className="text-[10px] text-cyan-400/40 mb-3">
                  {w.address.slice(0, 10)}...{w.address.slice(-6)}
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className={`text-sm font-bold ${w.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {w.pnl >= 0 ? '+' : ''}{formatUsd(w.pnl)}
                    </div>
                    <div className="text-[9px] text-muted-foreground">PnL</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-300">{w.trades.toLocaleString()}</div>
                    <div className="text-[9px] text-muted-foreground">Trades</div>
                  </div>
                  <div>
                    <div className="text-sm font-bold text-cyan-300">{w.positions}</div>
                    <div className="text-[9px] text-muted-foreground">Positions</div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3 pt-2 border-t border-cyan-500/10">
                  <span className="text-[9px] text-cyan-400/30">via {w.source}</span>
                  <span className="text-[10px] text-cyan-400 group-hover:text-cyan-300 flex items-center gap-1">
                    SCAN <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ============ PRO WAITLIST ============ */}
        <div className="mb-12 border border-amber-500/30 bg-gradient-to-r from-amber-500/5 to-orange-500/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border-b border-amber-500/20">
            <div className="flex gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500/60" />
              <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
              <div className="w-2 h-2 rounded-full bg-green-500/60" />
            </div>
            <span className="text-amber-400 text-[10px] font-mono ml-1">pro.access --coming-soon</span>
          </div>
          <div className="p-6 md:flex items-center gap-6">
            <div className="flex-1 mb-4 md:mb-0">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-lg">Agent Intelligence Pro</h3>
                <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]">SOON</Badge>
              </div>
              <div className="space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Alpha Feed: auto-detected high-PnL wallets before they go viral
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Telegram/email alerts when followed wallets enter new markets
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  Unlimited wallet follows + AI explanations + CSV exports
                </div>
              </div>
            </div>
            <div className="flex gap-2 max-w-sm w-full">
              <Input
                type="email"
                placeholder="your@email.com"
                value={waitlistEmail}
                onChange={(e) => setWaitlistEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleWaitlist()}
                className="bg-black/40 border-amber-500/30"
              />
              <Button
                onClick={handleWaitlist}
                disabled={waitlistSubmitting}
                className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white shrink-0"
              >
                {waitlistSubmitting ? 'Joining...' : 'Join Waitlist'}
              </Button>
            </div>
          </div>
        </div>

        {/* ============ FREE vs PRO comparison ============ */}
        <div className="mb-12">
          <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto">
            <div className="border border-cyan-500/20 bg-black/40 p-4 font-mono">
              <div className="text-cyan-400 text-xs font-bold mb-3">FREE</div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-cyan-300/70">
                  <div className="w-1.5 h-1.5 bg-green-500" /> Bot detection + 7 signals
                </div>
                <div className="flex items-center gap-2 text-cyan-300/70">
                  <div className="w-1.5 h-1.5 bg-green-500" /> Strategy classification
                </div>
                <div className="flex items-center gap-2 text-cyan-300/70">
                  <div className="w-1.5 h-1.5 bg-green-500" /> Market scanner
                </div>
                <div className="flex items-center gap-2 text-cyan-300/70">
                  <div className="w-1.5 h-1.5 bg-green-500" /> Share score cards
                </div>
                <div className="flex items-center gap-2 text-cyan-300/70">
                  <div className="w-1.5 h-1.5 bg-green-500" /> 3 wallet follows
                </div>
                <div className="flex items-center gap-2 text-cyan-300/40">
                  <Lock className="w-3 h-3" /> AI explanation (login required)
                </div>
              </div>
            </div>
            <div className="border border-amber-500/30 bg-amber-500/5 p-4 font-mono">
              <div className="text-amber-400 text-xs font-bold mb-3 flex items-center gap-1.5">
                <Crown className="w-3 h-3" /> PRO
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> Everything in Free
                </div>
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> Alpha Feed (auto-detected wallets)
                </div>
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> Telegram + email alerts
                </div>
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> Unlimited follows
                </div>
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> Unlimited AI explanations
                </div>
                <div className="flex items-center gap-2 text-amber-300/70">
                  <div className="w-1.5 h-1.5 bg-amber-500" /> CSV export + API access
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============ DIRECTORY (collapsible) ============ */}
        <div className="mb-8">
          <button
            onClick={() => setShowDirectory(!showDirectory)}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
          >
            <Sparkles className="w-5 h-5 text-cyan-500" />
            <span className="font-bold">AI Agent Directory</span>
            <Badge className="text-[10px]">{AGENTIC_PROJECTS.length} projects</Badge>
            <span className="text-xs">{showDirectory ? '(hide)' : '(show)'}</span>
          </button>

          {showDirectory && (
            <>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <PixelSearch size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search projects..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <PixelFilter size={14} className="mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('agenticWorld.categories.all')}</SelectItem>
                    {AGENTIC_CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {t(`agenticWorld.categories.${cat}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Projects Grid */}
              {filteredProjects.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProjects.map((project) => (
                    <AgentCard key={project.id} project={project} />
                  ))}
                </div>
              ) : (
                <Card className="p-12 text-center border-cyan-500/20">
                  <Bot size={48} className="mx-auto mb-4 text-cyan-500/50" />
                  <h3 className="text-lg font-semibold mb-2">{t('agenticWorld.noResults')}</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || selectedCategory !== 'all'
                      ? t('agenticWorld.noResultsFilterHint')
                      : t('agenticWorld.noResultsEmptyHint')}
                  </p>
                </Card>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
