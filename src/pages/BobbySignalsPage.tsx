// ============================================================
// Bobby Technical Pulse — Bloomberg-terminal style indicator matrix
// Fetches from /api/bobby-intel → technicalIndicators array
// Stitch "Agent Terminal" design system
// ============================================================

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';
import KineticShell from '@/components/kinetic/KineticShell';

// ---- Types ----
interface IndicatorEntry {
  symbol: string;
  timeframe: string;
  indicators: Record<string, any>;
}

interface ParsedIndicator {
  name: string;
  value: string;
  signal: string;
  color: 'green' | 'amber' | 'red';
}

// ---- Helpers ----
function safeNum(v: any): number | null {
  if (v === null || v === undefined) return null;
  const n = Number(v);
  return isNaN(n) ? null : n;
}

function dig(obj: any, ...keys: string[]): any {
  let cur = obj;
  for (const k of keys) {
    if (cur == null || typeof cur !== 'object') return undefined;
    // Try exact key, then uppercase, then lowercase
    cur = cur[k] ?? cur[k.toUpperCase()] ?? cur[k.toLowerCase()];
  }
  return cur;
}

function findValue(obj: any, key: string): any {
  if (obj == null || typeof obj !== 'object') return undefined;
  const lk = key.toLowerCase();
  for (const k of Object.keys(obj)) {
    if (k.toLowerCase() === lk) return obj[k];
  }
  // Recurse into nested objects and arrays
  for (const k of Object.keys(obj)) {
    if (typeof obj[k] === 'object' && obj[k] !== null) {
      const found = findValue(obj[k], key);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function parseIndicators(entry: IndicatorEntry): ParsedIndicator[] {
  const ind = entry.indicators || {};
  const results: ParsedIndicator[] = [];

  // RSI
  const rsiRaw = findValue(ind, 'RSI') ?? dig(ind, 'RSI', 'value') ?? dig(ind, 'RSI');
  const rsiVal = safeNum(typeof rsiRaw === 'object' ? (rsiRaw?.value ?? rsiRaw?.rsi ?? rsiRaw?.RSI) : rsiRaw);
  if (rsiVal !== null) {
    results.push({
      name: 'RSI (14)',
      value: rsiVal.toFixed(1),
      signal: rsiVal < 30 ? 'OVERSOLD' : rsiVal > 70 ? 'OVERBOUGHT' : 'NEUTRAL',
      color: rsiVal < 30 ? 'green' : rsiVal > 70 ? 'red' : 'amber',
    });
  }

  // MACD
  const macdObj = dig(ind, 'MACD') || {};
  const histRaw = findValue(macdObj, 'histogram') ?? findValue(macdObj, 'hist') ?? findValue(macdObj, 'MACD_HIST');
  const histVal = safeNum(typeof histRaw === 'object' ? null : histRaw);
  const macdLine = safeNum(findValue(macdObj, 'macd') ?? findValue(macdObj, 'DIF') ?? findValue(macdObj, 'MACD'));
  if (histVal !== null) {
    results.push({
      name: 'MACD',
      value: `H: ${histVal.toFixed(2)}`,
      signal: histVal > 0 ? 'BULLISH' : 'BEARISH',
      color: histVal > 0 ? 'green' : 'red',
    });
  } else if (macdLine !== null) {
    results.push({
      name: 'MACD',
      value: macdLine.toFixed(2),
      signal: macdLine > 0 ? 'BULLISH' : 'BEARISH',
      color: macdLine > 0 ? 'green' : 'red',
    });
  }

  // Bollinger Bands
  const bbObj = dig(ind, 'BB') || {};
  const bbUpper = safeNum(findValue(bbObj, 'upper') ?? findValue(bbObj, 'UB'));
  const bbLower = safeNum(findValue(bbObj, 'lower') ?? findValue(bbObj, 'LB'));
  const bbMid = safeNum(findValue(bbObj, 'middle') ?? findValue(bbObj, 'MB'));
  const bbWidth = bbUpper !== null && bbLower !== null ? bbUpper - bbLower : null;
  if (bbUpper !== null && bbLower !== null) {
    const squeeze = bbWidth !== null && bbMid !== null && bbWidth / bbMid < 0.02;
    results.push({
      name: 'BOLLINGER',
      value: squeeze ? 'TIGHT' : `W: ${bbWidth?.toFixed(0)}`,
      signal: squeeze ? 'SQUEEZE' : 'NEUTRAL',
      color: squeeze ? 'amber' : 'amber',
    });
  }

  // MA 50 / 200
  const maObj = dig(ind, 'MA') || {};
  const ma50 = safeNum(findValue(maObj, 'MA50') ?? findValue(maObj, '50'));
  const ma200 = safeNum(findValue(maObj, 'MA200') ?? findValue(maObj, '200'));
  if (ma50 !== null && ma200 !== null) {
    results.push({
      name: 'MA 50/200',
      value: `${(ma50 / 1000).toFixed(1)}K / ${(ma200 / 1000).toFixed(1)}K`,
      signal: ma50 > ma200 ? 'GOLDEN_CROSS' : 'DEATH_CROSS',
      color: ma50 > ma200 ? 'green' : 'red',
    });
  }

  // SuperTrend
  const stObj = dig(ind, 'SUPERTREND') || {};
  const stDir = findValue(stObj, 'direction') ?? findValue(stObj, 'trend') ?? findValue(stObj, 'signal');
  const stVal = findValue(stObj, 'value') ?? findValue(stObj, 'supertrend');
  if (stDir !== undefined || stVal !== undefined) {
    const dirStr = String(stDir ?? stVal ?? '').toLowerCase();
    const isBull = dirStr.includes('bull') || dirStr.includes('up') || dirStr.includes('long') || dirStr === '1';
    results.push({
      name: 'SUPERTREND',
      value: safeNum(stVal) !== null ? Number(stVal).toFixed(0) : String(stDir ?? '--').toUpperCase(),
      signal: isBull ? 'BULLISH' : 'BEARISH',
      color: isBull ? 'green' : 'red',
    });
  }

  // AHR999
  const ahrObj = dig(ind, 'AHR999') || {};
  const ahrVal = safeNum(findValue(ahrObj, 'ahr999') ?? findValue(ahrObj, 'value') ?? (typeof ahrObj === 'number' ? ahrObj : null));
  if (ahrVal !== null) {
    results.push({
      name: 'AHR999',
      value: ahrVal.toFixed(3),
      signal: ahrVal < 0.45 ? 'BUY_ZONE' : ahrVal > 1.2 ? 'OVERVALUED' : 'HOLD',
      color: ahrVal < 0.45 ? 'green' : ahrVal > 1.2 ? 'red' : 'amber',
    });
  }

  // EMA 12 / 26
  const emaObj = dig(ind, 'EMA') || {};
  const ema12 = safeNum(findValue(emaObj, 'EMA12') ?? findValue(emaObj, '12'));
  const ema26 = safeNum(findValue(emaObj, 'EMA26') ?? findValue(emaObj, '26'));
  if (ema12 !== null && ema26 !== null) {
    results.push({
      name: 'EMA 12/26',
      value: `${(ema12 / 1000).toFixed(1)}K / ${(ema26 / 1000).toFixed(1)}K`,
      signal: ema12 > ema26 ? 'BULLISH' : 'BEARISH',
      color: ema12 > ema26 ? 'green' : 'red',
    });
  }

  // KDJ
  const kdjObj = dig(ind, 'KDJ') || {};
  const kdjK = safeNum(findValue(kdjObj, 'K') ?? findValue(kdjObj, 'k'));
  const kdjD = safeNum(findValue(kdjObj, 'D') ?? findValue(kdjObj, 'd'));
  if (kdjK !== null && kdjD !== null) {
    results.push({
      name: 'KDJ',
      value: `K:${kdjK.toFixed(0)} D:${kdjD.toFixed(0)}`,
      signal: kdjK > kdjD ? 'BULLISH' : 'BEARISH',
      color: kdjK > kdjD ? 'green' : 'red',
    });
  }

  // ATR
  const atrObj = dig(ind, 'ATR') || {};
  const atrVal = safeNum(findValue(atrObj, 'ATR') ?? findValue(atrObj, 'value') ?? (typeof atrObj === 'number' ? atrObj : null));
  if (atrVal !== null) {
    results.push({
      name: 'ATR (14)',
      value: atrVal.toFixed(1),
      signal: 'NEUTRAL',
      color: 'amber',
    });
  }

  // BTC Rainbow
  const rainbowObj = dig(ind, 'BTCRAINBOW') || {};
  const bandName = findValue(rainbowObj, 'band') ?? findValue(rainbowObj, 'zone') ?? findValue(rainbowObj, 'color') ?? findValue(rainbowObj, 'value');
  if (bandName !== undefined && bandName !== null) {
    const bandStr = String(bandName).toUpperCase();
    const isCheap = bandStr.includes('FIRE') || bandStr.includes('BUY') || bandStr.includes('ACCUM') || bandStr.includes('CHEAP');
    const isExpensive = bandStr.includes('SELL') || bandStr.includes('BUBBLE') || bandStr.includes('FOMO') || bandStr.includes('RED');
    results.push({
      name: 'BTC RAINBOW',
      value: bandStr.length > 16 ? bandStr.slice(0, 16) + '..' : bandStr,
      signal: isCheap ? 'BUY_ZONE' : isExpensive ? 'OVERVALUED' : 'HOLD',
      color: isCheap ? 'green' : isExpensive ? 'red' : 'amber',
    });
  }

  return results;
}

function computeScore(indicators: ParsedIndicator[]): number {
  if (indicators.length === 0) return 5;
  let score = 0;
  for (const ind of indicators) {
    if (ind.color === 'green') score += 1;
    else if (ind.color === 'amber') score += 0.5;
    // red = 0
  }
  return Math.round((score / indicators.length) * 10 * 10) / 10; // 0-10, 1 decimal
}

function biasLabel(score: number): string {
  if (score >= 6) return 'BULLISH_BIAS';
  if (score >= 4) return 'NEUTRAL';
  return 'BEARISH_BIAS';
}

function scoreColor(score: number): string {
  if (score >= 6) return 'text-green-400';
  if (score >= 4) return 'text-amber-400';
  return 'text-red-400';
}

function signalBadgeColor(color: 'green' | 'amber' | 'red'): string {
  if (color === 'green') return 'text-green-400 border-green-500/30 bg-green-500/10';
  if (color === 'red') return 'text-red-400 border-red-500/30 bg-red-500/10';
  return 'text-amber-400 border-amber-500/30 bg-amber-500/10';
}

// ---- Loading State ----
function TerminalLoader() {
  const steps = [
    '> CONNECTING TO OKX AGENT TRADE KIT...',
    '> LOADING 70+ TECHNICAL INDICATORS...',
    '> COMPUTING SIGNAL WEIGHTS...',
  ];
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= steps.length) return;
    const timer = setTimeout(() => setStep(s => s + 1), 800);
    return () => clearTimeout(timer);
  }, [step]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="font-mono text-[11px] space-y-2 text-green-400/70">
        {steps.slice(0, step + 1).map((s, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {s}
            {i === step && i < steps.length - 1 && (
              <span className="animate-pulse ml-1">_</span>
            )}
          </motion.div>
        ))}
        {step >= steps.length && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-white/30 mt-4"
          >
            {'>'} RENDERING MATRIX...
          </motion.div>
        )}
      </div>
    </div>
  );
}

