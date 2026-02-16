import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Globe,
  DollarSign,
  BarChart3,
  Building2,
  Loader2,
  Coins,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CHART_COLORS } from '@/components/charts/DefiChartTheme';

// ── Types ───────────────────────────────────────────────────────────
interface Ticker {
  base: string;
  target: string;
  last: number;
  volume: number;
  converted_volume: { usd: number };
  bid_ask_spread_percentage: number | null;
  trust_score: string | null;
}

interface ExchangeResult {
  id: string;
  name: string;
  tickers: Ticker[];
  latamPairs: LatamPair[];
}

interface LatamPair {
  exchange: string;
  exchangeId: string;
  base: string;
  target: string;
  pair: string;
  volumeUSD: number;
  spread: number | null;
  trustScore: string | null;
}

interface CountryData {
  code: string;
  country: string;
  flag: string;
  color: string;
  exchangeCount: number;
  pairCount: number;
  volumeUSD: number;
}

interface LatamStablecoin {
  name: string;
  symbol: string;
  pegType: string;
  pegLabel: string;
  chains: string[];
  circulating: number;
  color: string;
}

// ── Constants ────────────────────────────────────────────────────────
const LATAM_CURRENCIES = ['MXN', 'BRL', 'ARS', 'COP', 'CLP', 'PEN', 'UYU'];

const CURRENCY_META: Record<string, { country: string; flag: string; color: string }> = {
  MXN: { country: 'Mexico', flag: '🇲🇽', color: '#006847' },
  BRL: { country: 'Brazil', flag: '🇧🇷', color: '#009739' },
  ARS: { country: 'Argentina', flag: '🇦🇷', color: '#75AADB' },
  COP: { country: 'Colombia', flag: '🇨🇴', color: '#FCD116' },
  CLP: { country: 'Chile', flag: '🇨🇱', color: '#D52B1E' },
  PEN: { country: 'Peru', flag: '🇵🇪', color: '#D91023' },
  UYU: { country: 'Uruguay', flag: '🇺🇾', color: '#001489' },
};

const EXCHANGES = [
  { id: 'binance', name: 'Binance', type: 'Global' },
  { id: 'okex', name: 'OKX', type: 'Global' },
  { id: 'bybit_spot', name: 'Bybit', type: 'Global' },
  { id: 'bitget', name: 'Bitget', type: 'Global' },
  { id: 'kucoin', name: 'KuCoin', type: 'Global' },
  { id: 'gate', name: 'Gate.io', type: 'Global' },
  { id: 'bingx', name: 'BingX', type: 'Global' },
  { id: 'bitso', name: 'Bitso', type: 'LATAM' },
  { id: 'mercado_bitcoin', name: 'Mercado Bitcoin', type: 'LATAM' },
  { id: 'foxbit', name: 'Foxbit', type: 'LATAM' },
];

const LATAM_CACHE_TTL = 15 * 60 * 1000; // 15 min
let latamCache: { data: ExchangeResult[]; ts: number } | null = null;

// ── Helpers ──────────────────────────────────────────────────────────
function fmt(value: number, decimals = 1): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(decimals)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(decimals)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(decimals)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(decimals)}K`;
  return `$${value.toFixed(0)}`;
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchExchangeTickers(exchangeId: string): Promise<Ticker[]> {
  const allTickers: Ticker[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `https://api.coingecko.com/api/v3/exchanges/${exchangeId}/tickers?page=${page}`
    );
    if (!res.ok) break;
    const data = await res.json();
    const tickers = data.tickers || [];
    allTickers.push(...tickers);
    if (tickers.length < 100) break; // last page
    await sleep(2200); // rate limit: ~30 req/min
  }
  return allTickers;
}

