// src/pages/ConsensusPage.tsx - Wallet X-Ray Analyzer
import { useState, useEffect, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ExternalLink, TrendingUp, TrendingDown } from 'lucide-react';
import { PixelTarget, PixelLobster } from '@/components/ui/pixel-icons';
import { ScrambleText } from '@/components/agentic/ScrambleText';
import { AIInsightsTerminal } from '@/components/agentic/AIInsightsTerminal';
import { polymarketService, type AgentMetrics, type PolymarketPosition } from '@/services/polymarket.service';
import { detectBot, type BotDetectionResult, type SignalProgress } from '@/services/polymarket-detector';
import { toast } from 'sonner';

function formatUSD(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(2)}`;
}

function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

// Signal bar component matching the Polymarket Tracker style
function PixelBar({ label, value, maxLabel }: { label: string; value: number; maxLabel?: string }) {
  const barColor = value >= 80 ? 'bg-red-500' : value >= 60 ? 'bg-orange-500' : value >= 40 ? 'bg-yellow-500' : 'bg-green-500';
  const filled = Math.round((value / 100) * 16);
  return (
    <div className="flex items-center gap-2">
      <span className="text-cyan-400 text-[10px] w-24 shrink-0 font-mono">{label}</span>
      <div className="flex gap-[2px] flex-1">
        {Array.from({ length: 16 }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-2.5 ${i < filled ? barColor : 'bg-cyan-500/10'}`}
            style={{ imageRendering: 'pixelated' }}
          />
        ))}
      </div>
      <span className={`text-[10px] w-6 text-right font-mono ${value >= 70 ? 'text-red-400' : 'text-cyan-400'}`}>
        {value}
      </span>
      {maxLabel && <span className="text-cyan-400/20 text-[9px] w-6 font-mono">{maxLabel}</span>}
    </div>
  );
}

function TerminalHeader({ title, extra }: { title: string; extra?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border-b border-cyan-500/20">
      <div className="flex gap-1.5">
        <div className="w-2 h-2 rounded-full bg-red-500/60" />
        <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
        <div className="w-2 h-2 rounded-full bg-green-500/60" />
      </div>
      <span className="text-cyan-400 text-[10px] font-mono ml-1">{title}</span>
      {extra && <div className="ml-auto">{extra}</div>}
    </div>
  );
}

// Stat box that works with Tailwind (no dynamic class names)
function StatBox({ label, value, variant = 'cyan' }: { label: string; value: string; variant?: 'cyan' | 'green' | 'amber' | 'red' }) {
  const styles = {
    cyan: { border: 'border-cyan-500/30', labelColor: 'text-cyan-400/60', valueColor: 'text-cyan-400' },
    green: { border: 'border-green-500/30', labelColor: 'text-green-400/60', valueColor: 'text-green-400' },
    amber: { border: 'border-amber-500/30', labelColor: 'text-amber-400/60', valueColor: 'text-amber-400' },
    red: { border: 'border-red-500/30', labelColor: 'text-red-400/60', valueColor: 'text-red-400' },
  };
  const s = styles[variant];
  return (
    <div className={`border ${s.border} bg-black/60 p-3`}>
      <div className={`text-[10px] ${s.labelColor} font-mono uppercase`}>{'> '}{label}</div>
      <div className={`text-lg font-bold ${s.valueColor} font-mono mt-1`}>
        <ScrambleText text={value} speed={25} iterations={6} />
      </div>
    </div>
  );
}

