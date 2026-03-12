// ============================================================
// AnalyzePanel — Simplified market URL scanner for landing page
// Paste a Polymarket URL → get clean bot detection report
// ============================================================

import { useState } from 'react';
import { Search, ExternalLink } from 'lucide-react';
import { polymarketService, type MarketInfo, type MarketHolder } from '@/services/polymarket.service';
import { detectBot, type BotDetectionResult, type MarketContext } from '@/services/polymarket-detector';
import { toast } from 'sonner';

function formatUSD(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

interface Props {
  onSwitchToAdvanced: () => void;
}

interface ScanResult {
  market: MarketInfo;
  holders: (MarketHolder & { bot?: BotDetectionResult })[];
  botCount: number;
  humanCount: number;
  mixedCount: number;
}

export function AnalyzePanel({ onSwitchToAdvanced }: Props) {
  const [url, setUrl] = useState('');
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);

  const handleScan = async () => {
    const slug = polymarketService.parseMarketUrl(url);
    if (!slug) {
      toast.error('Paste a valid Polymarket URL');
      return;
    }

    setScanning(true);
    setResult(null);
    setProgress('Looking up market...');

    const info = await polymarketService.getMarketBySlug(slug);
    if (!info) {
      toast.error('Market not found');
      setScanning(false);
      setProgress('');
      return;
    }

    setProgress('Fetching holders...');
    const holders = await polymarketService.getMarketHolders(info.conditionId);
    if (holders.length === 0) {
      toast.error('No holders found');
      setScanning(false);
      setProgress('');
      return;
    }

    // Scan top 10 holders for bots
    const holdersWithBot: (MarketHolder & { bot?: BotDetectionResult })[] = holders.map(h => ({ ...h }));
    const toScan = holdersWithBot.slice(0, 10);

    for (let i = 0; i < toScan.length; i++) {
      setProgress(`Analyzing holder ${i + 1}/${toScan.length}...`);
      const ctx: MarketContext = {
        holderAmount: toScan[i].amount,
        totalMarketVolume: info.volume,
      };
      try {
        const bot = await detectBot(toScan[i].address, undefined, ctx);
        holdersWithBot[i] = { ...holdersWithBot[i], bot };
      } catch { /* skip */ }
    }

    const scanned = holdersWithBot.filter(h => h.bot);
    const botCount = scanned.filter(h => h.bot?.classification === 'bot' || h.bot?.classification === 'likely-bot').length;
    const humanCount = scanned.filter(h => h.bot?.classification === 'human').length;
    const mixedCount = scanned.filter(h => h.bot?.classification === 'mixed').length;

    setResult({ market: info, holders: holdersWithBot, botCount, humanCount, mixedCount });
    setScanning(false);
    setProgress('');
  };

  return (
    <div className="space-y-3">
      {/* URL input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={url}
          onChange={e => setUrl(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !scanning && handleScan()}
          placeholder="https://polymarket.com/event/..."
          className="flex-1 bg-neutral-900/60 border border-neutral-800 rounded-xl px-3 py-2.5 text-sm text-neutral-200 placeholder-neutral-600 outline-none focus:border-cyan-500/40 transition-colors"
        />
        <button
          onClick={handleScan}
          disabled={scanning || !url}
          className="px-4 py-2.5 bg-cyan-500/15 border border-cyan-500/30 text-cyan-400 rounded-xl text-sm font-medium hover:bg-cyan-500/25 transition-colors disabled:opacity-40"
        >
          {scanning ? (
            <span className="flex items-center gap-1.5">
              <div className="w-3 h-3 border-2 border-cyan-400/30 border-t-cyan-400 rounded-full animate-spin" />
              {progress}
            </span>
          ) : (
            <span className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Scan
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-neutral-900/40 border border-neutral-800 rounded-xl p-4 space-y-3">
          {/* Market title */}
          <h4 className="text-sm font-medium text-neutral-200">{result.market.question}</h4>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
              <div className="text-lg font-bold text-red-400">{result.botCount}</div>
              <div className="text-[10px] text-neutral-500">Agents</div>
            </div>
            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
              <div className="text-lg font-bold text-green-400">{result.humanCount}</div>
              <div className="text-[10px] text-neutral-500">Humans</div>
            </div>
            <div className="text-center p-2 bg-neutral-800/50 rounded-lg">
              <div className="text-lg font-bold text-amber-400">{result.mixedCount}</div>
              <div className="text-[10px] text-neutral-500">Mixed</div>
            </div>
          </div>

          {/* Top holders */}
          <div className="space-y-1">
            {result.holders.slice(0, 5).map(h => (
              <div key={h.address} className="flex items-center justify-between text-xs py-1">
                <span className="text-neutral-400 font-mono">{h.address.slice(0, 6)}...{h.address.slice(-4)}</span>
                <div className="flex items-center gap-2">
                  <span className="text-neutral-500">{formatUSD(h.amount)}</span>
                  {h.bot && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                      h.bot.classification === 'bot' || h.bot.classification === 'likely-bot'
                        ? 'bg-red-500/15 text-red-400'
                        : h.bot.classification === 'human'
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-amber-500/15 text-amber-400'
                    }`}>
                      {h.bot.classification === 'bot' ? 'AGENT' : h.bot.classification === 'likely-bot' ? 'LIKELY' : h.bot.classification === 'human' ? 'HUMAN' : 'MIXED'}
                      {' '}{h.bot.score}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onSwitchToAdvanced}
              className="text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors"
            >
              Full analysis in Advanced View →
            </button>
            <a
              href={`https://polymarket.com/event/${polymarketService.parseMarketUrl(url)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-300 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              Polymarket
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
