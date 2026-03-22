// ============================================================
// PerpsTradeCard — Stitch "Execution Terminal" Trade Ticket
// Glass panel with ambient glow, verdict header, data grid,
// TRANSMIT_ORDER_SIGNAL CTA for owner, FOMO overlay for guests
// Paper: Bobby's server-side demo keys, no user auth needed
// Live: Bobby's server-side live keys (user confirms trade)
// ============================================================

import { useState, useEffect } from 'react';

type TradingMode = 'paper' | 'live';

interface PerpsTradeCardProps {
  symbol: string;
  direction: 'long' | 'short';
  conviction: number;
  entryPrice?: number;
  targetPrice?: number;
  stopPrice?: number;
  language?: string;
  isOwner?: boolean;
  tradingMode?: TradingMode;
}

interface MarketInfo {
  markPrice: number;
  change24h: number;
  volume24h: number;
  fundingRate: number;
  maxLeverage: number;
}

export default function PerpsTradeCard({
  symbol, direction, conviction, entryPrice, targetPrice, stopPrice, language = 'en',
  tradingMode: initialMode = 'paper', isOwner = false,
}: PerpsTradeCardProps) {
  const [leverage, setLeverage] = useState(5);
  const getDefaultAmount = (sym: string) => sym === 'BTC' ? '8' : '5';
  const [amount, setAmount] = useState(getDefaultAmount(symbol));
  const [mode, setMode] = useState<TradingMode>(initialMode);
  const [market, setMarket] = useState<MarketInfo | null>(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const isEs = language === 'es';
  const convPct = Math.round(conviction * 100);
  const isLong = direction === 'long';
  const notional = parseFloat(amount) * leverage;

  useEffect(() => { setMode('paper'); }, []);

  useEffect(() => {
    fetch('/api/okx-perps', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'market_info', params: { symbol } }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.ok) {
          if (data.markPrice > 0) {
            const minMargin = Math.ceil((0.01 * data.markPrice) / 5) + 1;
            setAmount(prev => parseFloat(prev) < minMargin ? minMargin.toString() : prev);
          }
          setMarket({ markPrice: data.markPrice, change24h: data.change24h, volume24h: data.volume24h, fundingRate: data.fundingRate, maxLeverage: 125 });
        }
      })
      .catch(() => {});
  }, [symbol]);

  const executePerp = async () => {
    if (mode === 'live') {
      const confirmed = window.confirm(
        isEs
          ? `⚠️ TRADING REAL: ¿Confirmas abrir ${direction.toUpperCase()} ${symbol} ${leverage}x con $${amount} USDT?`
          : `⚠️ LIVE TRADING: Confirm opening ${direction.toUpperCase()} ${symbol} ${leverage}x with $${amount} USDT?`
      );
      if (!confirmed) return;
    }
    setExecuting(true); setError(''); setResult(null);
    try {
      const res = await fetch('/api/okx-perps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'open_position', params: { symbol, direction, leverage, amount: parseFloat(amount), mode } }),
      });
      const data = await res.json();
      if (data.ok) {
        setResult(data);
        if (targetPrice || stopPrice) {
          await fetch('/api/okx-perps', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action: 'set_tpsl', params: { symbol, direction, takeProfit: targetPrice, stopLoss: stopPrice, mode } }),
          });
        }
      } else setError(data.error || 'Order failed');
    } catch { setError('Connection failed'); }
    finally { setExecuting(false); }
  };

  const rrRatio = (entryPrice && targetPrice && stopPrice)
    ? ((targetPrice - entryPrice) / (entryPrice - stopPrice)).toFixed(1) : null;
  const estPnl = market ? (notional * (isLong ? 1 : -1) * ((targetPrice || market.markPrice * 1.05) - market.markPrice) / market.markPrice).toFixed(2) : null;

  return (
    <div className="mt-4 relative">
      {/* Ambient glow behind card */}
      <div className="absolute -inset-4 bg-green-500/5 blur-3xl rounded-full pointer-events-none" />

      <div className="relative border border-white/[0.06] bg-white/[0.02] backdrop-blur-sm rounded-lg font-mono overflow-hidden"
        style={{ borderColor: isLong ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)' }}>

        {/* Conviction bar */}
        <div className="h-1 bg-white/[0.04]">
          <div className={`h-full transition-all ${conviction >= 0.7 ? 'bg-green-500' : conviction >= 0.4 ? 'bg-amber-500' : 'bg-red-500'}`}
            style={{ width: `${convPct}%` }} />
        </div>

        {isOwner ? (
          <div className="p-5">
            {/* Status bar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                <span className="text-[9px] text-green-400 tracking-widest">EXECUTION_TICKET_READY</span>
              </div>
              <span className="text-[8px] text-white/20">#{symbol}-{Date.now().toString(36).slice(-4).toUpperCase()}</span>
            </div>

            {/* Symbol + Direction */}
            <div className="flex items-baseline gap-3 mb-4">
              <span className="text-white text-3xl font-bold tracking-tight">{symbol}/USDT</span>
              <span className={`text-xs font-bold px-2 py-1 rounded ${isLong ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                {direction.toUpperCase()}
              </span>
              <span className="text-white/40 text-sm">{leverage}.0x</span>
            </div>

            {/* Data Grid 2x2 — Stitch style */}
            <div className="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
              {market && (
                <div>
                  <span className="text-[8px] text-white/25 tracking-widest">ENTRY_PRICE</span>
                  <p className="text-white text-sm font-bold">{(entryPrice || market.markPrice).toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                </div>
              )}
              <div>
                <span className="text-[8px] text-white/25 tracking-widest">POSITION_SIZE</span>
                <p className="text-white text-sm font-bold">${amount} USDT</p>
              </div>
              {stopPrice && (
                <div>
                  <span className="text-[8px] text-red-400/50 tracking-widest">STOP_LOSS</span>
                  <p className="text-red-400 text-sm font-bold">{stopPrice.toLocaleString()}</p>
                </div>
              )}
              {targetPrice && (
                <div>
                  <span className="text-[8px] text-green-400/50 tracking-widest">TAKE_PROFIT</span>
                  <p className="text-green-400 text-sm font-bold">{targetPrice.toLocaleString()}</p>
                </div>
              )}
            </div>

            {/* Metrics row */}
            <div className="flex items-center gap-4 text-[9px] text-white/25 mb-5">
              {rrRatio && <span>R:R <span className="text-white/50">{rrRatio}</span></span>}
              {estPnl && <span>EST.PNL <span className={parseFloat(estPnl) >= 0 ? 'text-green-400' : 'text-red-400'}>{parseFloat(estPnl) >= 0 ? '+' : ''}${estPnl}</span></span>}
              {market && <span>FUNDING <span className={market.fundingRate >= 0 ? 'text-green-400/60' : 'text-red-400/60'}>{(market.fundingRate * 100).toFixed(4)}%</span></span>}
            </div>

            {/* Leverage selector */}
            <div className="flex gap-1 mb-4">
              {[3, 5, 10, 20, 50].map(l => (
                <button key={l} onClick={() => setLeverage(l)}
                  className={`flex-1 py-1.5 text-[10px] font-bold rounded transition-all ${
                    leverage === l
                      ? isLong ? 'bg-green-500/20 border border-green-500/40 text-green-400' : 'bg-red-500/20 border border-red-500/40 text-red-400'
                      : 'bg-white/[0.03] border border-white/[0.06] text-white/30 hover:text-white/50'
                  }`}>{l}x</button>
              ))}
            </div>

            {/* CTA */}
            {!result ? (
              <button onClick={executePerp} disabled={executing || conviction < 0.3}
                className={`w-full py-3 rounded text-sm font-bold tracking-[3px] transition-all active:scale-[0.98] ${
                  conviction < 0.3 ? 'bg-white/[0.04] text-white/15 cursor-not-allowed'
                    : executing ? 'bg-white/[0.08] text-white/40'
                    : 'bg-gradient-to-r from-green-500 to-green-600 text-black hover:brightness-110'
                }`}
                style={conviction >= 0.3 && !executing ? { boxShadow: '0 0 20px rgba(34,197,94,0.3)' } : undefined}>
                {executing ? 'TRANSMITTING...'
                  : conviction < 0.3 ? 'INSUFFICIENT_CONVICTION'
                  : `TRANSMIT_ORDER_SIGNAL`}
              </button>
            ) : (
              <div className="p-3 bg-green-500/[0.06] border border-green-500/20 rounded">
                <div className="text-green-400 font-bold text-xs mb-1">{isEs ? 'POSICIÓN ABIERTA' : 'POSITION OPENED'}</div>
                <div className="text-[10px] text-white/60">{result.symbol} {result.direction?.toUpperCase()} {result.leverage}</div>
                <div className="text-[9px] text-white/30 mt-1">Order: {result.orderId}</div>
              </div>
            )}

            {/* Mode indicator */}
            <div className={`mt-3 py-1 text-center text-[8px] tracking-widest rounded ${
              mode === 'live' ? 'bg-red-500/[0.06] text-red-400/60' : 'bg-blue-500/[0.06] text-blue-400/60'
            }`}>
              {mode === 'live' ? '⚠ LIVE TRADING — REAL MONEY' : 'PAPER TRADING — ZERO RISK'}
            </div>
          </div>
        ) : (
          /* === FOMO Overlay — Stitch Restricted Signal === */
          <div className="relative overflow-hidden">
            {/* Blurred background content */}
            <div className="opacity-20 blur-lg pointer-events-none p-5">
              <div className="text-2xl font-bold mb-2">{symbol}/USDT</div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-green-500/20 rounded" />
                <div className="h-8 bg-white/10 rounded" />
                <div className="h-8 bg-red-500/20 rounded" />
                <div className="h-8 bg-green-500/20 rounded" />
              </div>
              <div className="h-10 bg-green-500/20 rounded mt-3" />
            </div>

            {/* Glass overlay */}
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/70 backdrop-blur-[2px] p-6 text-center">
              <div className="w-10 h-10 rounded bg-amber-500/10 flex items-center justify-center border border-amber-500/20 mb-3"
                style={{ boxShadow: '0 0 20px rgba(245,158,11,0.15)' }}>
                <span className="text-amber-400 text-lg">🔒</span>
              </div>
              <span className="text-[11px] font-bold tracking-[3px] text-amber-400 mb-1">
                {isEs ? 'SEÑAL RESTRINGIDA' : 'RESTRICTED SIGNAL'}
              </span>
              <p className="text-[9px] text-white/30 mb-3 max-w-[220px] leading-relaxed">
                {isEs ? 'Conecta tu wallet para desbloquear la terminal de ejecución.' : 'Connect your wallet to unlock the execution terminal.'}
              </p>
              <button className="px-5 py-2 bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/30 text-amber-400 text-[9px] font-bold tracking-widest hover:bg-amber-500/30 transition-all rounded"
                style={{ boxShadow: '0 0 15px rgba(245,158,11,0.1)' }}>
                {isEs ? 'CONECTAR PARA OPERAR ›' : 'CONNECT TO TRADE ›'}
              </button>
            </div>
          </div>
        )}

        {error && <div className="mx-5 mb-3 p-2 bg-red-500/[0.06] border border-red-500/20 rounded text-red-400 text-[10px]">{error}</div>}
      </div>
    </div>
  );
}