// ---- Main Page ----
export default function BobbySignalsPage() {
  const [data, setData] = useState<IndicatorEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetch('/api/bobby-signals')
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(d => {
        const ti = d?.indicators;
        if (Array.isArray(ti) && ti.length > 0) {
          // Adapt cached format: convert {bias, score, weight, raw} to flat indicator values
          const adapted = ti.map((entry: any) => {
            const indicators: Record<string, any> = {};
            for (const [name, reading] of Object.entries(entry.indicators || {})) {
              const r = reading as any;
              // Use raw data if available, otherwise construct from score/bias
              indicators[name] = r.raw || { value: r.score, bias: r.bias };
            }
            return { ...entry, indicators };
          });
          setData(adapted);
        } else {
          setError('No technical indicator data available. Waiting for next Bobby cycle.');
        }
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Merge all indicators from all entries (BTC + ETH)
  const allParsed: { symbol: string; indicators: ParsedIndicator[] }[] = data.map(entry => ({
    symbol: entry.symbol.replace('-USDT', ''),
    indicators: parseIndicators(entry),
  }));

  // Use first entry (BTC) as primary for the score
  const primaryIndicators = allParsed[0]?.indicators || [];
  const score = computeScore(primaryIndicators);
  const bias = biasLabel(score);
  const color = scoreColor(score);

  // Net-flow bar percentages
  const totalCount = primaryIndicators.length || 1;
  const greenPct = (primaryIndicators.filter(i => i.color === 'green').length / totalCount) * 100;
  const amberPct = (primaryIndicators.filter(i => i.color === 'amber').length / totalCount) * 100;
  const redPct = (primaryIndicators.filter(i => i.color === 'red').length / totalCount) * 100;

  return (
    <KineticShell activeTab="signals">
      <Helmet>
        <title>Technical Pulse | Bobby Agent Trader</title>
      </Helmet>

      <div className="min-h-screen bg-[#050505] pb-20 md:pb-8">
        {loading ? (
          <TerminalLoader />
        ) : error ? (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="font-mono text-[11px] text-red-400/70">
              <p>{'>'} ERROR: {error}</p>
              <p className="text-white/20 mt-2">{'>'} RETRY IN 30s OR REFRESH</p>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-4xl mx-auto px-4 py-6 space-y-4"
          >
            {/* 1. HEADER ROW */}
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-white/40 tracking-widest">TECHNICAL_PULSE</span>
              <span className="font-mono text-[8px] text-green-400/60 border border-green-500/20 px-2 py-0.5 rounded-sm">
                PWR: OKX_AGENT_TRADE_KIT
              </span>
            </div>

            {/* 2. THE ANCHOR */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
              <div className="flex items-baseline gap-3">
                <span className={`font-mono text-3xl font-bold tabular-nums ${color}`}>
                  {score.toFixed(1)}
                </span>
                <span className={`font-mono text-xs font-bold tracking-widest ${color}`}>
                  [{bias}]
                </span>
                <span className="font-mono text-[8px] text-white/20 ml-auto tracking-widest">
                  COMPOSITE_SCORE / 10
                </span>
              </div>
            </div>

            {/* 3. NET-FLOW BAR */}
            <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono text-[8px] text-white/30 tracking-widest">NET_FLOW</span>
                <span className="font-mono text-[8px] text-white/20 tracking-widest">
                  {primaryIndicators.filter(i => i.color === 'green').length}B / {primaryIndicators.filter(i => i.color === 'amber').length}N / {primaryIndicators.filter(i => i.color === 'red').length}R
                </span>
              </div>
              <div className="h-1 w-full rounded-full overflow-hidden flex bg-white/[0.03]">
                {greenPct > 0 && (
                  <div className="h-full bg-green-500" style={{ width: `${greenPct}%` }} />
                )}
                {amberPct > 0 && (
                  <div className="h-full bg-amber-500" style={{ width: `${amberPct}%` }} />
                )}
                {redPct > 0 && (
                  <div className="h-full bg-red-500" style={{ width: `${redPct}%` }} />
                )}
              </div>
            </div>

            {/* 4. THE MATRIX — per symbol */}
            {allParsed.map(({ symbol, indicators }) => {
              if (indicators.length === 0) return null;
              // Mobile: show top 5, toggle rest
              const visibleIndicators = showAll ? indicators : indicators;
              const mobileVisible = indicators.slice(0, 5);
              const mobileHidden = indicators.slice(5);

              return (
                <div key={symbol} className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-[10px] text-white/50 tracking-widest">{symbol}_INDICATORS</span>
                    <span className="font-mono text-[8px] text-white/20 tracking-widest">1H_TIMEFRAME</span>
                  </div>

                  {/* Desktop: 2-column grid */}
                  <div className="hidden md:grid md:grid-cols-2 gap-x-4 gap-y-1">
                    {visibleIndicators.map((ind, i) => (
                      <IndicatorRow key={i} ind={ind} />
                    ))}
                  </div>

                  {/* Mobile: show top 5 + toggle */}
                  <div className="md:hidden space-y-1">
                    {mobileVisible.map((ind, i) => (
                      <IndicatorRow key={i} ind={ind} />
                    ))}

                    {mobileHidden.length > 0 && !showAll && (
                      <button
                        onClick={() => setShowAll(true)}
                        className="w-full mt-2 py-1.5 font-mono text-[10px] text-green-400/60 border border-white/[0.04] rounded-sm hover:bg-white/[0.02] transition-colors tracking-widest"
                      >
                        [+ {mobileHidden.length} MORE SIGNALS]
                      </button>
                    )}

                    {showAll && mobileHidden.map((ind, i) => (
                      <IndicatorRow key={`extra-${i}`} ind={ind} />
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Footer */}
            <div className="text-center font-mono text-[8px] text-white/15 tracking-widest pt-2">
              DATA_SOURCE: OKX_AGENT_TRADE_KIT &middot; REFRESH: EVERY_CYCLE
            </div>
          </motion.div>
        )}
      </div>
    </KineticShell>
  );
}

// ---- Indicator Row Component ----
function IndicatorRow({ ind }: { ind: ParsedIndicator }) {
  return (
    <div className="flex items-center justify-between py-1 border-b border-white/[0.03] last:border-0">
      <span className="font-mono text-[10px] text-white/50 w-24 shrink-0">{ind.name}</span>
      <span className="font-mono text-[10px] font-bold text-white/80 tabular-nums flex-1 text-right mr-2">
        {ind.value}
      </span>
      <span className={`font-mono text-[9px] px-1.5 py-0.5 rounded-sm border shrink-0 ${signalBadgeColor(ind.color)}`}>
        {ind.signal}
      </span>
    </div>
  );
}
