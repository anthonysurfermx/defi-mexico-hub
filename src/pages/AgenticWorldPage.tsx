// src/pages/AgenticWorldPage.tsx
import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Helmet } from 'react-helmet-async';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { Bot, Zap, Sparkles } from 'lucide-react';
import { PixelSearch, PixelFilter } from '@/components/ui/pixel-icons';
import { AGENTIC_PROJECTS, AGENTIC_CATEGORIES } from '@/data/agentic-projects';
import AgentCard from '@/components/agentic/AgentCard';
import { EntityComments } from '@/components/BlogComments';

export default function AgenticWorldPage() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProjects = useMemo(() => {
    return AGENTIC_PROJECTS.filter((project) => {
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesCategory =
        selectedCategory === 'all' || project.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const featuredProjects = useMemo(
    () => AGENTIC_PROJECTS.filter((p) => p.is_featured),
    []
  );

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>{t('agenticWorld.title')} | DeFi Hub México</title>
        <meta name="description" content={t('agenticWorld.description')} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center">
              <Bot className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-4xl font-bold">{t('agenticWorld.title')}</h1>
                <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-xs">
                  {t('agenticWorld.badge')}
                </Badge>
              </div>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" asChild>
                  <Link to="/agentic-world/leaderboard">DefiLlama Leaderboard</Link>
                </Button>
                <Button variant="outline" size="sm" asChild>
                  <Link to="/agentic-world/polymarket">Polymarket Agents</Link>
                </Button>
              </div>
            </div>
          </div>
          <p className="text-muted-foreground text-lg mt-2">
            {t('agenticWorld.description')}
          </p>
        </div>

        {/* Info Banner */}
        <Card className="mb-8 bg-gradient-to-r from-cyan-500/10 to-teal-600/10 border-cyan-500/20">
          <CardContent className="py-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-cyan-500 mt-0.5" />
              <div>
                <p className="font-medium text-cyan-400">{t('agenticWorld.infoBannerTitle')}</p>
                <p className="text-sm text-muted-foreground">
                  {t('agenticWorld.infoBannerDescription')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Featured Projects */}
        {featuredProjects.length > 0 && (
          <div className="mb-12">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-cyan-500" />
              <h2 className="text-2xl font-bold">{t('common.featured')}</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredProjects.map((project) => (
                <AgentCard key={project.id} project={project} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <PixelSearch size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t('agenticWorld.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[200px]">
              <PixelFilter size={14} className="mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('agenticWorld.categories.all')}</SelectItem>
              {AGENTIC_CATEGORIES.map((cat) => (
                <SelectItem key={cat} value={cat}>
                  {t(`agenticWorld.categories.${cat}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
          <Card className="border-cyan-500/20">
            <CardHeader className="pb-2">
              <CardDescription>{t('agenticWorld.totalProjects')}</CardDescription>
              <CardTitle className="text-2xl flex items-center gap-2">
                <Bot className="w-5 h-5 text-cyan-500" />
                {filteredProjects.length}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Projects Grid */}
        {filteredProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProjects
              .filter((p) => !p.is_featured)
              .map((project) => (
                <AgentCard key={project.id} project={project} />
              ))}
          </div>
        ) : (
          <Card className="p-12 text-center border-cyan-500/20">
            <Bot size={48} className="mx-auto mb-4 text-cyan-500/50" />
            <h3 className="text-lg font-semibold mb-2">{t('agenticWorld.noResults')}</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all'
                ? t('agenticWorld.noResultsFilterHint')
                : t('agenticWorld.noResultsEmptyHint')}
            </p>
          </Card>
        )}

        {/* Comments Section */}
        <EntityComments entityId="agentic-world" entityType="agentic" />
      </div>
    </div>
  );
}
