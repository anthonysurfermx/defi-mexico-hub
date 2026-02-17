import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogTrigger, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Bot, TrendingUp, TrendingDown, ExternalLink,
  RefreshCw, Plus, Trash2, Wallet, ArrowLeft,
  DollarSign, ScanSearch, ChevronDown, ChevronUp
} from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { polymarketService, type PolymarketAgent, type AgentMetrics } from '@/services/polymarket.service';
import { detectBot, type BotDetectionResult } from '@/services/polymarket-detector';
import { toast } from 'sonner';

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
    'bot': 'BOT',
    'likely-bot': 'LIKELY BOT',
    'mixed': 'MIXED',
    'human': 'HUMAN',
  };
  return (
    <Badge className={`${colors[classification] || colors.mixed} text-[10px] font-mono`}>
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

export default function PolymarketTrackerPage() {
  const [agents, setAgents] = useState<PolymarketAgent[]>([]);
  const [metrics, setMetrics] = useState<Record<string, AgentMetrics>>({});
  const [botResults, setBotResults] = useState<Record<string, BotDetectionResult>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const [newName, setNewName] = useState('');
  const [newAddr, setNewAddr] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const loadAgents = () => {
    const list = polymarketService.getAgents();
    setAgents(list);
    return list;
  };

  const fetchMetrics = async (agentList: PolymarketAgent[]) => {
    setRefreshing(true);
    const newMetrics: Record<string, AgentMetrics> = {};

    await Promise.all(
      agentList.map(async (agent) => {
        const m = await polymarketService.getAgentMetrics(agent.address);
        newMetrics[agent.address] = m;
      })
    );

    setMetrics(newMetrics);
    setRefreshing(false);
    setLoading(false);
  };

  const runBotDetection = async (agentList: PolymarketAgent[]) => {
    setScanning(true);
    const results: Record<string, BotDetectionResult> = {};

    // Run sequentially to avoid rate limiting
    for (const agent of agentList) {
      try {
        const result = await detectBot(agent.address);
        results[agent.address] = result;
        setBotResults(prev => ({ ...prev, [agent.address]: result }));
      } catch {
        // Skip failed detections
      }
    }

    setBotResults(results);
    setScanning(false);
  };

  useEffect(() => {
    const list = loadAgents();
    fetchMetrics(list);
  }, []);

  const handleRefresh = () => {
    fetchMetrics(agents);
  };

  const handleScan = () => {
    runBotDetection(agents);
  };

  const handleAddAgent = () => {
    if (!newAddr || !newName) {
      toast.error('Address and Name are required');
      return;
    }

    polymarketService.addAgent({
      address: newAddr.toLowerCase(),
      name: newName,
      description: newDesc,
    });

    toast.success('Agent added successfully');
    setIsAddOpen(false);
    setNewAddr('');
    setNewName('');
    setNewDesc('');

    const list = loadAgents();
    fetchMetrics(list);
  };

  const handleRemove = (address: string) => {
    polymarketService.removeAgent(address);
    const list = loadAgents();
    setAgents(list);
    const newMetrics = { ...metrics };
    delete newMetrics[address];
    setMetrics(newMetrics);
    const newBotResults = { ...botResults };
    delete newBotResults[address];
    setBotResults(newBotResults);
    toast.success('Agent removed');
  };

  const totalPortfolio = Object.values(metrics).reduce(
    (acc, m) => acc + (m?.portfolioValue || 0), 0
  );
  const totalVolume = Object.values(metrics).reduce(
    (acc, m) => acc + (m?.volumeTraded || 0), 0
  );
  const botsDetected = Object.values(botResults).filter(
    r => r.classification === 'bot' || r.classification === 'likely-bot'
  ).length;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Polymarket Bot Detector | DeFi Hub Mexico</title>
        <meta name="description" content="Detect AI agents and bots trading on Polymarket using behavioral analysis" />
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
              <ScanSearch size={28} className="text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">Polymarket Bot Detector</h1>
              <p className="text-muted-foreground">Behavioral analysis of prediction market traders</p>
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="default"
              onClick={handleScan}
              disabled={scanning || loading}
              className="bg-red-600 hover:bg-red-700"
            >
              <ScanSearch className={`w-4 h-4 mr-2 ${scanning ? 'animate-pulse' : ''}`} />
              {scanning ? 'Scanning...' : 'Run Bot Scan'}
            </Button>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <Plus className="w-4 h-4 mr-2" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Track New Wallet</DialogTitle>
                  <DialogDescription>
                    Enter the proxy wallet address of the trader you want to analyze on Polymarket.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label>Name / Alias</Label>
                    <Input placeholder="e.g. Suspicious Bot" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Proxy Wallet Address (0x...)</Label>
                    <Input placeholder="0x123..." value={newAddr} onChange={(e) => setNewAddr(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Notes (Optional)</Label>
                    <Input placeholder="Strategy notes..." value={newDesc} onChange={(e) => setNewDesc(e.target.value)} />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleAddAgent}>Add Wallet</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tracked</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bot className="w-5 h-5 text-blue-500" />
                {agents.length}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Bots Detected</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <ScanSearch className="w-5 h-5 text-red-500" />
                {Object.keys(botResults).length > 0 ? botsDetected : '-'}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Portfolio</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                {loading ? '...' : formatUSD(totalPortfolio)}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Volume (100 trades)</CardDescription>
              <CardTitle className="text-2xl">
                {loading ? '...' : formatUSD(totalVolume)}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Desktop Table */}
        <Card className="overflow-hidden hidden md:block">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="text-left p-4 font-medium text-muted-foreground">Agent</th>
                  <th className="text-center p-4 font-medium text-muted-foreground">Bot Score</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Portfolio</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Positions</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Volume</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">PnL</th>
                  <th className="text-right p-4 font-medium text-muted-foreground">Last Active</th>
                  <th className="p-4 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center">
                      <LoadingSpinner size="lg" className="mx-auto" />
                    </td>
                  </tr>
                ) : agents.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-muted-foreground">
                      No wallets tracked yet. Add one to start.
                    </td>
                  </tr>
                ) : (
                  agents.map((agent) => {
                    const m = metrics[agent.address];
                    const bot = botResults[agent.address];
                    const isExpanded = expandedAgent === agent.address;

                    return (
                      <>
                        <tr
                          key={agent.address}
                          className={`border-b hover:bg-muted/20 cursor-pointer ${bot ? '' : ''}`}
                          onClick={() => bot && setExpandedAgent(isExpanded ? null : agent.address)}
                        >
                          <td className="p-4">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{agent.name}</span>
                                {agent.tags?.map((tag) => (
                                  <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
                                ))}
                                {bot && (
                                  <button className="inline-flex items-center text-muted-foreground">
                                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                                  </button>
                                )}
                              </div>
                              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1">
                                <Wallet className="w-3 h-3" />
                                {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
                              </span>
                              {m?.pseudonym && (
                                <span className="text-xs text-muted-foreground">@{m.pseudonym}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-center">
                            {scanning && !bot ? (
                              <LoadingSpinner size="sm" className="mx-auto" />
                            ) : bot ? (
                              <BotScoreBadge score={bot.botScore} classification={bot.classification} />
                            ) : (
                              <span className="text-muted-foreground text-xs">Not scanned</span>
                            )}
                          </td>
                          <td className="p-4 text-right font-mono">
                            {m ? formatUSD(m.portfolioValue) : '-'}
                          </td>
                          <td className="p-4 text-right font-mono">
                            {m ? m.openPositions : '-'}
                          </td>
                          <td className="p-4 text-right font-mono">
                            {m ? formatUSD(m.volumeTraded) : '-'}
                          </td>
                          <td className="p-4 text-right font-mono">
                            {m?.profitPnL != null ? (
                              <span className={`flex items-center justify-end gap-1 ${m.profitPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {m.profitPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                {m.profitPnL >= 0 ? '+' : ''}{formatUSD(Math.abs(m.profitPnL))}
                              </span>
                            ) : (
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="text-sm">{formatDate(m?.lastActive ?? null)}</div>
                            {m?.lastTradeTitle && (
                              <div className="text-xs text-muted-foreground truncate max-w-[160px] ml-auto">
                                {m.lastTradeTitle}
                              </div>
                            )}
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                              <a
                                href={`https://polymarket.com/profile/${agent.address}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 hover:bg-muted rounded-md text-muted-foreground hover:text-foreground"
                                title="View on Polymarket"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => handleRemove(agent.address)}
                                className="p-2 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500"
                                title="Remove"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Expanded Signal Breakdown */}
                        {isExpanded && bot && (
                          <tr key={`${agent.address}-signals`}>
                            <td colSpan={8} className="p-0">
                              <div className="bg-muted/30 px-6 py-4 border-b space-y-2">
                                <div className="flex items-center gap-2 mb-3">
                                  <ScanSearch className="w-4 h-4 text-muted-foreground" />
                                  <span className="text-sm font-medium">Signal Breakdown</span>
                                  <span className="text-xs text-muted-foreground ml-auto">
                                    {bot.tradeCount} trades analyzed | {bot.mergeCount} merges | {bot.activeHours}/24 hours active | {bot.bothSidesPercent}% both-sides
                                  </span>
                                </div>
                                <SignalBar label="Interval (20%)" value={bot.signals.intervalRegularity} />
                                <SignalBar label="SPLIT/MERGE (25%)" value={bot.signals.splitMergeRatio} />
                                <SignalBar label="Sizing (15%)" value={bot.signals.sizingConsistency} />
                                <SignalBar label="24/7 Activity (15%)" value={bot.signals.activity24h} />
                                <SignalBar label="Win Rate (15%)" value={bot.signals.winRateExtreme} />
                                <SignalBar label="Concentration (10%)" value={bot.signals.marketConcentration} />
                                {bot.signals.bothSidesBonus > 0 && (
                                  <div className="flex items-center gap-2 text-xs pt-1 border-t border-muted">
                                    <span className="text-red-400 w-28 shrink-0">Both-Sides Bonus</span>
                                    <span className="font-mono text-red-400">+{bot.signals.bothSidesBonus}</span>
                                    <span className="text-muted-foreground">({bot.bothSidesPercent}% positions on both YES/NO)</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {loading ? (
            <div className="p-8 text-center">
              <LoadingSpinner size="lg" className="mx-auto" />
            </div>
          ) : agents.length === 0 ? (
            <Card className="p-8 text-center text-muted-foreground">
              No wallets tracked yet. Add one to start.
            </Card>
          ) : (
            agents.map((agent) => {
              const m = metrics[agent.address];
              const bot = botResults[agent.address];
              const isExpanded = expandedAgent === agent.address;

              return (
                <Card key={agent.address}>
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                          {agent.name}
                          {bot && <BotScoreBadge score={bot.botScore} classification={bot.classification} />}
                        </CardTitle>
                        <CardDescription className="font-mono text-xs flex items-center gap-1 mt-1">
                          <Wallet className="w-3 h-3" />
                          {agent.address.slice(0, 6)}...{agent.address.slice(-4)}
                        </CardDescription>
                        {m?.pseudonym && (
                          <span className="text-xs text-muted-foreground">@{m.pseudonym}</span>
                        )}
                      </div>
                      <div className="flex gap-1">
                        <a
                          href={`https://polymarket.com/profile/${agent.address}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-muted rounded-md text-muted-foreground"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => handleRemove(agent.address)}
                          className="p-2 hover:bg-red-500/10 rounded-md text-muted-foreground hover:text-red-500"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">Portfolio</span>
                        <p className="font-mono font-semibold">{m ? formatUSD(m.portfolioValue) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Positions</span>
                        <p className="font-mono font-semibold">{m?.openPositions ?? '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Volume</span>
                        <p className="font-mono">{m ? formatUSD(m.volumeTraded) : '-'}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">PnL</span>
                        {m?.profitPnL != null ? (
                          <p className={`font-mono flex items-center gap-1 ${m.profitPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {m.profitPnL >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {m.profitPnL >= 0 ? '+' : ''}{formatUSD(Math.abs(m.profitPnL))}
                          </p>
                        ) : (
                          <p className="text-muted-foreground text-xs">N/A</p>
                        )}
                      </div>
                    </div>

                    {/* Mobile signal breakdown */}
                    {bot && (
                      <div className="mt-3 pt-3 border-t">
                        <button
                          className="flex items-center gap-2 text-xs text-muted-foreground w-full"
                          onClick={() => setExpandedAgent(isExpanded ? null : agent.address)}
                        >
                          <ScanSearch className="w-3 h-3" />
                          <span>Signal breakdown</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3 ml-auto" /> : <ChevronDown className="w-3 h-3 ml-auto" />}
                        </button>
                        {isExpanded && (
                          <div className="mt-2 space-y-1.5">
                            <SignalBar label="Interval" value={bot.signals.intervalRegularity} />
                            <SignalBar label="SPLIT/MERGE" value={bot.signals.splitMergeRatio} />
                            <SignalBar label="Sizing" value={bot.signals.sizingConsistency} />
                            <SignalBar label="24/7 Activity" value={bot.signals.activity24h} />
                            <SignalBar label="Win Rate" value={bot.signals.winRateExtreme} />
                            <SignalBar label="Concentration" value={bot.signals.marketConcentration} />
                            {bot.signals.bothSidesBonus > 0 && (
                              <div className="text-xs text-red-400 pt-1 border-t border-muted">
                                Both-Sides Bonus: +{bot.signals.bothSidesBonus} ({bot.bothSidesPercent}%)
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-3 pt-3 border-t text-xs text-muted-foreground">
                      <span>Last active: {formatDate(m?.lastActive ?? null)}</span>
                      {m?.lastTradeTitle && (
                        <p className="truncate mt-0.5">{m.lastTradeTitle}</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