// ── Component ────────────────────────────────────────────────────────
export default function LatamExchangesTab() {
  const { t } = useTranslation();
  const [results, setResults] = useState<ExchangeResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanProgress, setScanProgress] = useState({ current: 0, total: EXCHANGES.length });
  const [stablecoins, setStablecoins] = useState<LatamStablecoin[]>([]);

  const fetchLatamData = useCallback(async () => {
    // Check cache
    if (latamCache && Date.now() - latamCache.ts < LATAM_CACHE_TTL) {
      setResults(latamCache.data);
      setScanProgress({ current: EXCHANGES.length, total: EXCHANGES.length });
      setLoading(false);
      return;
    }

    setLoading(true);
    const exchangeResults: ExchangeResult[] = [];

    for (let i = 0; i < EXCHANGES.length; i++) {
      const ex = EXCHANGES[i];
      setScanProgress({ current: i + 1, total: EXCHANGES.length });

      try {
        const tickers = await fetchExchangeTickers(ex.id);
        const latamPairs: LatamPair[] = tickers
          .filter(t => LATAM_CURRENCIES.includes(t.target.toUpperCase()))
          .map(t => ({
            exchange: ex.name,
            exchangeId: ex.id,
            base: t.base,
            target: t.target.toUpperCase(),
            pair: `${t.base}/${t.target.toUpperCase()}`,
            volumeUSD: t.converted_volume?.usd || 0,
            spread: t.bid_ask_spread_percentage,
            trustScore: t.trust_score,
          }));

        exchangeResults.push({
          id: ex.id,
          name: ex.name,
          tickers,
          latamPairs,
        });
      } catch (err) {
        console.error(`Error fetching ${ex.name}:`, err);
        exchangeResults.push({
          id: ex.id,
          name: ex.name,
          tickers: [],
          latamPairs: [],
        });
      }

      // Update results progressively
      setResults([...exchangeResults]);
      await sleep(2200);
    }

    latamCache = { data: exchangeResults, ts: Date.now() };
    setLoading(false);
  }, []);

  const fetchStablecoins = useCallback(async () => {
    try {
      const res = await fetch('https://stablecoins.llama.fi/stablecoins?includePrices=true');
      if (!res.ok) return;
      const data = await res.json();
      const latamPegs = ['peggedMXN', 'peggedREAL', 'peggedARS'];
      const pegLabels: Record<string, string> = {
        peggedMXN: 'MXN',
        peggedREAL: 'BRL',
        peggedARS: 'ARS',
      };
      const pegColors: Record<string, string> = {
        peggedMXN: '#006847',
        peggedREAL: '#009739',
        peggedARS: '#75AADB',
      };

      const found: LatamStablecoin[] = data.peggedAssets
        .filter((a: { pegType: string }) => latamPegs.includes(a.pegType))
        .map((a: { name: string; symbol: string; pegType: string; chains: string[]; circulating: Record<string, number> }) => ({
          name: a.name,
          symbol: a.symbol,
          pegType: a.pegType,
          pegLabel: pegLabels[a.pegType] || a.pegType,
          chains: a.chains || [],
          circulating: Object.values(a.circulating || {}).reduce(
            (sum: number, v) => sum + (typeof v === 'number' ? v : 0),
            0
          ),
          color: pegColors[a.pegType] || '#6B7280',
        }))
        .filter((s: LatamStablecoin) => s.circulating > 0)
        .sort((a: LatamStablecoin, b: LatamStablecoin) => b.circulating - a.circulating);

      setStablecoins(found);
    } catch (err) {
      console.error('Error fetching LATAM stablecoins:', err);
    }
  }, []);

  useEffect(() => {
    fetchLatamData();
    fetchStablecoins();
  }, [fetchLatamData, fetchStablecoins]);

  // ── Computed data ──────────────────────────────────────────────────
  const allPairs = results.flatMap(r => r.latamPairs);
  const totalPairs = allPairs.length;
  const exchangesWithPairs = results.filter(r => r.latamPairs.length > 0).length;
  const totalVolume = allPairs.reduce((s, p) => s + p.volumeUSD, 0);

  // Currency with most pairs
  const pairsByCurrency: Record<string, number> = {};
  allPairs.forEach(p => {
    pairsByCurrency[p.target] = (pairsByCurrency[p.target] || 0) + 1;
  });
  const topCurrency = Object.entries(pairsByCurrency).sort((a, b) => b[1] - a[1])[0];

  // Country data for bar chart
  const countryData: CountryData[] = LATAM_CURRENCIES.map(code => {
    const meta = CURRENCY_META[code];
    const pairs = allPairs.filter(p => p.target === code);
    const exchanges = new Set(pairs.map(p => p.exchangeId));
    return {
      code,
      country: meta.country,
      flag: meta.flag,
      color: meta.color,
      exchangeCount: exchanges.size,
      pairCount: pairs.length,
      volumeUSD: pairs.reduce((s, p) => s + p.volumeUSD, 0),
    };
  }).filter(c => c.pairCount > 0).sort((a, b) => b.pairCount - a.pairCount);

  // Heat map data
  const heatmapData = results
    .filter(r => r.latamPairs.length > 0)
    .map(r => {
      const byCurrency: Record<string, number> = {};
      let totalVol = 0;
      LATAM_CURRENCIES.forEach(c => { byCurrency[c] = 0; });
      r.latamPairs.forEach(p => {
        byCurrency[p.target] = (byCurrency[p.target] || 0) + 1;
        totalVol += p.volumeUSD;
      });
      return {
        name: r.name,
        id: r.id,
        byCurrency,
        totalPairs: r.latamPairs.length,
        totalVolume: totalVol,
      };
    })
    .sort((a, b) => b.totalPairs - a.totalPairs);

  // Top pairs by volume
  const topPairs = [...allPairs]
    .sort((a, b) => b.volumeUSD - a.volumeUSD)
    .slice(0, 20);

  // ── Scan progress bar ──────────────────────────────────────────────
  const isScanning = loading && scanProgress.current < scanProgress.total;

  // ── Custom Tooltip for country chart ───────────────────────────────
  function CountryTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: CountryData }> }) {
    if (!active || !payload?.[0]) return null;
    const d = payload[0].payload;
    return (
      <div className="rounded-lg border bg-background/95 backdrop-blur px-3 py-2 text-xs shadow-lg">
        <div className="font-semibold">{d.flag} {d.country} ({d.code})</div>
        <div className="text-muted-foreground">{d.pairCount} {t('metrics.latam.pairs')}</div>
        <div className="text-muted-foreground">{d.exchangeCount} {t('metrics.latam.exchanges')}</div>
        <div className="text-muted-foreground">{fmt(d.volumeUSD)}</div>
      </div>
    );
  }

  function PairCountLabel(props: { x?: number; y?: number; width?: number; value?: number }) {
    const { x, y, width, value } = props;
    if (!x || !y || !width || !value) return null;
    return (
      <text x={x + width + 6} y={(y ?? 0) + 15} fill={CHART_COLORS.textLight} fontSize={12} fontWeight={600}>
        {value}
      </text>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Hero */}
      <div className="text-center space-y-2">
        <Badge variant="outline">
          <Globe className="w-3 h-3 mr-1" />
          {t('metrics.latam.badge')}
        </Badge>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-bold">
          {t('metrics.latam.title')}
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          {t('metrics.latam.subtitle')}
        </p>
      </div>

      {/* Scanning progress */}
      {isScanning && (
        <Card className="border-blue-500/20 bg-blue-500/5">
          <CardContent className="pt-4 pb-4 px-4 flex items-center gap-3">
            <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
            <div className="flex-1">
              <div className="text-sm font-medium">{t('metrics.latam.scanning')}</div>
              <div className="text-xs text-muted-foreground">
                {t('metrics.latam.scanProgress', { current: scanProgress.current, total: scanProgress.total })}
              </div>
              <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-500"
                  style={{ width: `${(scanProgress.current / scanProgress.total) * 100}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 1: KPI Cards ──────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <BarChart3 className="w-3.5 h-3.5" />
              {t('metrics.latam.totalPairs')}
            </div>
            {results.length === 0 ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-foreground">{totalPairs}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Building2 className="w-3.5 h-3.5" />
              {t('metrics.latam.totalExchanges')}
            </div>
            {results.length === 0 ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {exchangesWithPairs} / {EXCHANGES.length}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <Coins className="w-3.5 h-3.5" />
              {t('metrics.latam.topCurrency')}
            </div>
            {results.length === 0 ? (
              <Skeleton className="h-8 w-20" />
            ) : topCurrency ? (
              <div className="text-xl sm:text-2xl font-bold text-foreground">
                {CURRENCY_META[topCurrency[0]]?.flag} {topCurrency[0]}
                <span className="text-sm text-muted-foreground ml-1">({topCurrency[1]})</span>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">{t('metrics.latam.noData')}</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 pb-4 px-4">
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              {t('metrics.latam.totalVolume')}
            </div>
            {results.length === 0 ? (
              <Skeleton className="h-8 w-20" />
            ) : (
              <div className="text-xl sm:text-2xl font-bold text-foreground">{fmt(totalVolume)}</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Section 2: Exchange Presence Heat Map ─────────────────── */}
      {heatmapData.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('metrics.latam.heatmap')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('metrics.latam.heatmapDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[600px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.latam.exchange')}</th>
                    {LATAM_CURRENCIES.filter(c => countryData.some(cd => cd.code === c)).map(c => (
                      <th key={c} className="text-center p-2 sm:p-3 font-medium">
                        {CURRENCY_META[c].flag} {c}
                      </th>
                    ))}
                    <th className="text-center p-2 sm:p-3 font-medium">{t('metrics.latam.totalPairsCol')}</th>
                    <th className="text-right p-2 sm:p-3 font-medium">{t('metrics.latam.volume24h')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {heatmapData.map(row => (
                    <tr key={row.id} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2 sm:p-3 font-medium">{row.name}</td>
                      {LATAM_CURRENCIES.filter(c => countryData.some(cd => cd.code === c)).map(c => {
                        const count = row.byCurrency[c] || 0;
                        const opacity = count === 0 ? 0 : Math.min(0.15 + count * 0.12, 0.8);
                        return (
                          <td key={c} className="text-center p-2 sm:p-3">
                            <span
                              className="inline-flex items-center justify-center w-8 h-8 rounded-md text-xs font-bold"
                              style={{
                                backgroundColor: count > 0 ? CURRENCY_META[c].color : undefined,
                                opacity: count > 0 ? opacity : 1,
                                color: count > 0 ? '#fff' : CHART_COLORS.textMuted,
                              }}
                            >
                              {count || '-'}
                            </span>
                          </td>
                        );
                      })}
                      <td className="text-center p-2 sm:p-3 font-mono font-bold">{row.totalPairs}</td>
                      <td className="text-right p-2 sm:p-3 font-mono">{fmt(row.totalVolume)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 3: Pairs by Country (bar chart) ──────────────── */}
      {countryData.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('metrics.latam.pairsByCountry')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('metrics.latam.pairsByCountryDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="w-full h-[280px] sm:h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={countryData} layout="vertical" margin={{ left: 10, right: 50, top: 0, bottom: 0 }}>
                  <XAxis type="number" hide />
                  <YAxis
                    type="category"
                    dataKey="code"
                    width={50}
                    tick={({ x, y, payload }: { x: number; y: number; payload: { value: string } }) => {
                      const meta = CURRENCY_META[payload.value];
                      return (
                        <text x={x} y={y} dy={4} textAnchor="end" fill={CHART_COLORS.textLight} fontSize={13}>
                          {meta?.flag} {payload.value}
                        </text>
                      );
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <RechartsTooltip content={<CountryTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
                  <Bar dataKey="pairCount" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {countryData.map((d, i) => <Cell key={i} fill={d.color} />)}
                    <LabelList content={<PairCountLabel />} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Country details below chart */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-border/50">
              {countryData.map(c => (
                <div key={c.code} className="text-xs space-y-0.5">
                  <div className="font-semibold">{c.flag} {c.country}</div>
                  <div className="text-muted-foreground">
                    {c.exchangeCount} {t('metrics.latam.exchanges')}, {c.pairCount} {t('metrics.latam.pairs')}
                  </div>
                  <div className="text-muted-foreground">{fmt(c.volumeUSD)} vol</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 4: Top LATAM Fiat Pairs by Volume ────────────── */}
      {topPairs.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('metrics.latam.topPairs')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('metrics.latam.topPairsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[480px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium w-10">#</th>
                    <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.latam.pair')}</th>
                    <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.latam.exchange')}</th>
                    <th className="text-right p-2 sm:p-3 font-medium">{t('metrics.latam.volume24h')}</th>
                    <th className="text-right p-2 sm:p-3 font-medium hidden sm:table-cell">{t('metrics.latam.spread')}</th>
                    <th className="text-center p-2 sm:p-3 font-medium hidden sm:table-cell">{t('metrics.latam.trust')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topPairs.map((p, i) => (
                    <tr key={`${p.pair}-${p.exchange}-${i}`} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2 sm:p-3 text-muted-foreground">{i + 1}</td>
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-medium">{p.base}/{p.target}</span>
                          <span className="text-[10px]">{CURRENCY_META[p.target]?.flag}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3 text-muted-foreground">{p.exchange}</td>
                      <td className="p-2 sm:p-3 text-right font-mono">{fmt(p.volumeUSD)}</td>
                      <td className="p-2 sm:p-3 text-right font-mono text-muted-foreground hidden sm:table-cell">
                        {p.spread !== null ? `${p.spread.toFixed(2)}%` : '-'}
                      </td>
                      <td className="p-2 sm:p-3 text-center hidden sm:table-cell">
                        <span
                          className="inline-block w-2.5 h-2.5 rounded-full"
                          style={{
                            backgroundColor:
                              p.trustScore === 'green' ? '#22c55e' :
                              p.trustScore === 'yellow' ? '#eab308' :
                              p.trustScore === 'red' ? '#ef4444' : '#6b7280',
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Section 5: LATAM Stablecoins ──────────────────────────── */}
      {stablecoins.length > 0 && (
        <Card>
          <CardHeader className="px-4 sm:px-6">
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <Coins className="w-4 h-4 sm:w-5 sm:h-5" />
              {t('metrics.latam.latamStablecoins')}
            </CardTitle>
            <CardDescription className="text-xs sm:text-sm">
              {t('metrics.latam.latamStablecoinsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-4 sm:px-6">
            <div className="border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full text-xs sm:text-sm min-w-[400px]">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.latam.pair')}</th>
                    <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.latam.peg')}</th>
                    <th className="text-left p-2 sm:p-3 font-medium hidden sm:table-cell">{t('metrics.latam.chains')}</th>
                    <th className="text-right p-2 sm:p-3 font-medium">{t('metrics.latam.circulating')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {stablecoins.map(s => (
                    <tr key={s.symbol} className="hover:bg-muted/30 transition-colors">
                      <td className="p-2 sm:p-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                          <span className="font-medium">{s.symbol}</span>
                          <span className="text-muted-foreground text-xs">{s.name}</span>
                        </div>
                      </td>
                      <td className="p-2 sm:p-3">
                        <Badge variant="secondary" className="text-[10px]">{s.pegLabel}</Badge>
                      </td>
                      <td className="p-2 sm:p-3 text-muted-foreground hidden sm:table-cell">
                        {s.chains.length} {t('metrics.latam.chains').toLowerCase()}
                      </td>
                      <td className="p-2 sm:p-3 text-right font-mono">{fmt(s.circulating)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ── Data source note ──────────────────────────────────────── */}
      <p className="text-[10px] text-center" style={{ color: CHART_COLORS.textMuted }}>
        {t('metrics.latam.dataNote')}: {new Date().toLocaleDateString()}
      </p>
    </div>
  );
}
