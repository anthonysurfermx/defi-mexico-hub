import { useState, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { ClawTraderHero } from '@/components/claw-trader/ClawTraderHero';
import { AlphaRadar } from '@/components/claw-trader/AlphaRadar';
import { DivergenceScanner } from '@/components/claw-trader/DivergenceScanner';
import { SignalFeed, type SignalEntry } from '@/components/claw-trader/SignalFeed';
import { AgentDetectionPanel } from '@/components/claw-trader/AgentDetectionPanel';
import { SmartMoneyCompass } from '@/components/claw-trader/SmartMoneyCompass';
import { RiskDashboard } from '@/components/claw-trader/RiskDashboard';
import type { SignalResponse } from '@/lib/onchainos/types';

const MAX_SIGNALS = 50;

export default function ClawTraderPage() {
  const [livePrices, setLivePrices] = useState<Record<string, number>>({});
  const [signals, setSignals] = useState<SignalEntry[]>([]);
  const [connectionStatus, setConnectionStatus] = useState({
    connected: false,
    tradingEnabled: false,
    maxPositionUsdc: '100',
    minDivergence: '3',
    maxLeverage: '5',
  });

  const handlePricesUpdate = useCallback((prices: Record<string, number>) => {
    setLivePrices(prices);
  }, []);

  const handleStatusUpdate = useCallback((status: {
    connected: boolean;
    tradingEnabled: boolean;
    maxPositionUsdc: string;
    minDivergence: string;
    maxLeverage?: string;
  }) => {
    setConnectionStatus({
      connected: status.connected,
      tradingEnabled: status.tradingEnabled,
      maxPositionUsdc: status.maxPositionUsdc,
      minDivergence: status.minDivergence,
      maxLeverage: status.maxLeverage || '5',
    });
  }, []);

  const handleSignal = useCallback((signal: SignalResponse & { timestamp: number; instrument: string }) => {
    setSignals(prev => {
      const entry: SignalEntry = signal;
      const updated = [entry, ...prev];
      return updated.slice(0, MAX_SIGNALS);
    });
  }, []);

  const clearSignals = useCallback(() => {
    setSignals([]);
  }, []);

  const [detectedAgents, setDetectedAgents] = useState<Array<{
    address: string;
    score: number;
    direction: 'YES' | 'NO';
    positionDelta: number;
    outcomePrice?: number;
    classification: string;
    strategy: string;
  }>>([]);

  const handleAgentsDetected = useCallback((agents: typeof detectedAgents) => {
    setDetectedAgents(agents);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Claw Trader | DeFi Hub México</title>
        <meta name="description" content="OpenClaw Signal Executor — Detect agent signals on Polymarket, scan OKX divergence, and execute trades autonomously." />
      </Helmet>

      <div className="container mx-auto px-4 py-6 space-y-3">
        {/* Section A: Hero + Status + Prices */}
        <ClawTraderHero
          onPricesUpdate={handlePricesUpdate}
          onStatusUpdate={handleStatusUpdate}
        />

        {/* Alpha Radar — full width, ranked opportunities */}
        <AlphaRadar
          livePrices={livePrices}
          onSignal={handleSignal}
        />

        {/* Two-column layout for scanner + feed on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Section B: Divergence Scanner */}
          <DivergenceScanner
            livePrices={livePrices}
            onSignal={handleSignal}
          />

          {/* Section C: Signal Feed */}
          <SignalFeed
            signals={signals}
            onClear={clearSignals}
          />
        </div>

        {/* Two-column layout for detection + risk on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: Agent Detection + Smart Money Compass stacked */}
          <div className="space-y-3">
            <AgentDetectionPanel onAgentsDetected={handleAgentsDetected} />
            <SmartMoneyCompass agents={detectedAgents} />
          </div>

          {/* Right: Risk Dashboard */}
          <RiskDashboard
            signals={signals}
            maxPositionUsdc={connectionStatus.maxPositionUsdc}
            minDivergence={connectionStatus.minDivergence}
            maxLeverage={connectionStatus.maxLeverage}
            tradingEnabled={connectionStatus.tradingEnabled}
          />
        </div>
      </div>
    </div>
  );
}
