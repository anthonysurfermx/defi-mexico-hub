// src/pages/MetricsPage.tsx
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import {
  TrendingUp,
  Globe,
  DollarSign,
  BarChart3,
  ExternalLink,
  Info,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface MXNStablecoin {
  name: string;
  symbol: string;
  tvl: number;
  issuer: string;
  chain: string;
  color: string;
}

// MXN Stablecoins data (manually tracked as they're not all on DefiLlama)
// Last updated: December 2024
const mxnStablecoins: MXNStablecoin[] = [
  { name: 'MXNB', symbol: 'MXNB', tvl: 15000000, issuer: 'Bitso', chain: 'Ethereum', color: '#00D4AA' },
  { name: 'MXNe', symbol: 'MXNe', tvl: 8000000, issuer: 'Brale', chain: 'Ethereum', color: '#8B5CF6' },
  { name: 'MXNT', symbol: 'MXNT', tvl: 6000000, issuer: 'Tether', chain: 'Multi-chain', color: '#26A17B' },
  { name: 'MMXN', symbol: 'MMXN', tvl: 5000000, issuer: 'Moneta', chain: 'Polygon', color: '#F97316' },
];

export default function MetricsPage() {
  const { t, i18n } = useTranslation();
  const [globalTVL, setGlobalTVL] = useState<number | null>(null);
  const [globalChange, setGlobalChange] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate total MXN stablecoins TVL
  const totalMXNTVL = mxnStablecoins.reduce((sum, coin) => sum + coin.tvl, 0);
  const maxTVL = Math.max(...mxnStablecoins.map(c => c.tvl));

  // Get last updated string based on language
  const lastUpdated = i18n.language === 'en' ? 'December 2024' : 'Diciembre 2024';

  // Fetch global DeFi TVL from DefiLlama
  useEffect(() => {
    const fetchGlobalTVL = async () => {
      try {
        const response = await fetch('https://api.llama.fi/v2/historicalChainTvl');
        const data = await response.json();

        if (data && data.length > 0) {
          const latest = data[data.length - 1];
          const previous = data[data.length - 2];
          setGlobalTVL(latest.tvl);

          if (previous) {
            const change = ((latest.tvl - previous.tvl) / previous.tvl) * 100;
            setGlobalChange(change);
          }
        }
      } catch (error) {
        console.error('Error fetching global TVL:', error);
        setGlobalTVL(200000000000);
      } finally {
        setIsLoading(false);
      }
    };

    fetchGlobalTVL();
  }, []);

  // Format currency
  const formatCurrency = (value: number, decimals = 2) => {
    if (value >= 1e12) {
      return `$${(value / 1e12).toFixed(decimals)}T`;
    } else if (value >= 1e9) {
      return `$${(value / 1e9).toFixed(decimals)}B`;
    } else if (value >= 1e6) {
      return `$${(value / 1e6).toFixed(decimals)}M`;
    }
    return `$${value.toLocaleString()}`;
  };

  // Calculate scale ratio
  const scaleRatio = globalTVL ? (globalTVL / totalMXNTVL).toFixed(0) : '5,882';

  return (
    <TooltipProvider>
      <Helmet>
        <title>{t('metrics.pageTitle')} | DeFi México Hub</title>
        <meta name="description" content={t('metrics.pageDescription')} />
      </Helmet>

      <div className="min-h-screen bg-background">
        {/* Hero Section - Mobile optimized */}
        <section className="relative py-8 sm:py-12 md:py-16 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5" />
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-4xl mx-auto text-center space-y-3 sm:space-y-4">
              <Badge variant="outline" className="mb-2 sm:mb-4">
                <BarChart3 className="w-3 h-3 mr-1" />
                {t('metrics.badge')}
              </Badge>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {t('metrics.title')}
              </h1>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground max-w-2xl mx-auto px-2">
                {t('metrics.subtitle')}
              </p>
            </div>
          </div>
        </section>

        {/* Main Stats Cards - Mobile optimized */}
        <section className="container mx-auto px-4 -mt-4 sm:-mt-6 md:-mt-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 max-w-4xl mx-auto">
            {/* Global DeFi TVL Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <Globe className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t('metrics.globalTVL')}
                  </CardDescription>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('metrics.dataSource')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {isLoading ? (
                  <Skeleton className="h-10 sm:h-12 w-32 sm:w-48" />
                ) : (
                  <div className="space-y-1 sm:space-y-2">
                    <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary">
                      {globalTVL ? formatCurrency(globalTVL) : '$200B'}
                    </div>
                    {globalChange !== null && (
                      <div className={`flex items-center gap-1 text-xs sm:text-sm ${globalChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {globalChange >= 0 ? (
                          <ArrowUpRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        ) : (
                          <ArrowDownRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        )}
                        {Math.abs(globalChange).toFixed(2)}% (24h)
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* MXN Stablecoins TVL Card */}
            <Card className="border-2 border-purple-500/20 bg-gradient-to-br from-purple-500/5 to-transparent">
              <CardHeader className="pb-2 px-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <CardDescription className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                    <DollarSign className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t('metrics.mxnTVL')}
                  </CardDescription>
                  <Tooltip>
                    <TooltipTrigger>
                      <Info className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>MXNB, MXNe, MXNT, MMXN</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                <div className="space-y-1 sm:space-y-2">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-purple-500">
                    {formatCurrency(totalMXNTVL)}
                  </div>
                  <div className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    {t('metrics.activeStablecoins')}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Scale Comparison - Mobile optimized */}
        <section className="container mx-auto px-4 py-8 sm:py-10 md:py-12">
          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('metrics.scaleComparison')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('metrics.scaleDescription', { ratio: scaleRatio })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 px-4 sm:px-6">
                <div className="space-y-3 sm:space-y-4">
                  {/* Global DeFi Bar */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">{t('metrics.defiGlobal')}</span>
                      <span className="text-muted-foreground">{globalTVL ? formatCurrency(globalTVL) : '$200B'}</span>
                    </div>
                    <div className="h-6 sm:h-8 bg-gradient-to-r from-primary to-primary/70 rounded-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
                    </div>
                  </div>

                  {/* MXN Stablecoins Bar */}
                  <div className="space-y-1.5 sm:space-y-2">
                    <div className="flex justify-between items-center text-xs sm:text-sm">
                      <span className="font-medium">{t('metrics.stablecoinsMXN')}</span>
                      <span className="text-muted-foreground">{formatCurrency(totalMXNTVL)}</span>
                    </div>
                    <div className="h-6 sm:h-8 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-lg"
                        style={{ width: `${Math.max(0.5, (totalMXNTVL / (globalTVL || 200000000000)) * 100)}%` }}
                      />
                    </div>
                    <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                      {t('metrics.scaleNote')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* MXN Stablecoins Breakdown - Mobile optimized */}
        <section className="container mx-auto px-4 pb-8 sm:pb-10 md:pb-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('metrics.breakdown')}
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">
                  {t('metrics.breakdownDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 sm:px-6">
                {/* Bar Chart */}
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {mxnStablecoins.map((coin) => (
                    <div key={coin.symbol} className="space-y-1.5 sm:space-y-2">
                      <div className="flex justify-between items-center text-xs sm:text-sm">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: coin.color }}
                          />
                          <span className="font-medium">{coin.symbol}</span>
                          <span className="text-muted-foreground hidden sm:inline">({coin.issuer})</span>
                        </div>
                        <span className="font-mono text-xs sm:text-sm">{formatCurrency(coin.tvl)}</span>
                      </div>
                      <div className="h-5 sm:h-6 bg-muted rounded overflow-hidden">
                        <div
                          className="h-full rounded transition-all duration-500"
                          style={{
                            width: `${(coin.tvl / maxTVL) * 100}%`,
                            backgroundColor: coin.color
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Data Table - Mobile scroll */}
                <div className="border rounded-lg overflow-x-auto -mx-4 sm:mx-0">
                  <table className="w-full text-xs sm:text-sm min-w-[360px]">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.table.stablecoin')}</th>
                        <th className="text-left p-2 sm:p-3 font-medium">{t('metrics.table.issuer')}</th>
                        <th className="text-left p-2 sm:p-3 font-medium hidden sm:table-cell">{t('metrics.table.chain')}</th>
                        <th className="text-right p-2 sm:p-3 font-medium">TVL</th>
                        <th className="text-right p-2 sm:p-3 font-medium">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {mxnStablecoins.map((coin) => (
                        <tr key={coin.symbol} className="hover:bg-muted/30 transition-colors">
                          <td className="p-2 sm:p-3">
                            <div className="flex items-center gap-1.5 sm:gap-2">
                              <div
                                className="w-2 h-2 rounded-full flex-shrink-0"
                                style={{ backgroundColor: coin.color }}
                              />
                              <span className="font-medium">{coin.symbol}</span>
                            </div>
                          </td>
                          <td className="p-2 sm:p-3 text-muted-foreground">{coin.issuer}</td>
                          <td className="p-2 sm:p-3 text-muted-foreground hidden sm:table-cell">{coin.chain}</td>
                          <td className="p-2 sm:p-3 text-right font-mono">{formatCurrency(coin.tvl)}</td>
                          <td className="p-2 sm:p-3 text-right font-mono">
                            {((coin.tvl / totalMXNTVL) * 100).toFixed(1)}%
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-muted/30 font-medium">
                        <td className="p-2 sm:p-3" colSpan={2}>Total</td>
                        <td className="p-2 sm:p-3 hidden sm:table-cell"></td>
                        <td className="p-2 sm:p-3 text-right font-mono">{formatCurrency(totalMXNTVL)}</td>
                        <td className="p-2 sm:p-3 text-right font-mono">100%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* DefiLlama Embed */}
        <section className="container mx-auto px-4 pb-8 sm:pb-10 md:pb-12">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader className="px-4 sm:px-6">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <CardTitle className="flex items-center gap-2 text-base sm:text-lg md:text-xl">
                      <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                      <span className="truncate">{t('metrics.historicalTVL')}</span>
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      {t('metrics.historicalDescription')}
                    </CardDescription>
                  </div>
                  <a
                    href="https://defillama.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs sm:text-sm text-muted-foreground hover:text-primary transition-colors flex-shrink-0"
                  >
                    <span className="hidden sm:inline">DefiLlama</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </CardHeader>
              <CardContent className="p-0 pb-0">
                <div className="aspect-[16/9] w-full overflow-hidden bg-muted rounded-b-lg">
                  <iframe
                    src="https://defillama.com/chart/chain/All?tvl=true&theme=dark"
                    title="DefiLlama TVL Chart"
                    className="w-full h-full border-0"
                    loading="lazy"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Info Section - Mobile optimized */}
        <section className="container mx-auto px-4 pb-12 sm:pb-14 md:pb-16">
          <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
            {/* Data Sources Note */}
            <Card className="border-amber-500/20 bg-amber-500/5">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <h3 className="font-semibold text-amber-600 dark:text-amber-400 text-sm sm:text-base">
                      {t('metrics.dataNote')}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>{t('metrics.globalTVL')}:</strong> {t('metrics.globalTVLNote')}
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>{t('metrics.stablecoinsMXN')}:</strong> {t('metrics.mxnNote')}{' '}
                      {t('metrics.lastUpdate')}: <span className="font-medium text-foreground">{lastUpdated}</span>.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Metrics */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4 sm:pt-6 px-4 sm:px-6">
                <div className="flex items-start gap-3 sm:gap-4">
                  <Info className="w-4 h-4 sm:w-5 sm:h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div className="space-y-1.5 sm:space-y-2 min-w-0">
                    <h3 className="font-semibold text-sm sm:text-base">{t('metrics.aboutMetrics')}</h3>
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      {t('metrics.aboutDescription')}
                    </p>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-1 sm:pt-2">
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">MXNB - Bitso</Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">MXNe - Brale</Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">MXNT - Tether</Badge>
                      <Badge variant="secondary" className="text-[10px] sm:text-xs">MMXN - Moneta</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </TooltipProvider>
  );
}
