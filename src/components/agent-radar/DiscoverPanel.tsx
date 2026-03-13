// ============================================================
// DiscoverPanel — Clean smart money results for landing page
// Shows top markets with whale consensus, expandable for details
// ============================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, ChevronDown, Users, ExternalLink } from 'lucide-react';
import type { SmartMoneyMarket, WhaleSignal } from '@/services/polymarket.service';
import type { AgentLogEntry } from '@/components/claw-trader/AgentActivityLog';
import { AgentActivityLog } from '@/components/claw-trader/AgentActivityLog';
import { DexQuotePanel } from '@/components/claw-trader/DexQuotePanel';
import { CEXInsightBadge } from './CEXInsightBadge';
import { CopyTradeCard } from './CopyTradeCard';
import { SmartMoneyTreemap } from './SmartMoneyTreemap';
import { ArbitrageDetector } from './ArbitrageDetector';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface Props {
  markets: SmartMoneyMarket[];
  whaleSignals: WhaleSignal[];
  loading: boolean;
  progress: string;
  agentLog: AgentLogEntry[];
}

type ViewMode = 'cards' | 'treemap';

export function DiscoverPanel({ markets, whaleSignals, loading, progress, agentLog }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');

  const top5 = markets.slice(0, 5);

  return (
    <div className="space-y-3">
      {/* View mode toggle + Arbitrage detector */}
      {!loading && markets.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 bg-neutral-900/60 rounded-lg p-0.5">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  viewMode === 'cards' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                Cards
              </button>
              <button
                onClick={() => setViewMode('treemap')}
                className={`px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors ${
                  viewMode === 'treemap' ? 'bg-neutral-800 text-neutral-200' : 'text-neutral-600 hover:text-neutral-400'
                }`}
              >
                Heatmap
              </button>
            </div>
          </div>

          {/* Arbitrage signals */}
          <ArbitrageDetector markets={markets} />
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 text-sm text-neutral-400">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            {progress || 'Scanning smart money...'}
          </div>
          {agentLog.length > 0 && (
            <AgentActivityLog entries={agentLog} />
          )}
          {/* Skeleton cards */}
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-neutral-900/50 rounded-xl p-4 animate-pulse">
              <div className="h-4 w-3/4 bg-neutral-800 rounded mb-3" />
              <div className="h-3 w-1/2 bg-neutral-800 rounded" />
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {!loading && top5.length === 0 && (
        <div className="text-center py-8 text-neutral-500 text-sm">
          No smart money data yet. Scanning will start automatically.
        </div>
      )}

      {/* Treemap view */}
      {viewMode === 'treemap' && !loading && markets.length > 0 && (
        <SmartMoneyTreemap
          markets={markets}
          onSelectMarket={(m) => {
            setViewMode('cards');
            setExpandedId(m.conditionId);
          }}
        />
      )}

      {/* Cards view */}
      {viewMode === 'cards' && top5.map((market, idx) => {
        const isExpanded = expandedId === market.conditionId;
        const isTopOutcomeYes = market.topOutcome.toLowerCase() === 'yes';
        const consensusColor = market.capitalConsensus >= 70
          ? 'text-green-400'
          : market.capitalConsensus >= 50
          ? 'text-amber-400'
          : 'text-neutral-400';

        // Find recent whale activity for this market
        const marketSignals = whaleSignals.filter(
          s => s.marketSlug === market.slug || s.marketTitle === market.title
        ).slice(0, 3);

        return (
          <div key={market.conditionId}>
            <button
              onClick={() => setExpandedId(isExpanded ? null : market.conditionId)}
              className="w-full text-left bg-neutral-900/60 hover:bg-neutral-900/80 border border-neutral-800 hover:border-neutral-700 rounded-xl p-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  {/* Rank badge */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-bold text-neutral-500">#{idx + 1}</span>
                    {idx === 0 && markets.length > 0 && (
                      <span className="text-[10px] font-bold text-green-400 bg-green-400/10 px-1.5 py-0.5 rounded">
                        TOP SIGNAL
                      </span>
                    )}
                  </div>

                  {/* Market question */}
                  <h3 className="text-sm font-medium text-neutral-200 line-clamp-2 mb-2">
                    {market.title}
                  </h3>

                  {/* Stats row */}
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    {/* Consensus direction */}
                    <span className={`font-bold ${isTopOutcomeYes ? 'text-green-400' : 'text-red-400'}`}>
                      {market.topOutcome} {market.topOutcomeCapitalPct}%
                    </span>

                    {/* Trader count */}
                    <span className="flex items-center gap-1 text-neutral-500">
                      <Users className="w-3 h-3" />
                      {market.traderCount} whales
                    </span>

                    {/* Capital */}
                    <span className="text-neutral-500">
                      {formatUSD(market.totalCapital)}
                    </span>

                    {/* Edge */}
                    {market.edgePercent !== 0 && (
                      <span className={market.edgeDirection === 'PROFIT' ? 'text-green-400' : market.edgeDirection === 'UNDERWATER' ? 'text-red-400' : 'text-neutral-500'}>
                        {market.edgePercent > 0 ? '+' : ''}{market.edgePercent}pts
                      </span>
                    )}

                    {/* Consensus strength */}
                    <span className={consensusColor}>
                      {market.capitalConsensus}% agreement
                    </span>

                    {/* Compact CEX price badge */}
                    <CEXInsightBadge marketTitle={market.title} compact />
                  </div>
                </div>

                {/* Expand chevron */}
                <ChevronDown className={`w-4 h-4 text-neutral-600 transition-transform shrink-0 mt-1 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </button>

            {/* Expanded details */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="bg-neutral-900/40 border border-t-0 border-neutral-800 rounded-b-xl p-4 space-y-4">
                    {/* Outcome breakdown */}
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Capital Distribution</div>
                      <div className="space-y-1.5">
                        {market.outcomeBias.map(ob => {
                          const pct = market.totalCapital > 0 ? (ob.capital / market.totalCapital) * 100 : 0;
                          return (
                            <div key={ob.outcome} className="flex items-center gap-2">
                              <span className="text-xs text-neutral-400 w-12">{ob.outcome}</span>
                              <div className="flex-1 bg-neutral-800 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${ob.outcome.toLowerCase() === 'yes' ? 'bg-green-500' : 'bg-red-500'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="text-xs text-neutral-500 w-16 text-right">
                                {formatUSD(ob.capital)} ({ob.headcount})
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Top traders */}
                    <div>
                      <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Top Traders</div>
                      <div className="space-y-1">
                        {market.traders.slice(0, 3).map(t => (
                          <div key={t.address} className="flex items-center justify-between text-xs">
                            <span className="text-neutral-300">
                              #{t.rank} {t.name}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className={t.outcome.toLowerCase() === 'yes' ? 'text-green-400' : 'text-red-400'}>
                                {t.outcome}
                              </span>
                              <span className="text-neutral-500">{formatUSD(t.positionValue)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Recent whale activity */}
                    {marketSignals.length > 0 && (
                      <div>
                        <div className="text-[10px] text-neutral-500 uppercase tracking-wider mb-2">Recent Activity</div>
                        <div className="space-y-1">
                          {marketSignals.map((s, i) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-neutral-400">{s.traderName}</span>
                              <div className="flex items-center gap-2">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${s.side === 'BUY' ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                                  {s.side}
                                </span>
                                <span className="text-neutral-500">{formatUSD(s.usdcSize)}</span>
                                <span className="text-neutral-600">{s.hoursAgo}h ago</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* OKX CEX Market Intelligence */}
                    <CEXInsightBadge marketTitle={market.title} />

                    {/* Copy Trade — follow top trader */}
                    {market.traders.length > 0 && (
                      <CopyTradeCard
                        market={market}
                        trader={market.traders[0]}
                      />
                    )}

                    {/* DEX Quote */}
                    <DexQuotePanel
                      marketSlug={market.slug || ''}
                      marketTitle={market.title}
                    />

                    {/* Polymarket link */}
                    {market.slug && (
                      <a
                        href={`https://polymarket.com/event/${market.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on Polymarket
                      </a>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* More markets hint */}
      {viewMode === 'cards' && !loading && markets.length > 5 && (
        <div className="text-center text-xs text-neutral-600">
          +{markets.length - 5} more markets in Advanced View
        </div>
      )}
    </div>
  );
}
