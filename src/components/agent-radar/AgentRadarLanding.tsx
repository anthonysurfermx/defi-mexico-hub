// ============================================================
// AgentRadarLanding — Progressive disclosure landing for Agent Radar
// 3 paths: DISCOVER / ANALYZE / EXECUTE
// ============================================================

import { ArrowLeft, TrendingUp, Search, Zap, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PixelLobster } from '@/components/ui/pixel-icons';
import { useSmartMoneyScan } from '@/hooks/useSmartMoneyScan';
import { DiscoverPanel } from './DiscoverPanel';
import { AnalyzePanel } from './AnalyzePanel';
import { ExecutePanel } from './ExecutePanel';
import { OKXTickerStrip } from './OKXTickerStrip';

interface Props {
  onSwitchToAdvanced: (mode?: string) => void;
}

export function AgentRadarLanding({ onSwitchToAdvanced }: Props) {
  const scan = useSmartMoneyScan({ autoStart: true, walletCount: 50 });

  return (
    <div className="min-h-screen" style={{ background: '#0a0a0a' }}>
      <div className="max-w-5xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <Link to="/agentic-world" className="text-neutral-600 hover:text-neutral-400 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <PixelLobster size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-neutral-100">Agent Radar</h1>
              <p className="text-xs text-neutral-500">AI-powered market intelligence</p>
            </div>
          </div>
          <button
            onClick={() => onSwitchToAdvanced()}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
          >
            Advanced View
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* OKX Live Ticker Strip */}
        <div className="mb-5 -mt-2">
          <OKXTickerStrip />
        </div>

        {/* DISCOVER — Full width, auto-loading */}
        <div className="mb-6">
          <div className="bg-[#131313] border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-neutral-200">Discover</h2>
                <p className="text-[11px] text-neutral-500">What's trending in smart money?</p>
              </div>
              {scan.markets.length > 0 && (
                <span className="ml-auto text-[10px] text-green-400/60 bg-green-400/5 px-2 py-1 rounded-lg">
                  {scan.markets.length} markets · {scan.leaderboard.length} traders
                </span>
              )}
            </div>

            <DiscoverPanel
              markets={scan.sortedMarkets}
              whaleSignals={scan.whaleSignals}
              loading={scan.loading}
              progress={scan.progress}
              agentLog={scan.agentLog}
            />

            {/* Rescan button */}
            {!scan.loading && scan.markets.length > 0 && (
              <div className="mt-3 flex items-center justify-between">
                <button
                  onClick={() => scan.startScan()}
                  className="text-[11px] text-neutral-500 hover:text-neutral-300 transition-colors"
                >
                  Rescan
                </button>
                <button
                  onClick={() => onSwitchToAdvanced('smartmoney')}
                  className="text-[11px] text-green-400/50 hover:text-green-400 transition-colors"
                >
                  See all {scan.markets.length} markets →
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ANALYZE + EXECUTE — Side by side */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ANALYZE */}
          <div className="bg-[#131313] border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <Search className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-neutral-200">Analyze</h2>
                <p className="text-[11px] text-neutral-500">Deep dive any market</p>
              </div>
            </div>
            <AnalyzePanel onSwitchToAdvanced={() => onSwitchToAdvanced('market')} />
          </div>

          {/* EXECUTE */}
          <div className="bg-[#131313] border border-neutral-800 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <h2 className="text-sm font-medium text-neutral-200">Execute</h2>
                <p className="text-[11px] text-neutral-500">Best price to swap</p>
              </div>
            </div>
            <ExecutePanel />
          </div>
        </div>

        {/* Footer badge */}
        <div className="flex items-center justify-center flex-wrap gap-3 mt-8 text-[11px] text-neutral-600">
          <span>Powered by</span>
          <span className="font-bold text-neutral-400">OKX</span>
          <span className="text-neutral-700">·</span>
          <span>X Layer</span>
          <span className="text-neutral-700">·</span>
          <span>DEX Aggregator</span>
          <span className="text-neutral-700">·</span>
          <span>Agent Trade Kit</span>
          <span className="text-neutral-700">·</span>
          <span>Polymarket API</span>
        </div>
      </div>
    </div>
  );
}