export default function ConsensusPage() {
  const [searchParams] = useSearchParams();
  const walletAddress = searchParams.get('wallet') || '';
  const marketId = searchParams.get('market') || '';

  // Data states
  const [metrics, setMetrics] = useState<AgentMetrics | null>(null);
  const [positions, setPositions] = useState<PolymarketPosition[]>([]);
  const [botResult, setBotResult] = useState<BotDetectionResult | null>(null);
  const [liveProgress, setLiveProgress] = useState<SignalProgress | null>(null);

  // UI states
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState<'loading' | 'analyzing' | 'done'>('loading');
  const [showAllPositions, setShowAllPositions] = useState(false);

  const runAnalysis = useCallback(async () => {
    if (!walletAddress) return;

    setLoading(true);
    setPhase('loading');

    // Fetch portfolio metrics and positions in parallel
    const [metricsData, positionsData] = await Promise.all([
      polymarketService.getAgentMetrics(walletAddress),
      polymarketService.getAgentPositions(walletAddress),
    ]);

    setMetrics(metricsData);
    setPositions(positionsData);
    setPhase('analyzing');

    // Run bot detection with live progress
    try {
      const result = await detectBot(walletAddress, (progress) => {
        setLiveProgress(progress);
      });
      setBotResult(result);
    } catch {
      toast.error('Failed to run behavioral analysis');
    }

    setLoading(false);
    setPhase('done');
  }, [walletAddress]);

  useEffect(() => {
    runAnalysis();
  }, [runAnalysis]);

  // No wallet provided
  if (!walletAddress) {
    return (
      <div className="min-h-screen bg-black/95 flex items-center justify-center">
        <div className="text-center font-mono">
          <PixelTarget className="text-cyan-500/30 mx-auto mb-4" size={48} />
          <p className="text-cyan-400/60 text-sm">No wallet selected</p>
          <p className="text-cyan-300/30 text-[10px] mt-2">Use the Polymarket Agent Radar to select a wallet to analyze</p>
          <Link
            to="/agentic-world/polymarket"
            className="inline-flex items-center gap-2 mt-4 px-4 py-2 border border-cyan-500/30 text-cyan-400 text-xs hover:bg-cyan-500/10 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Go to Agent Radar
          </Link>
        </div>
      </div>
    );
  }

  // Derived data
  const totalPnl = positions.reduce((sum, p) => sum + p.cashPnl, 0);
  const winningPositions = positions.filter(p => p.cashPnl > 0).length;
  const winRate = positions.length > 0 ? Math.round((winningPositions / positions.length) * 100) : 0;
  const biggestWin = positions.length > 0 ? Math.max(...positions.map(p => p.cashPnl)) : 0;
  const biggestLoss = positions.length > 0 ? Math.min(...positions.map(p => p.cashPnl)) : 0;
  const avgPositionSize = positions.length > 0 ? positions.reduce((s, p) => s + p.currentValue, 0) / positions.length : 0;

  // Sort positions: biggest value first
  const sortedPositions = [...positions].sort((a, b) => b.currentValue - a.currentValue);
  const displayPositions = showAllPositions ? sortedPositions : sortedPositions.slice(0, 15);

  return (
    <div className="min-h-screen bg-black/95">
      <Helmet>
        <title>Wallet Analyzer | DeFi Hub M&eacute;xico</title>
        <meta name="description" content="Deep analysis of Polymarket wallet behavior, positions, and trading patterns" />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Back nav + header */}
        <div className="flex items-center gap-3 mb-6">
          <Link
            to="/agentic-world/polymarket"
            className="p-2 hover:bg-cyan-500/10 text-cyan-400/60 hover:text-cyan-400 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="w-10 h-10 border border-amber-500/40 bg-amber-500/10 flex items-center justify-center">
            <PixelTarget size={22} className="text-amber-400" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold font-mono text-foreground flex items-center gap-2">
              <ScrambleText text="DeFi MEXICO ANALYZER" speed={20} iterations={10} />
            </h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-cyan-400 text-xs font-mono">{shortAddr(walletAddress)}</span>
              {metrics?.pseudonym && (
                <span className="text-foreground/40 text-xs font-mono">@{metrics.pseudonym}</span>
              )}
              <a
                href={`https://polymarket.com/portfolio/${walletAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400/30 hover:text-cyan-400 transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
          {botResult && (
            <div className={`px-3 py-1.5 border font-mono text-xs flex items-center gap-1.5 ${
              botResult.classification === 'bot' ? 'border-red-500/40 bg-red-500/10 text-red-400' :
              botResult.classification === 'likely-bot' ? 'border-orange-500/40 bg-orange-500/10 text-orange-400' :
              botResult.classification === 'mixed' ? 'border-yellow-500/40 bg-yellow-500/10 text-yellow-400' :
              'border-green-500/40 bg-green-500/10 text-green-400'
            }`}>
              {(botResult.classification === 'bot' || botResult.classification === 'likely-bot') && <PixelLobster size={12} />}
              {botResult.classification.toUpperCase()} {botResult.botScore}
            </div>
          )}
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
          <StatBox label="PORTFOLIO" value={metrics ? formatUSD(metrics.portfolioValue) : '...'} variant="cyan" />
          <StatBox label="TOTAL P&L" value={metrics?.profitPnL != null ? `${metrics.profitPnL >= 0 ? '+' : ''}${formatUSD(metrics.profitPnL)}` : '...'} variant={metrics?.profitPnL != null && metrics.profitPnL >= 0 ? 'green' : 'red'} />
          <StatBox label="WIN RATE" value={positions.length > 0 ? `${winRate}%` : '...'} variant={winRate >= 55 ? 'green' : 'amber'} />
          <StatBox label="POSITIONS" value={metrics ? String(metrics.openPositions) : '...'} variant="cyan" />
        </div>

        {/* Two-column layout: Behavioral Analysis + Position Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">

          {/* Behavioral Analysis Terminal */}
          <div className="border border-cyan-500/30 bg-black/60 overflow-hidden font-mono">
            <TerminalHeader
              title={`analyze --wallet ${shortAddr(walletAddress)}`}
              extra={
                phase === 'done' ? (
                  <span className="text-green-400 text-[10px]">complete</span>
                ) : (
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                )
              }
            />
            <div className="px-3 py-3 space-y-1.5">
              {phase === 'loading' && !liveProgress && (
                <div className="text-cyan-400/60 text-[11px] animate-pulse">
                  {'>'} Fetching portfolio data...
                </div>
              )}

              {liveProgress && liveProgress.phase === 'fetching' && (
                <div className="text-cyan-400/60 text-[11px] animate-pulse">
                  {'>'} Fetching trades, merges, positions...
                </div>
              )}

              {liveProgress && liveProgress.tradeCount !== undefined && (
                <div className="text-cyan-300/40 text-[10px] mb-2">
                  {'>'} loaded {liveProgress.tradeCount} trades, {liveProgress.mergeCount} merges
                </div>
              )}

              {/* Show signals as they compute */}
              {(liveProgress?.phase === 'analyzing' || phase === 'done') && (
                <>
                  {[
                    { key: 'intervalRegularity' as const, name: 'INTERVAL', weight: '20%' },
                    { key: 'splitMergeRatio' as const, name: 'SPLIT/MERGE', weight: '25%' },
                    { key: 'sizingConsistency' as const, name: 'SIZING', weight: '15%' },
                    { key: 'activity24h' as const, name: '24/7', weight: '15%' },
                    { key: 'winRateExtreme' as const, name: 'WIN_RATE', weight: '15%' },
                    { key: 'marketConcentration' as const, name: 'FOCUS', weight: '10%' },
                    { key: 'ghostWhale' as const, name: 'GHOST', weight: '50%' },
                  ].map((s) => {
                    const val = botResult
                      ? botResult.signals[s.key]
                      : liveProgress?.signals[s.key];
                    const isActive = liveProgress?.signal === s.name;
                    const isDone = val !== undefined;
                    return (
                      <PixelBar
                        key={s.key}
                        label={isDone || isActive ? s.name : s.name}
                        value={isDone ? val : 0}
                        maxLabel={isDone ? s.weight : undefined}
                      />
                    );
                  })}
                </>
              )}

              {botResult && botResult.signals.bothSidesBonus > 0 && (
                <div className="text-red-400 text-[10px] pt-1 border-t border-cyan-500/10">
                  {'>'} BOTH_SIDES_BONUS: +{botResult.signals.bothSidesBonus}
                </div>
              )}

              {botResult && (
                <div className="pt-2 border-t border-cyan-500/10 space-y-1">
                  <div className="text-cyan-400/40 text-[10px]">
                    {'>'} {botResult.tradeCount} trades | {botResult.mergeCount} merges | {botResult.activeHours}/24h active | {botResult.bothSidesPercent}% both-sides
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Position Summary Terminal */}
          <div className="border border-cyan-500/30 bg-black/60 overflow-hidden font-mono">
            <TerminalHeader
              title="portfolio --summary"
              extra={
                <span className="text-cyan-400/40 text-[10px]">{positions.length} positions</span>
              }
            />
            <div className="px-3 py-3 space-y-3">
              {positions.length > 0 ? (
                <>
                  {/* Quick stats */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                    <div>
                      <div className="text-[10px] text-cyan-400/40">TOTAL P&L (open)</div>
                      <div className={`text-sm font-bold ${totalPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        {totalPnl >= 0 ? '+' : ''}{formatUSD(totalPnl)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400/40">WIN / LOSS</div>
                      <div className="text-sm font-bold">
                        <span className="text-green-400">{winningPositions}W</span>
                        <span className="text-cyan-400/30"> / </span>
                        <span className="text-red-400">{positions.length - winningPositions}L</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400/40">BEST TRADE</div>
                      <div className="text-sm font-bold text-green-400">+{formatUSD(biggestWin)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400/40">WORST TRADE</div>
                      <div className="text-sm font-bold text-red-400">{formatUSD(biggestLoss)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400/40">AVG SIZE</div>
                      <div className="text-sm font-bold text-cyan-400">{formatUSD(avgPositionSize)}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-cyan-400/40">VOLUME</div>
                      <div className="text-sm font-bold text-cyan-400">{metrics ? formatUSD(metrics.volumeTraded) : '...'}</div>
                    </div>
                  </div>

                  {/* Side distribution bar */}
                  {(() => {
                    const yesCount = positions.filter(p => p.outcome === 'Yes').length;
                    const noCount = positions.length - yesCount;
                    const yesPct = Math.round((yesCount / positions.length) * 100);
                    return (
                      <div>
                        <div className="text-[10px] text-cyan-400/40 mb-1">DIRECTION BIAS</div>
                        <div className="flex h-2 overflow-hidden" style={{ imageRendering: 'pixelated' }}>
                          <div className="bg-green-500 h-full" style={{ width: `${yesPct}%` }} />
                          <div className="bg-red-500 h-full" style={{ width: `${100 - yesPct}%` }} />
                        </div>
                        <div className="flex justify-between mt-0.5">
                          <span className="text-green-400 text-[9px]">YES {yesPct}% ({yesCount})</span>
                          <span className="text-red-400 text-[9px]">NO {100 - yesPct}% ({noCount})</span>
                        </div>
                      </div>
                    );
                  })()}
                </>
              ) : loading ? (
                <div className="text-cyan-400/40 text-[11px] animate-pulse py-4">
                  {'>'} Loading positions...
                </div>
              ) : (
                <div className="text-cyan-400/30 text-[11px] py-4">
                  {'>'} No open positions found
                </div>
              )}
            </div>
          </div>
        </div>

        {/* AI Insights Terminal */}
        {phase === 'done' && botResult && metrics && (
          <div className="mb-6">
            <AIInsightsTerminal
              context="wallet"
              data={{
                wallet: walletAddress,
                metrics: {
                  portfolioValue: metrics.portfolioValue,
                  profitPnL: metrics.profitPnL,
                },
                positions: positions.slice(0, 10).map(p => ({
                  outcome: p.outcome,
                  title: p.title,
                  currentValue: p.currentValue,
                  cashPnl: p.cashPnl,
                })),
                winRate,
                botSignals: {
                  botScore: botResult.botScore,
                  classification: botResult.classification,
                  signals: botResult.signals,
                },
                marketContext: marketId || undefined,
              }}
              commandLabel={`openclaw --explain ${shortAddr(walletAddress)}`}
              buttonLabel="EXPLAIN WALLET WITH AI"
            />
          </div>
        )}

        {/* Positions Table */}
        {positions.length > 0 && (
          <div className="border border-cyan-500/30 bg-black/60 overflow-hidden font-mono">
            <TerminalHeader
              title={`positions --open ${positions.length}`}
              extra={
                <a
                  href={`https://polymarket.com/portfolio/${walletAddress}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[10px] text-cyan-400/40 hover:text-cyan-400 flex items-center gap-1 transition-colors"
                >
                  <ExternalLink className="w-3 h-3" /> polymarket.com
                </a>
              }
            />

            {/* Desktop table */}
            <div className="hidden md:block">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-cyan-500/15">
                    <th className="text-left px-3 py-2 text-[10px] text-cyan-400/60">#</th>
                    <th className="text-center px-3 py-2 text-[10px] text-cyan-400/60">SIDE</th>
                    <th className="text-left px-3 py-2 text-[10px] text-cyan-400/60">MARKET</th>
                    <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">SIZE</th>
                    <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">AVG ENTRY</th>
                    <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">CURRENT</th>
                    <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">P&L</th>
                    <th className="text-right px-3 py-2 text-[10px] text-cyan-400/60">P&L %</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPositions.map((pos, i) => {
                    const pnlColor = pos.cashPnl > 0 ? 'text-green-400' : pos.cashPnl < 0 ? 'text-red-400' : 'text-cyan-400/40';
                    return (
                      <tr key={i} className="border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors">
                        <td className="px-3 py-2 text-cyan-400/30 text-[10px]">{String(i + 1).padStart(2, '0')}</td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-[10px] px-1.5 py-0.5 border ${
                            pos.outcome === 'Yes'
                              ? 'text-green-400 border-green-500/30 bg-green-500/10'
                              : 'text-red-400 border-red-500/30 bg-red-500/10'
                          }`}>
                            {pos.outcome}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-cyan-300 text-xs max-w-[300px] truncate">{pos.title}</td>
                        <td className="px-3 py-2 text-right text-xs text-cyan-300">{formatUSD(pos.currentValue)}</td>
                        <td className="px-3 py-2 text-right text-xs text-cyan-400/60">${pos.avgPrice.toFixed(2)}</td>
                        <td className="px-3 py-2 text-right text-xs text-cyan-300">${pos.curPrice.toFixed(2)}</td>
                        <td className={`px-3 py-2 text-right text-xs ${pnlColor}`}>
                          {pos.cashPnl > 0 ? '+' : ''}{formatUSD(pos.cashPnl)}
                        </td>
                        <td className={`px-3 py-2 text-right text-xs ${pnlColor}`}>
                          {pos.percentPnl > 0 ? '+' : ''}{pos.percentPnl.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden divide-y divide-cyan-500/10">
              {displayPositions.map((pos, i) => {
                const pnlColor = pos.cashPnl > 0 ? 'text-green-400' : pos.cashPnl < 0 ? 'text-red-400' : 'text-cyan-400/40';
                return (
                  <div key={i} className="px-3 py-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-cyan-400/30 text-[10px]">{String(i + 1).padStart(2, '0')}</span>
                        <span className={`text-[10px] px-1 py-0.5 border shrink-0 ${
                          pos.outcome === 'Yes'
                            ? 'text-green-400 border-green-500/30 bg-green-500/10'
                            : 'text-red-400 border-red-500/30 bg-red-500/10'
                        }`}>
                          {pos.outcome}
                        </span>
                        <span className="text-cyan-300 text-xs truncate">{pos.title}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-1 pl-8">
                      <span className="text-cyan-400/60 text-[10px]">{formatUSD(pos.currentValue)}</span>
                      <span className={`text-[10px] ${pnlColor}`}>
                        {pos.cashPnl > 0 ? '+' : ''}{formatUSD(pos.cashPnl)} ({pos.percentPnl > 0 ? '+' : ''}{pos.percentPnl.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show more / footer */}
            {sortedPositions.length > 15 && (
              <div className="px-3 py-2 border-t border-cyan-500/15">
                <button
                  onClick={() => setShowAllPositions(!showAllPositions)}
                  className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono transition-colors"
                >
                  {'>'} {showAllPositions ? 'SHOW LESS' : `+${sortedPositions.length - 15} more positions`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 text-center font-mono">
          <p className="text-cyan-400/20 text-[10px]">
            DeFi Mexico Analyzer v0.1 | data: polymarket data-api + gamma-api | runs client-side
          </p>
        </div>
      </div>
    </div>
  );
}
