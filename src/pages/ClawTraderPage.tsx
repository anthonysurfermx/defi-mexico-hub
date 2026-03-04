import { useState, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { ClawTraderHero } from '@/components/claw-trader/ClawTraderHero';
import { OnboardingSection } from '@/components/claw-trader/OnboardingSection';
import { AlphaRadar } from '@/components/claw-trader/AlphaRadar';
import { DivergenceScanner } from '@/components/claw-trader/DivergenceScanner';
import { SignalFeed, type SignalEntry } from '@/components/claw-trader/SignalFeed';
import { MarketTimeframeSelector, type DiscoveredMarket } from '@/components/claw-trader/MarketTimeframeSelector';
import { AgentDetectionPanel } from '@/components/claw-trader/AgentDetectionPanel';
import { SmartMoneyCompass } from '@/components/claw-trader/SmartMoneyCompass';
import { RiskDashboard } from '@/components/claw-trader/RiskDashboard';
import { useTraderScan } from '@/hooks/useTraderScan';
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

  // Market selector state
  const [selectedMarket, setSelectedMarket] = useState<DiscoveredMarket | null>(null);
  const [selectedAsset, setSelectedAsset] = useState<string>('BTC');
  const [selectedTimeframe, setSelectedTimeframe] = useState<string>('');
  const marketSectionRef = useRef<HTMLDivElement>(null);

  // 200-trader scan hook
  const { startScan, cancelScan, progress, allResults, botResults, isScanning } = useTraderScan();

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

  const handleMarketSelected = useCallback((market: DiscoveredMarket, asset: string, timeframe: string) => {
    setSelectedMarket(market);
    setSelectedAsset(asset);
    setSelectedTimeframe(timeframe);
  }, []);

  const handleGetStarted = useCallback(() => {
    marketSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Market label for display
  const marketLabel = selectedMarket
    ? `${selectedAsset.toLowerCase()}-${selectedTimeframe}`
    : undefined;

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

        {/* Onboarding — dismissible intro */}
        <OnboardingSection onGetStarted={handleGetStarted} />

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

        {/* Market Timeframe Selector — full width */}
        <div ref={marketSectionRef}>
          <MarketTimeframeSelector
            onMarketSelected={handleMarketSelected}
            onStartScan={startScan}
            isScanning={isScanning}
          />
        </div>

        {/* Two-column layout for detection + risk on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Left: Agent Detection + Smart Money Compass stacked */}
          <div className="space-y-3">
            <AgentDetectionPanel
              isScanning={isScanning}
              progress={progress}
              botResults={botResults}
              allResults={allResults}
              marketLabel={marketLabel}
            />
            <SmartMoneyCompass agents={botResults} />
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
