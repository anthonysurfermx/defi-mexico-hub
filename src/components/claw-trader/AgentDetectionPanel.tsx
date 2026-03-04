import React, { useState } from 'react';
import { SignalPanel } from '@/components/agentic/SignalPanel';
import { polymarketService } from '@/services/polymarket.service';
import { detectBot, type BotDetectionResult } from '@/services/polymarket-detector';

interface DetectedAgentData {
  address: string;
  score: number;
  direction: 'YES' | 'NO';
  positionDelta: number;
  outcomePrice?: number;
  classification: string;
  strategy: string;
}

export const AgentDetectionPanel: React.FC = () => {
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState('');
  const [agents, setAgents] = useState<DetectedAgentData[]>([]);
  const [marketSlug, setMarketSlug] = useState('');

  const handleDetect = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setAgents([]);
    setProgress('Fetching leaderboard...');

    try {
      // Cargar top traders del leaderboard
      const leaderboard = await polymarketService.getLeaderboard();
      const top10 = leaderboard.slice(0, 10);

      const detected: DetectedAgentData[] = [];

      for (let i = 0; i < top10.length; i++) {
        const trader = top10[i];
        setProgress(`Scanning ${i + 1}/${top10.length}: ${trader.userName || trader.proxyWallet.slice(0, 8)}...`);

        try {
          const result: BotDetectionResult = await detectBot(trader.proxyWallet);
          if (result.botScore >= 80) {
            detected.push({
              address: trader.proxyWallet,
              score: result.botScore,
              direction: 'YES',
              positionDelta: trader.volume > 0 ? Math.min(trader.volume * 0.01, 5000) : 1000,
              classification: result.classification,
              strategy: result.strategy.type,
            });
          }
        } catch {
          // Skip wallets que fallan en detección
        }
      }

      setAgents(detected);
      setMarketSlug(input.trim());
      setProgress(detected.length > 0
        ? `${detected.length} agents found (score ≥ 80)`
        : 'No agents with score ≥ 80 detected'
      );
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const loadTopTraders = async () => {
    setLoading(true);
    setAgents([]);
    setProgress('Loading top PnL traders...');

    try {
      const leaderboard = await polymarketService.getLeaderboard();
      const top10 = leaderboard.slice(0, 10);
      const detected: DetectedAgentData[] = [];

      for (let i = 0; i < top10.length; i++) {
        const trader = top10[i];
        setProgress(`Scanning ${i + 1}/${top10.length}: ${trader.userName || trader.proxyWallet.slice(0, 8)}...`);

        try {
          const result: BotDetectionResult = await detectBot(trader.proxyWallet);
          if (result.botScore >= 80) {
            detected.push({
              address: trader.proxyWallet,
              score: result.botScore,
              direction: 'YES',
              positionDelta: trader.volume > 0 ? Math.min(trader.volume * 0.01, 5000) : 1000,
              classification: result.classification,
              strategy: result.strategy.type,
            });
          }
        } catch {
          // Skip
        }
      }

      setAgents(detected);
      setMarketSlug('smart-money-leaderboard');
      setProgress(detected.length > 0
        ? `${detected.length} agents found in top 10 traders`
        : 'No agents detected in top 10'
      );
    } catch (err) {
      setProgress(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-amber-500/20 bg-black/60 overflow-hidden font-mono">
      {/* Terminal header */}
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border-b border-amber-500/20">
        <div className="flex gap-1.5">
          <div className="w-2 h-2 rounded-full bg-red-500/60" />
          <div className="w-2 h-2 rounded-full bg-yellow-500/60" />
          <div className="w-2 h-2 rounded-full bg-green-500/60" />
        </div>
        <span className="text-amber-400 text-[10px]">
          openclaw --detect-agents
        </span>
        {loading && <div className="ml-auto w-2 h-2 rounded-full bg-amber-500 animate-pulse" />}
      </div>

      {/* Input */}
      <div className="p-4 space-y-3">
        <div className="flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleDetect()}
            placeholder="Paste Polymarket market slug..."
            disabled={loading}
            className="flex-1 h-8 px-3 text-[11px] font-mono border border-amber-500/20 bg-black text-foreground placeholder:text-amber-400/20 focus:border-amber-500/40 focus:outline-none"
          />
          <button
            onClick={handleDetect}
            disabled={loading || !input.trim()}
            className="px-4 h-8 text-[10px] border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors disabled:opacity-30"
          >
            DETECT
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-amber-500/10" />
          <span className="text-amber-400/20 text-[9px]">OR</span>
          <div className="h-px flex-1 bg-amber-500/10" />
        </div>

        <button
          onClick={loadTopTraders}
          disabled={loading}
          className="w-full h-8 text-[10px] border border-amber-500/20 text-amber-400/60 hover:text-amber-400 hover:bg-amber-500/5 transition-colors disabled:opacity-30"
        >
          LOAD TOP 10 SMART MONEY TRADERS
        </button>

        {/* Progress */}
        {progress && (
          <div className={`text-[10px] ${loading ? 'text-amber-400/60 animate-pulse' : agents.length > 0 ? 'text-green-400/60' : 'text-amber-400/40'}`}>
            {'>'} {progress}
          </div>
        )}
      </div>

      {/* Signal Panel (reuse existing component) */}
      {agents.length > 0 && (
        <div className="border-t border-amber-500/10">
          <SignalPanel
            detectedAgents={agents.map(a => ({
              address: a.address,
              score: a.score,
              direction: a.direction,
              positionDelta: a.positionDelta,
              outcomePrice: a.outcomePrice,
            }))}
            marketSlug={marketSlug}
          />
        </div>
      )}
    </div>
  );
};
