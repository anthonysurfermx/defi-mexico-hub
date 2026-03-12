// ============================================================
// ExecutePanel — Dual-mode execution: DEX Swap + CEX Trade
// DEX: OKX DEX Aggregator (on-chain swap)
// CEX: Agent Trade Kit concept (spot/perps via OKX exchange)
// ============================================================

import { useState, useEffect } from 'react';
import { DexQuotePanel } from '@/components/claw-trader/DexQuotePanel';
import { fetchMarketDetail, formatVolume, type OKXMarketDetail } from '@/services/okx-market.service';

const ASSETS = [
  { key: 'btc', label: 'BTC', slug: 'bitcoin-btc', title: 'Bitcoin BTC price', instId: 'BTC-USDT' },
  { key: 'eth', label: 'ETH', slug: 'ethereum-eth', title: 'Ethereum ETH price', instId: 'ETH-USDT' },
  { key: 'okb', label: 'OKB', slug: 'okb-price', title: 'OKB price', instId: 'OKB-USDT' },
];

type Mode = 'dex' | 'cex';

export function ExecutePanel() {
  const [selected, setSelected] = useState(0);
  const [mode, setMode] = useState<Mode>('dex');
  const [cexData, setCexData] = useState<OKXMarketDetail | null>(null);
  const [cexLoading, setCexLoading] = useState(false);

  const asset = ASSETS[selected];

  // Fetch CEX data when in CEX mode or when asset changes
  useEffect(() => {
    if (mode !== 'cex') return;
    let mounted = true;
    setCexLoading(true);
    setCexData(null);

    fetchMarketDetail(asset.instId)
      .then(d => { if (mounted) setCexData(d); })
      .catch(() => {})
      .finally(() => { if (mounted) setCexLoading(false); });

    return () => { mounted = false; };
  }, [mode, asset.instId]);

  return (
    <div className="space-y-3">
      {/* Mode toggle */}
      <div className="flex gap-1 bg-neutral-900/60 rounded-xl p-1">
        <button
          onClick={() => setMode('dex')}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
            mode === 'dex'
              ? 'bg-amber-500/20 text-amber-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          DEX Swap
        </button>
        <button
          onClick={() => setMode('cex')}
          className={`flex-1 py-1.5 text-[11px] font-medium rounded-lg transition-colors ${
            mode === 'cex'
              ? 'bg-purple-500/20 text-purple-400'
              : 'text-neutral-500 hover:text-neutral-300'
          }`}
        >
          CEX Trade
        </button>
      </div>

      {/* Asset selector */}
      <div className="flex gap-1 bg-neutral-900/40 rounded-lg p-0.5">
        {ASSETS.map((a, i) => (
          <button
            key={a.key}
            onClick={() => setSelected(i)}
            className={`flex-1 py-1 text-[10px] font-medium rounded-md transition-colors ${
              i === selected
                ? mode === 'dex' ? 'bg-amber-500/15 text-amber-400' : 'bg-purple-500/15 text-purple-400'
                : 'text-neutral-600 hover:text-neutral-400'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* DEX Mode */}
      {mode === 'dex' && (
        <>
          <DexQuotePanel
            key={asset.key}
            marketSlug={asset.slug}
            marketTitle={asset.title}
          />
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] text-neutral-600">Powered by</span>
            <span className="text-[10px] font-bold text-neutral-400">OKX DEX Aggregator</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">X Layer</span>
          </div>
        </>
      )}

      {/* CEX Mode — Agent Trade Kit */}
      {mode === 'cex' && (
        <div className="space-y-3">
          {/* Live market data */}
          {cexLoading ? (
            <div className="space-y-2 animate-pulse">
              <div className="h-10 bg-neutral-800/50 rounded-lg" />
              <div className="h-20 bg-neutral-800/50 rounded-lg" />
            </div>
          ) : cexData ? (
            <div className="border border-purple-500/20 bg-purple-500/5 rounded-xl p-3 space-y-3">
              {/* Price header */}
              {cexData.ticker && (
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-lg font-bold text-neutral-100">
                      ${cexData.ticker.last.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </div>
                    <div className={`text-xs ${
                      cexData.ticker.change24h > 0 ? 'text-green-400' : cexData.ticker.change24h < 0 ? 'text-red-400' : 'text-neutral-500'
                    }`}>
                      {cexData.ticker.change24h > 0 ? '+' : ''}{cexData.ticker.change24h}% (24h)
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-neutral-500">24h Volume</div>
                    <div className="text-xs text-neutral-300">{formatVolume(cexData.ticker.vol24h)}</div>
                  </div>
                </div>
              )}

              {/* Funding + OI row */}
              <div className="grid grid-cols-2 gap-2">
                {cexData.funding && (
                  <div className="bg-neutral-900/60 rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-neutral-500">Funding Rate</div>
                    <div className={`text-xs font-medium ${
                      cexData.funding.rate > 0 ? 'text-green-400' : cexData.funding.rate < 0 ? 'text-red-400' : 'text-neutral-300'
                    }`}>
                      {(cexData.funding.rate * 100).toFixed(4)}%
                    </div>
                    <div className="text-[9px] text-neutral-600">
                      Ann. {cexData.funding.annualized}%
                    </div>
                  </div>
                )}
                {cexData.openInterest && cexData.ticker && (
                  <div className="bg-neutral-900/60 rounded-lg px-2 py-1.5">
                    <div className="text-[9px] text-neutral-500">Open Interest</div>
                    <div className="text-xs font-medium text-neutral-300">
                      {formatVolume(cexData.openInterest.oiCcy * cexData.ticker.last)}
                    </div>
                    <div className="text-[9px] text-neutral-600">
                      {cexData.openInterest.oiCcy.toLocaleString(undefined, { maximumFractionDigits: 0 })} {asset.label}
                    </div>
                  </div>
                )}
              </div>

              {/* Agent Trade Kit actions */}
              <div className="space-y-1.5">
                <div className="text-[9px] text-purple-400/60 uppercase tracking-wider">Agent Trade Kit Actions</div>

                {/* Spot buy */}
                <button className="w-full flex items-center justify-between px-3 py-2 bg-green-500/10 border border-green-500/20 rounded-lg hover:bg-green-500/15 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-400">BUY</span>
                    <span className="text-[10px] text-neutral-400">Spot {asset.label}</span>
                  </div>
                  <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">
                    spot_place_order →
                  </span>
                </button>

                {/* Long perp */}
                <button className="w-full flex items-center justify-between px-3 py-2 bg-green-500/5 border border-green-500/15 rounded-lg hover:bg-green-500/10 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-400/80">LONG</span>
                    <span className="text-[10px] text-neutral-400">{asset.label}-USDT Perp</span>
                  </div>
                  <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">
                    swap_place_order →
                  </span>
                </button>

                {/* Short perp */}
                <button className="w-full flex items-center justify-between px-3 py-2 bg-red-500/5 border border-red-500/15 rounded-lg hover:bg-red-500/10 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-red-400/80">SHORT</span>
                    <span className="text-[10px] text-neutral-400">{asset.label}-USDT Perp</span>
                  </div>
                  <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">
                    swap_place_order →
                  </span>
                </button>

                {/* Grid bot */}
                <button className="w-full flex items-center justify-between px-3 py-2 bg-purple-500/5 border border-purple-500/15 rounded-lg hover:bg-purple-500/10 transition-colors group">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-purple-400/80">GRID</span>
                    <span className="text-[10px] text-neutral-400">Auto-trade {asset.label} range</span>
                  </div>
                  <span className="text-[9px] text-neutral-600 group-hover:text-neutral-400">
                    grid_create_order →
                  </span>
                </button>
              </div>

              {/* Signal context */}
              {cexData.funding && Math.abs(cexData.funding.rate) > 0.0001 && (
                <div className={`text-[10px] px-2 py-1.5 rounded-lg ${
                  cexData.funding.rate > 0.005
                    ? 'bg-green-500/10 text-green-400/70'
                    : cexData.funding.rate < -0.005
                    ? 'bg-red-500/10 text-red-400/70'
                    : 'bg-neutral-800/50 text-neutral-500'
                }`}>
                  {cexData.funding.rate > 0.005
                    ? `High funding (${(cexData.funding.rate * 100).toFixed(3)}%) — longs crowded, short opportunity`
                    : cexData.funding.rate < -0.005
                    ? `Negative funding (${(cexData.funding.rate * 100).toFixed(3)}%) — shorts crowded, long opportunity`
                    : `Neutral funding — no clear crowding signal`
                  }
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-4 text-neutral-500 text-xs">
              Failed to load CEX data
            </div>
          )}

          {/* Agent Trade Kit badge */}
          <div className="flex items-center justify-center gap-2 pt-1">
            <span className="text-[10px] text-neutral-600">Powered by</span>
            <span className="text-[10px] font-bold text-purple-400/80">OKX Agent Trade Kit</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400/50">95 tools</span>
          </div>
        </div>
      )}
    </div>
  );
}
