// ============================================================
// ExecutePanel — Standalone DEX quote with asset selector
// Powered by OKX DEX Aggregator
// ============================================================

import { useState } from 'react';
import { DexQuotePanel } from '@/components/claw-trader/DexQuotePanel';

const ASSETS = [
  { key: 'btc', label: 'BTC', slug: 'bitcoin-btc', title: 'Bitcoin BTC price' },
  { key: 'eth', label: 'ETH', slug: 'ethereum-eth', title: 'Ethereum ETH price' },
  { key: 'okb', label: 'OKB', slug: 'okb-price', title: 'OKB price' },
];

export function ExecutePanel() {
  const [selected, setSelected] = useState(0);
  const asset = ASSETS[selected];

  return (
    <div className="space-y-3">
      {/* Asset selector */}
      <div className="flex gap-1 bg-neutral-900/60 rounded-xl p-1">
        {ASSETS.map((a, i) => (
          <button
            key={a.key}
            onClick={() => setSelected(i)}
            className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
              i === selected
                ? 'bg-amber-500/20 text-amber-400'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            {a.label}
          </button>
        ))}
      </div>

      {/* DEX Quote */}
      <DexQuotePanel
        key={asset.key}
        marketSlug={asset.slug}
        marketTitle={asset.title}
      />

      {/* OKX badge */}
      <div className="flex items-center justify-center gap-2 pt-1">
        <span className="text-[10px] text-neutral-600">Powered by</span>
        <span className="text-[10px] font-bold text-neutral-400">OKX DEX Aggregator</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-500">X Layer</span>
      </div>
    </div>
  );
}
