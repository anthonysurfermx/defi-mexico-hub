// src/pages/AgenticLeaderboardPage.tsx
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trophy, TrendingUp, TrendingDown, ExternalLink, DollarSign, BarChart3, Layers, RefreshCw } from 'lucide-react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { defillamaService, type AIAgentProtocol } from '@/services/defillama.service';
import { EntityComments } from '@/components/BlogComments';

function formatUSD(value: number): string {
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`;
  if (value > 0) return `$${value.toFixed(0)}`;
  return '-';
}

function ChangeCell({ value }: { value: number | null }) {
  if (value === null || value === undefined) return <span className="text-muted-foreground">-</span>;
  const isPositive = value >= 0;
  return (
    <span className={`flex items-center gap-1 text-sm font-medium ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
      {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
      {isPositive ? '+' : ''}{value.toFixed(1)}%
    </span>
  );
}

type SortField = 'tvl' | 'feesAllTime' | 'fees24h' | 'mcap';

export default function AgenticLeaderboardPage() {
  const { t } = useTranslation();
  const [protocols, setProtocols] = useState<AIAgentProtocol[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortField>('tvl');

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await defillamaService.getAIAgentProtocols();
      setProtocols(data);
    } catch (err) {
      console.error('Error loading DefiLlama data:', err);
      setError(t('agenticWorld.leaderboard.noData'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const sorted = useMemo(() => {
    return [...protocols].sort((a, b) => {
      const aVal = a[sortBy] || 0;
      const bVal = b[sortBy] || 0;
      return bVal - aVal;
    });
  }, [protocols, sortBy]);

  const totalTVL = useMemo(() => protocols.reduce((sum, p) => sum + p.tvl, 0), [protocols]);
  const totalFees = useMemo(() => protocols.reduce((sum, p) => sum + p.feesAllTime, 0), [protocols]);

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('agenticWorld.leaderboard.title')} | DeFi Hub México</title>
        <meta name="description" content={t('agenticWorld.leaderboard.description')} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
              <Trophy className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-bold">{t('agenticWorld.leaderboard.title')}</h1>
                <Badge className="bg-green-500/10 text-green-500 border-green-500/20 text-xs animate-pulse">
                  {t('agenticWorld.leaderboard.badge')}
                </Badge>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-lg mt-2">
            {t('agenticWorld.leaderboard.description')}
          </p>
        </div>

        {/* Stats Cards */}
        {!loading && !error && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('agenticWorld.leaderboard.totalTVL')}</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-500" />
                  {formatUSD(totalTVL)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('agenticWorld.leaderboard.totalFees')}</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-amber-500" />
                  {formatUSD(totalFees)}
                </CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-amber-500/20">
              <CardHeader className="pb-2">
                <CardDescription>{t('agenticWorld.leaderboard.totalProtocols')}</CardDescription>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-500" />
                  {protocols.length}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Sort Controls */}
        {!loading && !error && (
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">{t('agenticWorld.leaderboard.sortBy')}:</span>
              <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortField)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tvl">{t('agenticWorld.leaderboard.tvl')}</SelectItem>
                  <SelectItem value="feesAllTime">{t('agenticWorld.leaderboard.fees')}</SelectItem>
                  <SelectItem value="fees24h">{t('agenticWorld.leaderboard.fees24h')}</SelectItem>
                  <SelectItem value="mcap">{t('agenticWorld.leaderboard.mcap')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm" onClick={loadData} className="gap-2">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-12 text-center border-red-500/20">
            <Trophy size={48} className="mx-auto mb-4 text-red-500/50" />
            <h3 className="text-lg font-semibold mb-2">{error}</h3>
            <Button onClick={loadData} className="mt-4">
              {t('agenticWorld.leaderboard.retry')}
            </Button>
          </Card>
        )}

        {/* Desktop Table */}
        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <Card className="overflow-hidden border-amber-500/20">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground w-12">{t('agenticWorld.leaderboard.rank')}</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.name')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.tvl')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.fees')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.fees24h')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.mcap')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.change1d')}</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">{t('agenticWorld.leaderboard.change7d')}</th>
                        <th className="text-center p-4 text-sm font-medium text-muted-foreground w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {sorted.map((p, i) => (
                        <tr key={p.slug} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4 text-sm font-bold text-muted-foreground">{i + 1}</td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold">{p.name}</span>
                                {p.symbol && p.symbol !== '-' && (
                                  <Badge variant="outline" className="text-[10px]">{p.symbol}</Badge>
                                )}
                              </div>
                              <div className="flex gap-1">
                                {p.chains.slice(0, 3).map((chain) => (
                                  <Badge key={chain} variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {chain}
                                  </Badge>
                                ))}
                                {p.chains.length > 3 && (
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    +{p.chains.length - 3}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-right font-mono text-sm">{formatUSD(p.tvl)}</td>
                          <td className="p-4 text-right font-mono text-sm">{formatUSD(p.feesAllTime)}</td>
                          <td className="p-4 text-right font-mono text-sm">{formatUSD(p.fees24h)}</td>
                          <td className="p-4 text-right font-mono text-sm">{formatUSD(p.mcap)}</td>
                          <td className="p-4 text-right"><ChangeCell value={p.change_1d} /></td>
                          <td className="p-4 text-right"><ChangeCell value={p.change_7d} /></td>
                          <td className="p-4 text-center">
                            {p.url && (
                              <a
                                href={p.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-muted-foreground hover:text-foreground transition-colors"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
              {sorted.map((p, i) => (
                <Card key={p.slug} className="border-amber-500/10">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-muted-foreground">#{i + 1}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{p.name}</span>
                            {p.symbol && p.symbol !== '-' && (
                              <Badge variant="outline" className="text-[10px]">{p.symbol}</Badge>
                            )}
                          </div>
                          <div className="flex gap-1 mt-1">
                            {p.chains.slice(0, 2).map((chain) => (
                              <Badge key={chain} variant="secondary" className="text-[10px] px-1.5 py-0">
                                {chain}
                              </Badge>
                            ))}
                            {p.chains.length > 2 && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                +{p.chains.length - 2}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-muted-foreground">
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.tvl')}</span>
                        <p className="font-mono font-semibold">{formatUSD(p.tvl)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.fees')}</span>
                        <p className="font-mono font-semibold">{formatUSD(p.feesAllTime)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.fees24h')}</span>
                        <p className="font-mono font-semibold">{formatUSD(p.fees24h)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.mcap')}</span>
                        <p className="font-mono font-semibold">{formatUSD(p.mcap)}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.change1d')}</span>
                        <ChangeCell value={p.change_1d} />
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('agenticWorld.leaderboard.change7d')}</span>
                        <ChangeCell value={p.change_7d} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Data Source Footer */}
            <div className="mt-6 text-center text-xs text-muted-foreground">
              <p>{t('agenticWorld.leaderboard.dataSource')} • {t('agenticWorld.leaderboard.updatedEvery')}</p>
            </div>
          </>
        )}

        {/* Comments */}
        <EntityComments entityId="agentic-leaderboard" entityType="agentic" />
      </div>
    </div>
  );
}
