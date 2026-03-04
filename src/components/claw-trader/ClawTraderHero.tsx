import React, { useState, useEffect } from 'react';
import { ScrambleText } from '@/components/agentic/ScrambleText';
import { PriceTicker } from './PriceTicker';

interface ConnectionStatus {
  connected: boolean;
  reason?: string;
  tradingEnabled: boolean;
  maxPositionUsdc: string;
  minDivergence: string;
  maxLeverage?: string;
}

interface ClawTraderHeroProps {
  onPricesUpdate?: (prices: Record<string, number>) => void;
  onStatusUpdate?: (status: ConnectionStatus) => void;
}

export const ClawTraderHero: React.FC<ClawTraderHeroProps> = ({
  onPricesUpdate,
  onStatusUpdate,
}) => {
  const [status, setStatus] = useState<ConnectionStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    async function fetchStatus() {
      try {
        const res = await fetch('/api/onchainos-status');
        if (res.ok) {
          const data: ConnectionStatus = await res.json();
          setStatus(data);
          onStatusUpdate?.(data);
        }
      } catch {
        setStatus({ connected: false, reason: 'fetch_failed', tradingEnabled: false, maxPositionUsdc: '100', minDivergence: '3' });
      } finally {
        setStatusLoading(false);
      }
    }
    fetchStatus();
  }, [onStatusUpdate]);

  return (
    <div className="border border-green-500/20 bg-black/60 overflow-hidden font-mono">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border-b border-green-500/20">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-green-400 text-[10px]">
          openclaw --claw-trader --status
        </span>
        <div className="ml-auto flex items-center gap-3">
          {/* Connection badge */}
          {statusLoading ? (
            <span className="text-cyan-400/30 text-[9px] animate-pulse">checking...</span>
          ) : status?.connected ? (
            <span className="flex items-center gap-1.5 text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-green-400">OKX CONNECTED</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-[9px]">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span className="text-amber-400">PRICE-ONLY MODE</span>
            </span>
          )}
          {/* Trading mode */}
          {status && (
            <span className={`px-1.5 py-0.5 border text-[8px] tracking-wider ${
              status.tradingEnabled
                ? 'border-red-500/40 text-red-400 bg-red-500/10'
                : 'border-cyan-500/30 text-cyan-400/60 bg-cyan-500/5'
            }`}>
              {status.tradingEnabled ? 'LIVE' : 'SIMULATION'}
            </span>
          )}
        </div>
      </div>

      {/* Hero content */}
      <div className="p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-green-300 mb-1">
              <ScrambleText text="Claw Trader" speed={20} iterations={12} />
            </h1>
            <p className="text-green-400/40 text-xs">
              Detect agent signals on Polymarket → Scan OKX divergence → Execute
            </p>
          </div>
          {/* Status cards */}
          {status && !statusLoading && (
            <div className="flex gap-2">
              <div className="border border-green-500/20 bg-black/40 px-3 py-2">
                <div className="text-[9px] text-green-400/40 uppercase">Max Position</div>
                <div className="text-green-400 text-sm font-bold">${status.maxPositionUsdc}</div>
              </div>
              <div className="border border-green-500/20 bg-black/40 px-3 py-2">
                <div className="text-[9px] text-green-400/40 uppercase">Min Divergence</div>
                <div className="text-green-400 text-sm font-bold">{status.minDivergence}%</div>
              </div>
              <div className="border border-green-500/20 bg-black/40 px-3 py-2">
                <div className="text-[9px] text-green-400/40 uppercase">Max Leverage</div>
                <div className="text-green-400 text-sm font-bold">{status.maxLeverage || '5'}x</div>
              </div>
            </div>
          )}
        </div>

        {/* Price ticker */}
        <div className="mt-4 pt-3 border-t border-green-500/10">
          <PriceTicker onPricesUpdate={onPricesUpdate} />
        </div>
      </div>
    </div>
  );
};
