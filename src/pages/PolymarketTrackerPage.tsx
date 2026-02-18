import { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ExternalLink, Wallet, ArrowLeft,
  ScanSearch, ChevronDown, ChevronUp,
  Link2, Search, Sparkles
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { PixelLobster } from '@/components/ui/pixel-icons';
import { polymarketService, type MarketInfo, type MarketHolder, type EventInfo, type PolymarketPosition, type OutcomePriceHistory } from '@/services/polymarket.service';
import { detectBot, type BotDetectionResult, type SignalProgress, type MarketContext, type StrategyType } from '@/services/polymarket-detector';
import { ShareScoreCard } from '@/components/agentic/ShareScoreCard';
import { supabase } from '@/lib/supabase';
import { useScanLimit } from '@/hooks/useScanLimit';
import { toast } from 'sonner';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from 'recharts';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function formatDate(iso: string | null): string {
  if (!iso) return '-';
  const d = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
}

function BotScoreBadge({ score, classification }: { score: number; classification: string }) {
  const colors: Record<string, string> = {
    'bot': 'bg-red-500/15 text-red-400 border-red-500/30',
    'likely-bot': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    'mixed': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    'human': 'bg-green-500/15 text-green-400 border-green-500/30',
  };
  const labels: Record<string, string> = {
    'bot': 'AGENT',
    'likely-bot': 'LIKELY AGENT',
    'mixed': 'MIXED',
    'human': 'HUMAN',
  };
  const isAgent = classification === 'bot' || classification === 'likely-bot';
  return (
    <Badge className={`${colors[classification] || colors.mixed} text-[10px] font-mono flex items-center gap-1`}>
      {isAgent && <PixelLobster size={12} className="shrink-0" />}
      {labels[classification] || 'UNKNOWN'} {score}
    </Badge>
  );
}

function SignalBar({ label, value, maxLabel }: { label: string; value: number; maxLabel?: string }) {
  const color = value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-500' : value >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="text-muted-foreground w-28 shrink-0">{label}</span>
      <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${value}%` }} />
      </div>
      <span className="font-mono w-8 text-right">{value}</span>
      {maxLabel && <span className="text-muted-foreground text-[10px]">{maxLabel}</span>}
    </div>
  );
}

const STRATEGY_STYLES: Record<StrategyType, { border: string; bg: string; text: string }> = {
  MARKET_MAKER: { border: 'border-blue-400/40', bg: 'bg-blue-500/10', text: 'text-blue-400' },
  HYBRID:       { border: 'border-violet-400/40', bg: 'bg-violet-500/10', text: 'text-violet-400' },
  SNIPER:       { border: 'border-red-400/40', bg: 'bg-red-500/10', text: 'text-red-400' },
  MOMENTUM:     { border: 'border-amber-400/40', bg: 'bg-amber-500/10', text: 'text-amber-400' },
  UNCLASSIFIED: { border: 'border-muted', bg: 'bg-muted/30', text: 'text-muted-foreground' },
};

function StrategyTag({ type, label }: { type: StrategyType; label: string }) {
  if (type === 'UNCLASSIFIED') return null;
  const s = STRATEGY_STYLES[type];
  return (
    <Badge className={`${s.border} ${s.bg} ${s.text} text-[9px] font-mono`}>
      {label.toUpperCase()}
    </Badge>
  );
}

export default function PolymarketTrackerPage() {
  const navigate = useNavigate();
  const { canScanMarket, marketScansRemaining, marketScanLimit, consumeMarketScan } = useScanLimit();

  // Market scanner state
  const [marketUrl, setMarketUrl] = useState('');
  const [marketInfo, setMarketInfo] = useState<MarketInfo | null>(null);
  const [marketHolders, setMarketHolders] = useState<(MarketHolder & { bot?: BotDetectionResult })[]>([]);
  const [marketScanning, setMarketScanning] = useState(false);
  const [marketScanProgress, setMarketScanProgress] = useState('');
  const [expandedHolder, setExpandedHolder] = useState<string | null>(null);
  const [liveAnalysis, setLiveAnalysis] = useState<{ address: string; progress: SignalProgress } | null>(null);
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [priceHistory, setPriceHistory] = useState<OutcomePriceHistory[]>([]);
  const [holderPositions, setHolderPositions] = useState<Record<string, PolymarketPosition[]>>({});
  const [loadingPositions, setLoadingPositions] = useState<string | null>(null);
  const [scanLimit, setScanLimit] = useState(50);

  // Scanner mode toggle
  const [scanMode, setScanMode] = useState<'market' | 'wallet'>('market');
  const [walletSearch, setWalletSearch] = useState('');

  const handleMarketScan = async () => {
    if (!canScanMarket) {
      toast.error(`Daily limit: ${marketScanLimit} market scans. Come back tomorrow or upgrade to Pro.`);
      return;
    }

    const slug = polymarketService.parseMarketUrl(marketUrl);
    if (!slug) {
      toast.error('Invalid Polymarket URL. Paste a link like polymarket.com/event/...');
      return;
    }

    consumeMarketScan();
    setMarketScanning(true);
    setMarketInfo(null);
    setMarketHolders([]);
    setExpandedHolder(null);
    setEventInfo(null);
    setPriceHistory([]);
    setHolderPositions({});
    setMarketScanProgress('Looking up market...');

    // Event slug might differ from market slug in sub-market URLs
    const eventSlug = polymarketService.parseEventSlug(marketUrl) || slug;

    // Fetch both market and event data in parallel
    const [info, eventData] = await Promise.all([
      polymarketService.getMarketBySlug(slug),
      polymarketService.getEventBySlug(eventSlug),
    ]);
    if (!info) {
      toast.error('Market not found. Check the URL and try again.');
      setMarketScanning(false);
      setMarketScanProgress('');
      return;
    }

    setMarketInfo(info);
    if (eventData) {
      setEventInfo(eventData);
      // Fetch price history in parallel (don't block scan)
      polymarketService.getEventPriceHistory(eventData.markets).then(setPriceHistory);
    }
    setMarketScanProgress('Fetching holders...');

    const holders = await polymarketService.getMarketHolders(info.conditionId);
    if (holders.length === 0) {
      toast.error('No holders found for this market.');
      setMarketScanning(false);
      setMarketScanProgress('');
      return;
    }

    // Show holders immediately, then scan each for bot behavior
    const holdersWithBot: (MarketHolder & { bot?: BotDetectionResult })[] = holders.map(h => ({ ...h }));
    setMarketHolders(holdersWithBot);

    // Run bot detection on top holders sequentially with live signal streaming
    const toScan = holdersWithBot.slice(0, scanLimit);
    for (let i = 0; i < toScan.length; i++) {
      const addr = toScan[i].address;
      setMarketScanProgress(`Scanning wallet ${i + 1}/${toScan.length}...`);
      setLiveAnalysis({ address: addr, progress: { phase: 'fetching', signals: {} } });
      const ctx: MarketContext = {
        holderAmount: toScan[i].amount,
        totalMarketVolume: info.volume,
      };
      try {
        const result = await detectBot(addr, (p) => {
          setLiveAnalysis({ address: addr, progress: p });
        }, ctx);
        setMarketHolders(prev =>
          prev.map(h =>
            h.address === addr ? { ...h, bot: result } : h
          )
        );
      } catch {
        // Skip failed scans
      }
    }

    setLiveAnalysis(null);
    setMarketScanning(false);
    setMarketScanProgress('');
    toast.success(`Scanned ${toScan.length} holders in "${info.question}"`);

    // Increment scan counter for each holder scanned (fire-and-forget)
    for (let i = 0; i < toScan.length; i++) {
      supabase.rpc('increment_scan_count').catch(() => {});
    }
  };

  const handleViewPositions = async (address: string) => {
    if (holderPositions[address]) {
      // Toggle off
      setHolderPositions(prev => {
        const next = { ...prev };
        delete next[address];
        return next;
      });
      return;
    }
    setLoadingPositions(address);
    try {
      const positions = await polymarketService.getAgentPositions(address);
      setHolderPositions(prev => ({ ...prev, [address]: positions }));
    } catch {
      toast.error('Failed to load positions');
    }
    setLoadingPositions(null);
  };

  const handleWalletXRay = () => {
    const addr = walletSearch.trim().toLowerCase();
    if (!addr || !addr.startsWith('0x')) {
      toast.error('Enter a valid wallet address (0x...)');
      return;
    }
    navigate(`/agentic-world/consensus?wallet=${addr}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Polymarket Agent Radar | DeFi Hub Mexico</title>
        <meta name="description" content="Detect AI agents trading on Polymarket using behavioral analysis" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/agentic-world"
              className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <PixelLobster size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Polymarket Agent Radar</h1>
              <p className="text-muted-foreground">Behavioral analysis of prediction market traders</p>
            </div>
          </div>

        </div>

        {/* Scanner Card with Toggle */}
        <Card className="mb-8 border-cyan-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setScanMode('market')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition-colors ${
                  scanMode === 'market'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                Scan Market
              </button>
              <button
                onClick={() => setScanMode('wallet')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono border transition-colors ${
                  scanMode === 'wallet'
                    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                <Wallet className="w-3.5 h-3.5" />
                Wallet X-Ray
              </button>
            </div>
            {scanMode === 'market' ? (
              <>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Link2 className="w-5 h-5 text-cyan-500" />
                  Scan Market by URL
                </CardTitle>
                <CardDescription>
                  Paste a Polymarket event URL to scan all holders and detect agents
                </CardDescription>
              </>
            ) : (
              <>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-500" />
                  Wallet X-Ray
                </CardTitle>
                <CardDescription>
                  Paste any Polymarket wallet address for a full behavioral scan
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {/* Wallet X-Ray Tab */}
            {scanMode === 'wallet' && (
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  placeholder="0x..."
                  value={walletSearch}
                  onChange={(e) => setWalletSearch(e.target.value)}
                  className="flex-1 font-mono"
                  onKeyDown={(e) => e.key === 'Enter' && handleWalletXRay()}
                />
                <Button
                  onClick={handleWalletXRay}
                  disabled={!walletSearch}
                  className="bg-amber-600 hover:bg-amber-700 shrink-0"
                >
                  <ScanSearch className="w-4 h-4 mr-2" />
                  X-Ray Wallet
                </Button>
              </div>
            )}

            {/* Market Scanner Tab */}
            {scanMode === 'market' && (<>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="https://polymarket.com/event/..."
                value={marketUrl}
                onChange={(e) => setMarketUrl(e.target.value)}
                className="flex-1"
                onKeyDown={(e) => e.key === 'Enter' && !marketScanning && handleMarketScan()}
              />
              <select
                value={scanLimit}
                onChange={(e) => setScanLimit(Number(e.target.value))}
                disabled={marketScanning}
                className="h-9 px-2 rounded-md border bg-background text-sm font-mono shrink-0 text-foreground"
              >
                {[10, 25, 50, 100, 200].map(n => (
                  <option key={n} value={n}>Top {n}</option>
                ))}
              </select>
              <Button
                onClick={handleMarketScan}
                disabled={marketScanning || !marketUrl}
                className="bg-cyan-600 hover:bg-cyan-700 shrink-0"
              >
                <Search className={`w-4 h-4 mr-2 ${marketScanning ? 'animate-pulse' : ''}`} />
                {marketScanning ? 'Scanning...' : 'Scan Market'}
              </Button>
            </div>

            <div className="flex items-center gap-2 mt-2">
              {marketScanProgress && (
                <div className="flex items-center gap-2 text-sm text-cyan-400">
                  <LoadingSpinner size="sm" />
                  {marketScanProgress}
                </div>
              )}
              {!marketScanning && (
                <div className="text-[10px] text-muted-foreground font-mono ml-auto">
                  {marketScansRemaining}/{marketScanLimit} scans remaining today
                </div>
              )}
            </div>

            {/* Live Analysis Terminal */}
            {liveAnalysis && (
              <div className="mt-3 border border-green-500/30 bg-black/80 overflow-hidden font-mono">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border-b border-green-500/20">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-green-400 text-[10px] ml-1">
                    openclaw --analyze {liveAnalysis.address.slice(0, 6)}...{liveAnalysis.address.slice(-4)}
                  </span>
                  <div className="ml-auto w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                </div>
                <div className="px-3 py-2 space-y-1.5">
                  {liveAnalysis.progress.phase === 'fetching' ? (
                    <div className="text-green-400/70 text-[11px] animate-pulse">
                      {'>'} Fetching trades, merges, positions...
                    </div>
                  ) : (
                    <>
                      {liveAnalysis.progress.tradeCount !== undefined && (
                        <div className="text-green-300/40 text-[10px]">
                          {'>'} loaded {liveAnalysis.progress.tradeCount} trades, {liveAnalysis.progress.mergeCount} merges
                        </div>
                      )}
                      {[
                        { key: 'intervalRegularity' as const, name: 'INTERVAL' },
                        { key: 'splitMergeRatio' as const, name: 'SPLIT/MERGE' },
                        { key: 'sizingConsistency' as const, name: 'SIZING' },
                        { key: 'activity24h' as const, name: '24/7' },
                        { key: 'winRateExtreme' as const, name: 'WIN_RATE' },
                        { key: 'marketConcentration' as const, name: 'FOCUS' },
                        { key: 'ghostWhale' as const, name: 'GHOST' },
                      ].map((s) => {
                        const val = liveAnalysis.progress.signals[s.key];
                        const isActive = liveAnalysis.progress.signal === s.name || liveAnalysis.progress.signal === s.name.replace('_', ' ');
                        const isDone = val !== undefined;
                        return (
                          <div key={s.key} className="flex items-center gap-2">
                            <span className={`text-[10px] w-20 shrink-0 ${isDone ? 'text-green-400' : isActive ? 'text-green-400 animate-pulse' : 'text-green-500/20'}`}>
                              {s.name}
                            </span>
                            <div className="flex gap-[2px] flex-1">
                              {Array.from({ length: 20 }).map((_, i) => {
                                const filled = isDone ? Math.round((val / 100) * 20) : 0;
                                const barColor = (val ?? 0) >= 80 ? 'bg-red-500' : (val ?? 0) >= 60 ? 'bg-orange-500' : (val ?? 0) >= 40 ? 'bg-yellow-500' : 'bg-green-500';
                                return (
                                  <div
                                    key={i}
                                    className={`w-1.5 h-2.5 transition-all duration-150 ${i < filled ? barColor : 'bg-green-500/10'}`}
                                    style={{ imageRendering: 'pixelated' }}
                                  />
                                );
                              })}
                            </div>
                            <span className={`text-[10px] w-6 text-right ${isDone ? (val >= 70 ? 'text-red-400' : 'text-green-400') : 'text-green-500/20'}`}>
                              {isDone ? val : '--'}
                            </span>
                          </div>
                        );
                      })}
                      {(liveAnalysis.progress.signals.bothSidesBonus ?? 0) > 0 && (
                        <div className="text-red-400 text-[10px] pt-1 border-t border-green-500/10">
                          {'>'} BOTH_SIDES_BONUS: +{liveAnalysis.progress.signals.bothSidesBonus}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Event Overview Terminal */}
            {eventInfo && eventInfo.markets.length > 0 && (
              <div className="mt-4 border border-cyan-500/30 bg-black/60 overflow-hidden font-mono">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-cyan-400 text-[10px] ml-1">
                    market --overview {eventInfo.markets.length} outcomes
                  </span>
                  <span className="ml-auto text-cyan-400/40 text-[10px]">
                    vol: {formatUSD(eventInfo.volume)} | 24h: {formatUSD(eventInfo.volume24hr)}
                  </span>
                </div>

                {/* Event title + image */}
                <div className="flex items-center gap-3 px-3 py-2.5 border-b border-cyan-500/10">
                  {eventInfo.image && (
                    <img src={eventInfo.image} alt="" className="w-10 h-10 rounded object-cover shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-cyan-300 text-xs truncate">{eventInfo.title}</p>
                    <p className="text-cyan-400/40 text-[10px]">
                      ends {new Date(eventInfo.endDate).toLocaleDateString()} | liq: {formatUSD(eventInfo.liquidity)}
                    </p>
                  </div>
                </div>

                {/* Outcome cards grid */}
                <div className="p-2 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-1.5">
                  {eventInfo.markets
                    .sort((a, b) => b.yesPrice - a.yesPrice)
                    .filter(m => m.yesPrice > 0.005 || m.active)
                    .slice(0, 12)
                    .map((m) => {
                      const pct = Math.round(m.yesPrice * 100);
                      const barColor = pct >= 50 ? 'bg-green-500' : pct >= 10 ? 'bg-yellow-500' : 'bg-red-500/60';
                      const filled = Math.round((pct / 100) * 10);
                      return (
                        <div
                          key={m.conditionId}
                          className={`border px-2 py-1.5 ${
                            m.active
                              ? 'border-cyan-500/20 bg-cyan-500/5'
                              : 'border-cyan-500/10 bg-black/40 opacity-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-cyan-300 text-[11px] truncate flex-1">{m.groupItemTitle}</span>
                            <span className={`text-[11px] font-bold ml-1 ${
                              pct >= 50 ? 'text-green-400' : pct >= 10 ? 'text-yellow-400' : 'text-red-400/60'
                            }`}>
                              {pct}%
                            </span>
                          </div>
                          <div className="flex gap-[1px] mt-1">
                            {Array.from({ length: 10 }).map((_, i) => (
                              <div
                                key={i}
                                className={`flex-1 h-1 ${i < filled ? barColor : 'bg-cyan-500/10'}`}
                                style={{ imageRendering: 'pixelated' as const }}
                              />
                            ))}
                          </div>
                          <div className="flex justify-between mt-1">
                            <span className="text-cyan-400/30 text-[9px]">{formatUSD(m.volume)}</span>
                            {!m.active && <span className="text-red-400/50 text-[9px]">closed</span>}
                          </div>
                        </div>
                      );
                    })}
                </div>

                {/* Show remaining count */}
                {eventInfo.markets.filter(m => m.yesPrice > 0.005 || m.active).length > 12 && (
                  <div className="px-3 py-1 text-cyan-400/30 text-[9px] border-t border-cyan-500/10">
                    {'>'} +{eventInfo.markets.filter(m => m.yesPrice > 0.005 || m.active).length - 12} more outcomes
                  </div>
                )}

                {/* Price history chart */}
                {priceHistory.length > 0 && (() => {
                  const CHART_COLORS = ['#22d3ee', '#a78bfa', '#f59e0b', '#ef4444', '#10b981', '#f472b6'];
                  // Build unified time series: merge all timestamps, then for each timestamp find closest price per outcome
                  const allTimestamps = new Set<number>();
                  priceHistory.forEach(o => o.history.forEach(h => allTimestamps.add(h.t)));
                  const sortedTs = Array.from(allTimestamps).sort((a, b) => a - b);
                  // Sample to ~120 points for performance
                  const step = Math.max(1, Math.floor(sortedTs.length / 120));
                  const sampledTs = sortedTs.filter((_, i) => i % step === 0);

                  const chartData = sampledTs.map(t => {
                    const point: Record<string, number> = { t };
                    priceHistory.forEach(o => {
                      // Find closest price at or before this timestamp
                      let closest = 0;
                      for (const h of o.history) {
                        if (h.t <= t) closest = h.p;
                        else break;
                      }
                      point[o.label] = Math.round(closest * 100);
                    });
                    return point;
                  });

                  return (
                    <div className="border-t border-cyan-500/10 px-2 pt-3 pb-1">
                      <div className="flex flex-wrap gap-x-3 gap-y-1 px-2 mb-2">
                        {priceHistory.map((o, i) => {
                          const lastPrice = o.history[o.history.length - 1]?.p || 0;
                          return (
                            <div key={o.label} className="flex items-center gap-1.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                              <span className="text-cyan-300 text-[10px]">{o.label}</span>
                              <span className="text-cyan-400/50 text-[10px]">{Math.round(lastPrice * 100)}%</span>
                            </div>
                          );
                        })}
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <LineChart data={chartData}>
                          <XAxis
                            dataKey="t"
                            type="number"
                            domain={['dataMin', 'dataMax']}
                            tickFormatter={(t: number) => {
                              const d = new Date(t * 1000);
                              return `${d.getMonth() + 1}/${d.getDate()}`;
                            }}
                            tick={{ fill: '#22d3ee', fontSize: 9, opacity: 0.4 }}
                            axisLine={{ stroke: '#22d3ee', strokeOpacity: 0.1 }}
                            tickLine={false}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickFormatter={(v: number) => `${v}%`}
                            tick={{ fill: '#22d3ee', fontSize: 9, opacity: 0.4 }}
                            axisLine={false}
                            tickLine={false}
                            width={35}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid rgba(34,211,238,0.2)', fontSize: 11, fontFamily: 'monospace' }}
                            labelFormatter={(t: number) => new Date(t * 1000).toLocaleDateString()}
                            formatter={(value: number, name: string) => [`${value}%`, name]}
                          />
                          {priceHistory.map((o, i) => (
                            <Line
                              key={o.label}
                              type="stepAfter"
                              dataKey={o.label}
                              stroke={CHART_COLORS[i % CHART_COLORS.length]}
                              strokeWidth={1.5}
                              dot={false}
                              isAnimationActive={false}
                            />
                          ))}
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Market Holders Results - Terminal Style */}
            {marketHolders.length > 0 && (
              <div className="mt-4 border border-cyan-500/30 bg-black/60 overflow-hidden font-mono">
                {/* Terminal header */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20">
                  <div className="flex gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-500/60" />
                    <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
                    <div className="w-2 h-2 rounded-full bg-green-500/60" />
                  </div>
                  <span className="text-cyan-400 text-[10px] ml-1">
                    holders --top {marketHolders.length}
                  </span>
                  {marketHolders.some(h => h.bot && (h.bot.classification === 'bot' || h.bot.classification === 'likely-bot')) && (
                    <span className="ml-auto text-red-400 text-[10px] flex items-center gap-1">
                      <PixelLobster size={10} />
                      {marketHolders.filter(h => h.bot && (h.bot.classification === 'bot' || h.bot.classification === 'likely-bot')).length} agents detected
                    </span>
                  )}
                </div>

                {/* Desktop table */}
                <div className="hidden md:block">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-cyan-500/15">
                        <th className="text-left px-3 py-2 text-[10px] text-cyan-400/60">{'>'} HOLDER</th>
                        <th className="text-center px-3 py-2 text-[10px] text-cyan-400/60">SIDE</th>
                        <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">AMOUNT</th>
                        <th className="text-center px-3 py-2 text-[10px] text-cyan-400/60">AGENT_SCORE</th>
                        <th className="px-3 py-2 w-6"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketHolders.map((holder, idx) => {
                        const isExp = expandedHolder === holder.address;
                        return (
                          <>
                            <tr
                              key={holder.address}
                              className={`border-b border-cyan-500/10 hover:bg-cyan-500/5 cursor-pointer transition-colors ${
                                holder.bot?.classification === 'bot' ? 'bg-red-500/5' :
                                holder.bot?.classification === 'likely-bot' ? 'bg-orange-500/5' : ''
                              }`}
                              onClick={() => holder.bot && setExpandedHolder(isExp ? null : holder.address)}
                            >
                              <td className="px-3 py-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-cyan-400/40 text-[10px] w-4">{String(idx + 1).padStart(2, '0')}</span>
                                  <div className="flex flex-col">
                                    <span className="text-cyan-300 text-xs">
                                      {holder.pseudonym || `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`}
                                    </span>
                                    {holder.pseudonym && (
                                      <span className="text-cyan-400/30 text-[10px]">
                                        {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className={`text-[10px] px-1.5 py-0.5 border ${
                                  holder.outcome === 'Yes'
                                    ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                    : 'text-red-400 border-red-500/30 bg-red-500/10'
                                }`}>
                                  {holder.outcome}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-right text-xs text-cyan-300">
                                {formatUSD(holder.amount)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                {holder.bot ? (
                                  <div className="flex items-center gap-1.5 justify-center flex-wrap">
                                    <BotScoreBadge score={holder.bot.botScore} classification={holder.bot.classification} />
                                    <StrategyTag type={holder.bot.strategy.type} label={holder.bot.strategy.label} />
                                  </div>
                                ) : marketScanning ? (
                                  <span className="text-cyan-400/40 text-[10px] animate-pulse">scanning...</span>
                                ) : (
                                  <span className="text-cyan-400/20 text-[10px]">--</span>
                                )}
                              </td>
                              <td className="px-3 py-2">
                                {holder.bot && (
                                  isExp ? <ChevronUp className="w-3 h-3 text-cyan-400/40" /> : <ChevronDown className="w-3 h-3 text-cyan-400/40" />
                                )}
                              </td>
                            </tr>
                            {isExp && holder.bot && (
                              <tr key={`${holder.address}-signals`}>
                                <td colSpan={5} className="p-0">
                                  <div className="bg-black/40 px-4 py-3 border-b border-cyan-500/10 space-y-1.5">
                                    <div className="text-cyan-400/40 text-[10px] mb-2">
                                      {'>'} {holder.bot.tradeCount} trades | {holder.bot.mergeCount} merges | {holder.bot.activeHours}/24h | {holder.bot.bothSidesPercent}% both-sides
                                    </div>
                                    {[
                                      { name: 'INTERVAL', weight: '20%', val: holder.bot.signals.intervalRegularity },
                                      { name: 'SPLIT/MERGE', weight: '25%', val: holder.bot.signals.splitMergeRatio },
                                      { name: 'SIZING', weight: '15%', val: holder.bot.signals.sizingConsistency },
                                      { name: '24/7', weight: '15%', val: holder.bot.signals.activity24h },
                                      { name: 'WIN_RATE', weight: '15%', val: holder.bot.signals.winRateExtreme },
                                      { name: 'FOCUS', weight: '10%', val: holder.bot.signals.marketConcentration },
                                      ...(holder.bot.signals.ghostWhale > 0 ? [{ name: 'GHOST', weight: '50%', val: holder.bot.signals.ghostWhale }] : []),
                                    ].map((s) => {
                                      const barColor = s.val >= 80 ? 'bg-red-500' : s.val >= 60 ? 'bg-orange-500' : s.val >= 40 ? 'bg-yellow-500' : 'bg-green-500';
                                      const filled = Math.round((s.val / 100) * 16);
                                      return (
                                        <div key={s.name} className="flex items-center gap-2">
                                          <span className="text-cyan-400 text-[10px] w-20 shrink-0">{s.name}</span>
                                          <div className="flex gap-[2px] flex-1">
                                            {Array.from({ length: 16 }).map((_, i) => (
                                              <div
                                                key={i}
                                                className={`w-1.5 h-2 ${i < filled ? barColor : 'bg-cyan-500/10'}`}
                                                style={{ imageRendering: 'pixelated' }}
                                              />
                                            ))}
                                          </div>
                                          <span className={`text-[10px] w-6 text-right ${s.val >= 70 ? 'text-red-400' : 'text-cyan-400'}`}>
                                            {s.val}
                                          </span>
                                          <span className="text-cyan-400/20 text-[9px] w-6">{s.weight}</span>
                                        </div>
                                      );
                                    })}
                                    {holder.bot.signals.bothSidesBonus > 0 && (
                                      <div className="text-red-400 text-[10px] pt-1 border-t border-cyan-500/10">
                                        {'>'} BOTH_SIDES_BONUS: +{holder.bot.signals.bothSidesBonus}
                                      </div>
                                    )}

                                    {/* Strategy classification */}
                                    {holder.bot.strategy.confidence > 0 && (
                                      <div className="pt-1.5 border-t border-cyan-500/10 space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className={`text-[10px] font-bold ${STRATEGY_STYLES[holder.bot.strategy.type].text}`}>
                                            {'>'} {holder.bot.strategy.label.toUpperCase()}
                                          </span>
                                          <span className="text-cyan-400/30 text-[9px]">{holder.bot.strategy.confidence}%</span>
                                        </div>
                                        <div className="text-cyan-400/40 text-[9px]">{holder.bot.strategy.description}</div>
                                        <div className="flex gap-3 text-[8px] text-cyan-400/25">
                                          <span>ROI:{holder.bot.strategy.avgROI}%</span>
                                          <span>sizeCV:{holder.bot.strategy.sizeCV}</span>
                                          <span>bias:{holder.bot.strategy.directionalBias}%</span>
                                          {holder.bot.strategy.bimodal && <span className="text-violet-400/50">BIMODAL</span>}
                                        </div>
                                      </div>
                                    )}

                                    {/* View Positions button */}
                                    <div className="pt-2 border-t border-cyan-500/10 flex items-center gap-2">
                                      <button
                                        className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                                        onClick={(e) => { e.stopPropagation(); handleViewPositions(holder.address); }}
                                      >
                                        <Wallet className="w-3 h-3" />
                                        {holderPositions[holder.address] ? 'HIDE POSITIONS' : 'VIEW POSITIONS'}
                                      </button>
                                      {loadingPositions === holder.address && (
                                        <span className="text-cyan-400/40 text-[10px] animate-pulse">loading...</span>
                                      )}
                                      <span onClick={(e) => e.stopPropagation()}>
                                        <ShareScoreCard
                                          address={holder.address}
                                          pseudonym={holder.pseudonym}
                                          botScore={holder.bot.botScore}
                                          classification={holder.bot.classification}
                                          signals={holder.bot.signals}
                                          tradeCount={holder.bot.tradeCount}
                                        />
                                      </span>
                                      <div className="relative group/analyzer">
                                        <div className="absolute -inset-[1px] rounded-sm bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 opacity-60 blur-[2px] group-hover/analyzer:opacity-100 transition-opacity" style={{ animation: 'glow-spin 3s ease-in-out infinite' }} />
                                        <button
                                          className="relative text-[10px] px-3 py-1.5 bg-gradient-to-r from-amber-900/90 to-amber-800/90 border border-amber-400/60 text-amber-300 hover:text-amber-100 flex items-center gap-1.5 transition-all font-bold tracking-wide hover:scale-[1.02]"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/agentic-world/consensus?wallet=${holder.address}${marketInfo?.conditionId ? `&market=${marketInfo.conditionId}` : ''}`);
                                          }}
                                        >
                                          <Sparkles className="w-3 h-3" />
                                          ACTIVATE DeFi MEXICO ANALYZER
                                        </button>
                                      </div>
                                      <a
                                        href={`https://polymarket.com/portfolio/${holder.address}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] text-cyan-400/40 hover:text-cyan-400 flex items-center gap-1 ml-auto transition-colors"
                                        onClick={(e) => e.stopPropagation()}
                                      >
                                        <ExternalLink className="w-3 h-3" /> polymarket.com
                                      </a>
                                    </div>

                                    {/* Positions list */}
                                    {holderPositions[holder.address] && (
                                      <div className="mt-2 space-y-1">
                                        <div className="text-cyan-400/40 text-[10px]">
                                          {'>'} {holderPositions[holder.address].length} open positions
                                        </div>
                                        {holderPositions[holder.address].slice(0, 15).map((pos, pi) => {
                                          const pnlColor = pos.cashPnl > 0 ? 'text-green-400' : pos.cashPnl < 0 ? 'text-red-400' : 'text-cyan-400/40';
                                          return (
                                            <div key={pi} className="flex items-center gap-2 text-[10px]">
                                              <span className="text-cyan-400/30 w-3">{String(pi + 1).padStart(2, '0')}</span>
                                              <span className={`px-1 py-0.5 border text-[9px] ${
                                                pos.outcome === 'Yes'
                                                  ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                                  : 'text-red-400 border-red-500/30 bg-red-500/10'
                                              }`}>
                                                {pos.outcome}
                                              </span>
                                              <span className="text-cyan-300 truncate flex-1" title={pos.title}>{pos.title}</span>
                                              <span className="text-cyan-400 shrink-0">{formatUSD(pos.currentValue)}</span>
                                              <span className={`${pnlColor} shrink-0 w-16 text-right`}>
                                                {pos.cashPnl > 0 ? '+' : ''}{formatUSD(pos.cashPnl)}
                                              </span>
                                            </div>
                                          );
                                        })}
                                        {holderPositions[holder.address].length > 15 && (
                                          <div className="text-cyan-400/30 text-[9px]">
                                            {'>'} +{holderPositions[holder.address].length - 15} more positions
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            )}
                          </>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="md:hidden divide-y divide-cyan-500/10">
                  {marketHolders.map((holder, idx) => {
                    const isExp = expandedHolder === holder.address;
                    return (
                      <div
                        key={holder.address}
                        className={`px-3 py-2.5 ${
                          holder.bot?.classification === 'bot' ? 'bg-red-500/5' :
                          holder.bot?.classification === 'likely-bot' ? 'bg-orange-500/5' : ''
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2">
                            <span className="text-cyan-400/40 text-[10px]">{String(idx + 1).padStart(2, '0')}</span>
                            <div>
                              <p className="text-cyan-300 text-xs">
                                {holder.pseudonym || `${holder.address.slice(0, 6)}...${holder.address.slice(-4)}`}
                              </p>
                              {holder.pseudonym && (
                                <p className="text-cyan-400/30 text-[10px]">
                                  {holder.address.slice(0, 6)}...{holder.address.slice(-4)}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-[10px] px-1.5 py-0.5 border ${
                              holder.outcome === 'Yes'
                                ? 'text-green-400 border-green-500/30 bg-green-500/10'
                                : 'text-red-400 border-red-500/30 bg-red-500/10'
                            }`}>
                              {holder.outcome}
                            </span>
                            {holder.bot && <BotScoreBadge score={holder.bot.botScore} classification={holder.bot.classification} />}
                            {holder.bot && <StrategyTag type={holder.bot.strategy.type} label={holder.bot.strategy.label} />}
                          </div>
                        </div>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-cyan-300 text-xs">{formatUSD(holder.amount)}</span>
                          {holder.bot && !marketScanning && (
                            <button
                              className="flex items-center gap-1 text-[10px] text-cyan-400/40"
                              onClick={() => setExpandedHolder(isExp ? null : holder.address)}
                            >
                              signals
                              {isExp ? <ChevronUp className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                            </button>
                          )}
                          {!holder.bot && marketScanning && (
                            <span className="text-cyan-400/40 text-[10px] animate-pulse">scanning...</span>
                          )}
                        </div>
                        {isExp && holder.bot && (
                          <div className="mt-2 pt-2 border-t border-cyan-500/10 space-y-1">
                            {[
                              { name: 'INTERVAL', val: holder.bot.signals.intervalRegularity },
                              { name: 'SPLIT/MERGE', val: holder.bot.signals.splitMergeRatio },
                              { name: 'SIZING', val: holder.bot.signals.sizingConsistency },
                              { name: '24/7', val: holder.bot.signals.activity24h },
                              { name: 'WIN_RATE', val: holder.bot.signals.winRateExtreme },
                              { name: 'FOCUS', val: holder.bot.signals.marketConcentration },
                              ...(holder.bot.signals.ghostWhale > 0 ? [{ name: 'GHOST', val: holder.bot.signals.ghostWhale }] : []),
                            ].map((s) => {
                              const barColor = s.val >= 80 ? 'bg-red-500' : s.val >= 60 ? 'bg-orange-500' : s.val >= 40 ? 'bg-yellow-500' : 'bg-green-500';
                              const filled = Math.round((s.val / 100) * 12);
                              return (
                                <div key={s.name} className="flex items-center gap-2">
                                  <span className="text-cyan-400 text-[10px] w-16 shrink-0">{s.name}</span>
                                  <div className="flex gap-[2px] flex-1">
                                    {Array.from({ length: 12 }).map((_, i) => (
                                      <div
                                        key={i}
                                        className={`w-1.5 h-2 ${i < filled ? barColor : 'bg-cyan-500/10'}`}
                                        style={{ imageRendering: 'pixelated' }}
                                      />
                                    ))}
                                  </div>
                                  <span className={`text-[10px] w-5 text-right ${s.val >= 70 ? 'text-red-400' : 'text-cyan-400'}`}>
                                    {s.val}
                                  </span>
                                </div>
                              );
                            })}
                            {holder.bot.signals.bothSidesBonus > 0 && (
                              <div className="text-red-400 text-[10px] pt-1 border-t border-cyan-500/10">
                                {'>'} BONUS: +{holder.bot.signals.bothSidesBonus}
                              </div>
                            )}

                            {/* View Positions - Mobile */}
                            <div className="pt-2 border-t border-cyan-500/10 flex flex-wrap items-center gap-2">
                              <button
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                                onClick={(e) => { e.stopPropagation(); handleViewPositions(holder.address); }}
                              >
                                <Wallet className="w-3 h-3" />
                                {holderPositions[holder.address] ? 'HIDE' : 'POSITIONS'}
                              </button>
                              {loadingPositions === holder.address && (
                                <span className="text-cyan-400/40 text-[10px] animate-pulse">loading...</span>
                              )}
                              <ShareScoreCard
                                address={holder.address}
                                pseudonym={holder.pseudonym}
                                botScore={holder.bot.botScore}
                                classification={holder.bot.classification}
                                signals={holder.bot.signals}
                                tradeCount={holder.bot.tradeCount}
                              />
                              <div className="relative group/analyzer">
                                <div className="absolute -inset-[1px] rounded-sm bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-500 opacity-60 blur-[2px] group-hover/analyzer:opacity-100 transition-opacity" style={{ animation: 'glow-spin 3s ease-in-out infinite' }} />
                                <button
                                  className="relative text-[10px] px-2.5 py-1.5 bg-gradient-to-r from-amber-900/90 to-amber-800/90 border border-amber-400/60 text-amber-300 hover:text-amber-100 flex items-center gap-1.5 transition-all font-bold"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/agentic-world/consensus?wallet=${holder.address}${marketInfo?.conditionId ? `&market=${marketInfo.conditionId}` : ''}`);
                                  }}
                                >
                                  <Sparkles className="w-3 h-3" />
                                  ANALYZER
                                </button>
                              </div>
                              <a
                                href={`https://polymarket.com/portfolio/${holder.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[10px] text-cyan-400/40 hover:text-cyan-400 flex items-center gap-1 ml-auto"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            </div>

                            {holderPositions[holder.address] && (
                              <div className="mt-1.5 space-y-1">
                                {holderPositions[holder.address].slice(0, 10).map((pos, pi) => {
                                  const pnlColor = pos.cashPnl > 0 ? 'text-green-400' : pos.cashPnl < 0 ? 'text-red-400' : 'text-cyan-400/40';
                                  return (
                                    <div key={pi} className="flex items-center gap-1.5 text-[10px]">
                                      <span className={`px-1 border text-[9px] ${
                                        pos.outcome === 'Yes'
                                          ? 'text-green-400 border-green-500/30'
                                          : 'text-red-400 border-red-500/30'
                                      }`}>
                                        {pos.outcome}
                                      </span>
                                      <span className="text-cyan-300 truncate flex-1">{pos.title}</span>
                                      <span className={`${pnlColor} shrink-0`}>
                                        {pos.cashPnl > 0 ? '+' : ''}{formatUSD(pos.cashPnl)}
                                      </span>
                                    </div>
                                  );
                                })}
                                {holderPositions[holder.address].length > 10 && (
                                  <div className="text-cyan-400/30 text-[9px]">
                                    +{holderPositions[holder.address].length - 10} more
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Terminal footer */}
                <div className="px-3 py-1.5 border-t border-cyan-500/15 text-cyan-400/30 text-[9px]">
                  {'>'} {marketHolders.length} holders loaded | all scanned for agent behavior
                </div>
              </div>
            )}
            </>)}
          </CardContent>
        </Card>

        {/* Methodology Section */}
        <div className="mt-8 rounded-lg border border-green-500/30 bg-black/60 overflow-hidden" style={{ imageRendering: 'auto' }}>
          {/* Terminal header */}
          <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 border-b border-green-500/20">
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
            </div>
            <span className="text-green-400 text-xs font-mono ml-2 flex items-center gap-2">
              <PixelLobster size={14} className="text-green-400" />
              openclaw --methodology
            </span>
          </div>

          <div className="p-4 md:p-6 font-mono text-sm space-y-5">
            {/* How it works */}
            <div>
              <div className="text-green-400 text-xs mb-2">{'>'} SYSTEM.OVERVIEW</div>
              <p className="text-green-300/70 text-xs leading-relaxed">
                OpenClaw reads on-chain behavior from Polymarket's public API:
                500 trades, 500 merges, 200 positions per wallet.
                Seven signals run through a weighted model. Ghost Whale mode activates
                for wallets with no trade history but large positions. Final score: 0 to 100.
              </p>
            </div>

            {/* Signal weights as pixel bars */}
            <div>
              <div className="text-green-400 text-xs mb-3">{'>'} SIGNAL.WEIGHTS</div>
              <div className="space-y-3">
                {[
                  { name: 'SPLIT/MERGE', weight: 25, blocks: 5, desc: 'Merge/redeem ratio. Arbitrage bots split and recombine conditional tokens.' },
                  { name: 'INTERVAL', weight: 20, blocks: 4, desc: 'Trade timing regularity. Sub-30s avg = machine speed.' },
                  { name: 'SIZING', weight: 15, blocks: 3, desc: 'Position size variance. Identical orders = automated.' },
                  { name: '24/7 ACTIVE', weight: 15, blocks: 3, desc: '22+ UTC hours covered = never sleeps.' },
                  { name: 'WIN RATE', weight: 15, blocks: 3, desc: '85%+ win rate = algorithmic edge.' },
                  { name: 'FOCUS', weight: 10, blocks: 2, desc: 'Category concentration. Bots specialize in one vertical.' },
                  { name: 'GHOST', weight: 50, blocks: 10, desc: 'No trade history but large positions. Alternate weighting mode activates.' },
                ].map((s) => (
                  <div key={s.name}>
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-[10px] w-24 shrink-0">{s.name}</span>
                      <div className="flex gap-[2px]">
                        {Array.from({ length: 10 }).map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 ${i < s.blocks ? 'bg-green-500' : 'bg-green-500/15'}`}
                            style={{ imageRendering: 'pixelated' }}
                          />
                        ))}
                      </div>
                      <span className="text-green-300/50 text-[10px] ml-1">{s.weight}%</span>
                    </div>
                    <div className="text-green-300/40 text-[10px] ml-[6.5rem] mt-0.5">{s.desc}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Both-sides bonus */}
            <div>
              <div className="text-red-400 text-xs mb-2">{'>'} BONUS.BOTH_SIDES</div>
              <div className="flex flex-wrap gap-2 text-[10px]">
                <span className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400">{'>'}10% = +8pts</span>
                <span className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400">{'>'}30% = +15pts</span>
                <span className="px-2 py-1 bg-red-500/15 border border-red-500/30 text-red-400">{'>'}50% = +20pts</span>
              </div>
              <div className="text-green-300/40 text-[10px] mt-1">YES + NO on same market = market-making / arb signal</div>
            </div>

            {/* Classification tiers as pixel blocks */}
            <div>
              <div className="text-green-400 text-xs mb-3">{'>'} CLASSIFICATION</div>
              <div className="grid grid-cols-4 gap-1">
                <div className="p-2 border border-green-500/30 bg-green-500/5 text-center">
                  <div className="text-green-400 font-bold text-sm">0-39</div>
                  <div className="flex justify-center mt-1 gap-[1px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-green-500" style={{ imageRendering: 'pixelated' }} />
                    ))}
                  </div>
                  <div className="text-green-300/50 text-[9px] mt-1">HUMAN</div>
                </div>
                <div className="p-2 border border-yellow-500/30 bg-yellow-500/5 text-center">
                  <div className="text-yellow-400 font-bold text-sm">40-59</div>
                  <div className="flex justify-center mt-1 gap-[1px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-yellow-500" style={{ imageRendering: 'pixelated' }} />
                    ))}
                  </div>
                  <div className="text-yellow-300/50 text-[9px] mt-1">MIXED</div>
                </div>
                <div className="p-2 border border-orange-500/30 bg-orange-500/5 text-center">
                  <div className="text-orange-400 font-bold text-sm">60-79</div>
                  <div className="flex justify-center mt-1 gap-[1px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-orange-500" style={{ imageRendering: 'pixelated' }} />
                    ))}
                  </div>
                  <div className="text-orange-300/50 text-[9px] mt-1">LIKELY</div>
                </div>
                <div className="p-2 border border-red-500/30 bg-red-500/5 text-center">
                  <div className="text-red-400 font-bold text-sm flex items-center justify-center gap-1">
                    <PixelLobster size={12} /> 80+
                  </div>
                  <div className="flex justify-center mt-1 gap-[1px]">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-1.5 h-1.5 bg-red-500" style={{ imageRendering: 'pixelated' }} />
                    ))}
                  </div>
                  <div className="text-red-300/50 text-[9px] mt-1">AGENT</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="text-green-300/30 text-[10px] pt-2 border-t border-green-500/10">
              src: polymarket data-api + gamma-api | runs client-side | no data stored
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="mt-4 border border-red-500/30 bg-red-500/5 px-4 py-3">
          <p className="text-red-400 text-[11px] font-mono text-center leading-relaxed">
            This is NOT investment advice. All data is for educational and research purposes only. You are solely responsible for your own trading decisions. Past performance does not guarantee future results. Trade at your own risk.
          </p>
        </div>
      </div>

      {/* Glow animation for ANALYZER buttons */}
      <style>{`
        @keyframes glow-spin {
          0% { filter: hue-rotate(0deg) blur(2px); }
          50% { filter: hue-rotate(15deg) blur(3px); }
          100% { filter: hue-rotate(0deg) blur(2px); }
        }
      `}</style>
    </div>
  );
}
