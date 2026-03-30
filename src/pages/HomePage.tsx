import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { communitiesService, type Community } from '@/services/communities.service';
import { eventsService, type Event } from '@/services/events.service';
import { jobsService, type Job } from '@/services/jobs.service';
import { blogService, type DomainPost } from '@/services/blog.service';
import { startupsService } from '@/services/startups.service';
import { defillamaService, type AIAgentProtocol, type TVLHistoryPoint } from '@/services/defillama.service';
import { useAuth } from '@/hooks/useAuth';
import { getTwitterAvatar } from '@/lib/utils';
import { ScrambleText } from '@/components/agentic/ScrambleText';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Sparkles, ArrowRight, Users, Calendar, Briefcase, BookOpen, Mail, BarChart3, Trophy, Rocket, Zap } from 'lucide-react';

const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' });
};

// Glass card component
function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm rounded-xl hover:bg-white/[0.05] hover:border-white/[0.1] transition-all ${className}`}>
      {children}
    </div>
  );
}

// Section header
function SectionHeader({ title, href, color = 'white' }: { title: string; href: string; color?: string }) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-between mb-8">
      <h2 className="text-2xl md:text-3xl font-display text-white">{title}</h2>
      <Link to={href} className={`text-sm text-${color}/60 hover:text-white transition-colors flex items-center gap-1`}>
        {t('common.viewMore')} <ArrowRight size={14} />
      </Link>
    </div>
  );
}

export default function HomePage() {
  const { t, i18n } = useTranslation();
  const { user, isAdmin, hasRole } = useAuth();
  const [email, setEmail] = useState('');
  const [loadingNewsletter, setLoadingNewsletter] = useState(false);
  const [officialCommunities, setOfficialCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [featuredJobs, setFeaturedJobs] = useState<Job[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [recentPosts, setRecentPosts] = useState<DomainPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [hackathonCount, setHackathonCount] = useState(0);
  const [agentProtocols, setAgentProtocols] = useState<AIAgentProtocol[]>([]);
  const [tvlHistory, setTvlHistory] = useState<TVLHistoryPoint[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);

  const handleContributeClick = () => {
    if (!user) return '/login';
    if (isAdmin() || hasRole('editor')) return '/admin';
    return '/user';
  };

  const loadOfficialCommunities = async () => {
    try {
      setLoadingCommunities(true);
      const result = await communitiesService.getAll();
      if (result.data) setOfficialCommunities(result.data);
      else setOfficialCommunities([]);
    } catch { setOfficialCommunities([]); }
    finally { setLoadingCommunities(false); }
  };

  const loadFeaturedEvents = async () => {
    try {
      setLoadingEvents(true);
      const result = await eventsService.getFeatured();
      if (result.data) setFeaturedEvents(result.data);
      else setFeaturedEvents([]);
    } catch { setFeaturedEvents([]); }
    finally { setLoadingEvents(false); }
  };

  const loadFeaturedJobs = async () => {
    try {
      setLoadingJobs(true);
      const result = await jobsService.getFeatured();
      if (result.data) setFeaturedJobs(result.data);
      else setFeaturedJobs([]);
    } catch { setFeaturedJobs([]); }
    finally { setLoadingJobs(false); }
  };

  const loadRecentPosts = async () => {
    try {
      setLoadingPosts(true);
      const result = await blogService.getRecent(3);
      if (result.data) setRecentPosts(result.data);
      else setRecentPosts([]);
    } catch { setRecentPosts([]); }
    finally { setLoadingPosts(false); }
  };

  const loadAgentData = async () => {
    try {
      setLoadingAgents(true);
      const protocols = await defillamaService.getAIAgentProtocols();
      setAgentProtocols(protocols);
      try {
        const history = await defillamaService.getAgentTVLHistory();
        setTvlHistory(history);
      } catch { /* chart data is optional */ }
    } catch (err) {
      console.warn('[HomePage] Agent data load failed:', err);
      setAgentProtocols([]);
    } finally { setLoadingAgents(false); }
  };

  useEffect(() => {
    Promise.all([
      loadOfficialCommunities(),
      loadFeaturedEvents(),
      loadFeaturedJobs(),
      loadRecentPosts(),
      loadAgentData(),
    ]);
    startupsService.getHackathonProjects().then(p => setHackathonCount(p.length)).catch(() => {});
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoadingNewsletter(true);
    try {
      await fetch('/api/newsletter', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
      toast.success(t('home.newsletter.success'));
      setEmail('');
    } catch { toast.error(t('home.newsletter.error')); }
    finally { setLoadingNewsletter(false); }
  };

  const totalTVL = useMemo(() => agentProtocols.reduce((sum, p) => sum + (p.tvl || 0), 0), [agentProtocols]);
  const activeProtocols = useMemo(() => agentProtocols.filter(p => (p.tvl || 0) > 100000).length, [agentProtocols]);

  const aggregateTVL = useMemo(() => {
    if (!tvlHistory.length) return [];
    return tvlHistory.map(point => {
      let total = 0;
      for (const [key, val] of Object.entries(point)) {
        if (key !== 'date' && typeof val === 'number') total += val;
      }
      return { date: point.date, total };
    });
  }, [tvlHistory]);

  const formatUSD = (val: number) => {
    if (val >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (val >= 1e6) return `$${(val / 1e6).toFixed(1)}M`;
    if (val >= 1e3) return `$${(val / 1e3).toFixed(0)}K`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <div className="min-h-screen" style={{ background: 'hsl(201 100% 6%)' }}>

      {/* ═══ HERO with VIDEO ═══ */}
      <section className="relative min-h-screen flex flex-col overflow-hidden">
        {/* Video background */}
        <video
          autoPlay loop muted playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 opacity-60"
        >
          <source
            src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4"
            type="video/mp4"
          />
        </video>
        {/* Gradient overlay */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-black/40 via-transparent to-[hsl(201,100%,6%)]" />

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 pb-32">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full liquid-glass mb-8 animate-fade-rise">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-white/70 uppercase tracking-wider">
              <ScrambleText text={t('home.badge')} speed={25} iterations={10} />
            </span>
          </div>

          <h1 className="text-5xl sm:text-7xl md:text-8xl leading-[0.95] tracking-[-2.46px] max-w-6xl font-normal font-display animate-fade-rise text-white">
            <ScrambleText text={t('home.hero.title')} speed={20} iterations={12} />{' '}
            <em className="not-italic text-white/40">
              <ScrambleText text={t('home.hero.titleGradient')} speed={20} iterations={15} />
            </em>
          </h1>

          <p className="text-white/40 text-base sm:text-lg max-w-2xl mt-8 leading-relaxed animate-fade-rise-delay">
            {t('home.hero.description')}
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 animate-fade-rise-delay-2">
            <Link
              to="/startups"
              className="liquid-glass rounded-full px-10 py-4 text-base text-white hover:scale-[1.03] transition-transform flex items-center gap-2"
            >
              <Rocket size={18} />
              {t('home.hero.exploreButton')}
            </Link>
            <Link
              to={handleContributeClick()}
              className="text-white/50 hover:text-white text-sm transition-colors flex items-center gap-2"
            >
              <Zap size={16} />
              {t('home.hero.contributeButton')}
            </Link>
          </div>
        </div>
      </section>

      {/* Content area — solid bg */}
      <div className="relative z-10">

        {/* ═══ AGENTIC WORLD ═══ */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <GlassCard className="p-8 md:p-12">
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-[11px] text-amber-400 uppercase tracking-wider">LIVE</span>
                </div>

                <h2 className="font-display text-3xl md:text-5xl text-white leading-tight">
                  <ScrambleText text={t('home.agenticHero.title1')} speed={20} iterations={12} />
                </h2>
                <h2 className="font-display text-3xl md:text-5xl text-amber-400/80 leading-tight">
                  <ScrambleText text={t('home.agenticHero.title2')} speed={20} iterations={15} />
                </h2>
                <p className="text-white/40 text-sm md:text-base max-w-2xl">
                  {t('home.agenticHero.description')}
                </p>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-4 max-w-lg">
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                    <div className="text-[10px] text-white/40 uppercase">{t('home.agenticHero.totalTVL')}</div>
                    <div className="text-xl font-display text-amber-300 mt-1">
                      {loadingAgents ? '...' : <ScrambleText text={formatUSD(totalTVL)} speed={30} iterations={6} />}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                    <div className="text-[10px] text-white/40 uppercase">{t('home.agenticHero.protocols')}</div>
                    <div className="text-xl font-display text-amber-300 mt-1">
                      {loadingAgents ? '...' : <ScrambleText text={String(agentProtocols.length)} speed={30} iterations={6} />}
                    </div>
                  </div>
                  <div className="bg-white/[0.03] border border-white/[0.06] rounded-lg p-4">
                    <div className="text-[10px] text-white/40 uppercase">{t('home.agenticHero.activeTVL')}</div>
                    <div className="text-xl font-display text-amber-300 mt-1">
                      {loadingAgents ? '...' : <ScrambleText text={String(activeProtocols)} speed={30} iterations={6} />}
                    </div>
                  </div>
                </div>

                {/* TVL Chart */}
                {aggregateTVL.length > 0 && (
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] text-white/40 uppercase">{t('home.agenticHero.chartTitle')}</span>
                      <span className="text-[10px] text-white/20">Powered by DeFi Llama</span>
                    </div>
                    <div className="h-[180px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={aggregateTVL}>
                          <defs>
                            <linearGradient id="tvlGradientHome" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.02} />
                            </linearGradient>
                          </defs>
                          <XAxis
                            dataKey="date"
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            axisLine={false} tickLine={false}
                            tickFormatter={(v: string) => { const d = new Date(v); return `${d.getMonth() + 1}/${d.getDate()}`; }}
                            interval="preserveStartEnd" minTickGap={50}
                          />
                          <YAxis
                            tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }}
                            axisLine={false} tickLine={false}
                            tickFormatter={(v: number) => formatUSD(v)} width={55}
                          />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(201 100% 8%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', fontSize: '11px' }}
                            labelFormatter={(label: string) => { const d = new Date(label); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }); }}
                            formatter={(value: number) => [formatUSD(value), 'Total TVL']}
                          />
                          <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={2} fill="url(#tvlGradientHome)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {loadingAgents && (
                  <div className="bg-white/[0.02] border border-white/[0.04] rounded-lg p-4 h-[180px] flex items-center justify-center">
                    <div className="text-white/20 text-sm animate-pulse">{t('home.agenticHero.loading')}</div>
                  </div>
                )}

                {/* CTAs */}
                <div className="flex flex-wrap items-center gap-4 pt-2">
                  <Link
                    to="/agentic-world/deploy"
                    className="flex items-center gap-2 px-6 py-3.5 bg-green-500 text-black text-sm font-bold rounded-full hover:scale-[1.03] transition-transform"
                  >
                    DEPLOY YOUR AI AGENT <ArrowRight size={14} />
                  </Link>
                  <Link
                    to="/agentic-world/leaderboard"
                    className="flex items-center gap-2 px-6 py-3.5 liquid-glass rounded-full text-amber-300 text-sm font-medium hover:scale-[1.03] transition-transform"
                  >
                    <Sparkles className="w-4 h-4" /> AI AGENT LEADERBOARD
                  </Link>
                  <a
                    href="https://discord.gg/ZJcpezeZ"
                    target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-6 py-3.5 liquid-glass rounded-full text-purple-300 text-sm font-medium hover:scale-[1.03] transition-transform"
                  >
                    DEGEN ZONE
                  </a>
                </div>
              </div>
            </GlassCard>
          </div>
        </section>

        {/* ═══ FEATURES GRID ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-display text-white mb-8">
              <ScrambleText text="Ecosystem Modules" speed={25} iterations={8} />
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Startups - span 2 */}
              <GlassCard className="md:col-span-2 p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <Rocket className="text-white/60" size={20} />
                </div>
                <h3 className="text-xl font-display text-white">{t('home.features.startups.title')}</h3>
                <p className="text-white/40 text-sm">{t('home.features.startups.description')}</p>
                <Link to="/startups" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
                  {t('home.startups.viewAll')} <ArrowRight size={14} />
                </Link>
              </GlassCard>

              {/* Communities */}
              <GlassCard className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <Users className="text-white/60" size={20} />
                </div>
                <h3 className="text-lg font-display text-white">{t('home.features.communities.title')}</h3>
                <p className="text-white/40 text-sm line-clamp-2">{t('home.features.communities.description')}</p>
                <Link to="/comunidades" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
                  {t('home.communities.viewAll')} <ArrowRight size={14} />
                </Link>
              </GlassCard>

              {/* Events */}
              <GlassCard className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                  <Calendar className="text-white/60" size={20} />
                </div>
                <h3 className="text-lg font-display text-white">{t('home.features.events.title')}</h3>
                <p className="text-white/40 text-sm line-clamp-2">{t('home.features.events.description')}</p>
                <Link to="/eventos" className="text-white/60 hover:text-white text-sm flex items-center gap-1 transition-colors">
                  {t('home.events.viewAll')} <ArrowRight size={14} />
                </Link>
              </GlassCard>

              {/* Jobs */}
              <GlassCard className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Briefcase className="text-amber-400/60" size={20} />
                </div>
                <h3 className="text-lg font-display text-white">{t('home.jobs.title')}</h3>
                <p className="text-white/40 text-sm line-clamp-2">{t('home.jobs.description')}</p>
                <Link to="/ecosistema/trabajos" className="text-amber-400/60 hover:text-amber-300 text-sm flex items-center gap-1 transition-colors">
                  {t('home.jobs.viewJobs')} <ArrowRight size={14} />
                </Link>
              </GlassCard>

              {/* Blog */}
              <GlassCard className="p-6 space-y-4">
                <div className="w-10 h-10 rounded-lg bg-violet-500/10 flex items-center justify-center">
                  <BookOpen className="text-violet-400/60" size={20} />
                </div>
                <h3 className="text-lg font-display text-white">{t('home.blog.title')}</h3>
                <p className="text-white/40 text-sm line-clamp-2">{t('home.blog.description')}</p>
                <Link to="/blog" className="text-violet-400/60 hover:text-violet-300 text-sm flex items-center gap-1 transition-colors">
                  {t('home.blog.readArticles')} <ArrowRight size={14} />
                </Link>
              </GlassCard>

              {/* Hackathon MVPs - span 2 */}
              <GlassCard className="md:col-span-2 p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Trophy className="text-green-400/60" size={20} />
                  </div>
                  {hackathonCount > 0 && (
                    <span className="text-green-400 font-display text-2xl">
                      <ScrambleText text={String(hackathonCount)} speed={30} iterations={6} />
                    </span>
                  )}
                </div>
                <h3 className="text-xl font-display text-white">{t('home.hackathon.title')}</h3>
                <p className="text-white/40 text-sm">
                  {t('home.hackathon.description')}
                  {hackathonCount > 0 && <span className="text-green-400"> {t('home.hackathon.projectsRegistered', { count: hackathonCount })}</span>}
                </p>
                <Link to="/hackathon-projects" className="text-green-400/60 hover:text-green-300 text-sm flex items-center gap-1 transition-colors">
                  {t('home.hackathon.viewProjects')} <ArrowRight size={14} />
                </Link>
              </GlassCard>
            </div>
          </div>
        </section>

        {/* ═══ FEATURED COMMUNITIES ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title={t('home.communities.title')} href="/comunidades" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loadingCommunities ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} className="p-6 animate-pulse">
                    <div className="w-10 h-10 bg-white/[0.05] rounded-lg mb-4" />
                    <div className="h-5 bg-white/[0.05] rounded mb-2 w-3/4" />
                    <div className="h-4 bg-white/[0.03] rounded w-full mb-3" />
                    <div className="h-3 bg-white/[0.03] rounded w-16" />
                  </GlassCard>
                ))
              ) : officialCommunities.length > 0 ? (
                officialCommunities.slice(0, 3).map((community) => {
                  const socialLinks = (community as any).links || community.social_links || {};
                  const imageUrl = (community as any).image_url || community.logo_url;
                  const twitterAvatar = getTwitterAvatar(socialLinks?.twitter);
                  const displayImage = imageUrl || twitterAvatar;

                  return (
                    <Link key={community.id} to={`/comunidades/${community.slug || community.id}`}>
                      <GlassCard className="p-6 space-y-3 group">
                        {displayImage ? (
                          <img src={displayImage} alt={community.name} loading="lazy"
                            className="w-10 h-10 object-cover rounded-lg border border-white/[0.06]"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-white/[0.05] flex items-center justify-center">
                            <Users className="text-white/40" size={20} />
                          </div>
                        )}
                        <h3 className="text-lg font-display text-white group-hover:text-blue-300 transition-colors">
                          {community.name}
                        </h3>
                        <p className="text-white/30 text-xs line-clamp-2">{community.description}</p>
                        <div className="flex items-center text-xs text-white/40">
                          <Users className="mr-1" size={14} />
                          {community.member_count?.toLocaleString() || '0'} {t('home.communities.members')}
                        </div>
                      </GlassCard>
                    </Link>
                  );
                })
              ) : (
                <div className="col-span-full text-center py-12">
                  <GlassCard className="p-8">
                    <Users className="text-white/20 mx-auto mb-4" size={48} />
                    <h3 className="text-lg font-display text-white/40">{t('common.noCommunities')}</h3>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ EVENTS ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-5xl mx-auto">
            <SectionHeader title={t('home.events.title')} href="/eventos" />

            <div className="grid md:grid-cols-2 gap-4">
              {loadingEvents ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <GlassCard key={i} className="p-6 animate-pulse">
                    <div className="h-4 bg-white/[0.05] rounded w-20 mb-3" />
                    <div className="h-5 bg-white/[0.05] rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/[0.03] rounded w-full" />
                  </GlassCard>
                ))
              ) : featuredEvents.length > 0 ? (
                featuredEvents.slice(0, 4).map((event) => (
                  <Link key={event.id} to={`/eventos/${event.id}`}>
                    <GlassCard className="p-5 space-y-3 group">
                      <div className="flex items-center gap-2">
                        <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                          {event.event_type === 'presencial' ? t('common.presencial') :
                           event.event_type === 'online' ? t('common.online') : t('common.hibrido')}
                        </Badge>
                        <span className="text-white/20 text-[11px] ml-auto">
                          {event.start_date ? formatDate(event.start_date) : t('common.dateTBD')}
                        </span>
                      </div>
                      <h3 className="text-base font-display text-white group-hover:text-green-300 transition-colors line-clamp-2">
                        {event.title}
                      </h3>
                      <p className="text-white/30 text-xs line-clamp-2">
                        {event.description || t('events.description')}
                      </p>
                      <span className="text-white/40 text-xs flex items-center gap-1 group-hover:text-white transition-colors">
                        {t('common.viewDetails')} <ArrowRight size={12} />
                      </span>
                    </GlassCard>
                  </Link>
                ))
              ) : (
                <div className="col-span-full">
                  <GlassCard className="p-8 text-center">
                    <Calendar className="text-white/20 mx-auto mb-4" size={48} />
                    <h4 className="font-display text-white/40 mb-2">{t('common.upcomingEvents')}</h4>
                    <p className="text-white/20 text-xs">{t('common.upcomingEventsDesc')}</p>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ JOBS ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title={t('home.jobs.title')} href="/ecosistema/trabajos" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingJobs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <GlassCard key={i} className="p-6 animate-pulse">
                    <div className="h-4 bg-white/[0.05] rounded w-24 mb-3" />
                    <div className="h-5 bg-white/[0.05] rounded w-3/4 mb-2" />
                    <div className="h-4 bg-white/[0.03] rounded w-1/2" />
                  </GlassCard>
                ))
              ) : featuredJobs.length > 0 ? (
                featuredJobs.slice(0, 4).map((job) => (
                  <Link key={job.id} to="/ecosistema/trabajos">
                    <GlassCard className="p-5 space-y-3 group">
                      <div className="flex items-center gap-2">
                        {job.is_featured && (
                          <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[9px]">FEATURED</Badge>
                        )}
                      </div>
                      <h3 className="text-base font-display text-white group-hover:text-amber-300 transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-white/40">
                        <span className="text-amber-400/70">{job.company}</span>
                        <span className="text-white/10">|</span>
                        <span>{job.location}</span>
                      </div>
                      {job.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {job.tags.slice(0, 3).map((tag) => (
                            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/40">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </Link>
                ))
              ) : (
                <div className="col-span-full">
                  <GlassCard className="p-8 text-center">
                    <Briefcase className="text-white/20 mx-auto mb-4" size={48} />
                    <h4 className="font-display text-white/40 mb-2">{t('home.jobs.comingSoon')}</h4>
                    <p className="text-white/20 text-xs">{t('home.jobs.comingSoonDesc')}</p>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ BLOG ═══ */}
        <section className="py-16 px-6">
          <div className="max-w-7xl mx-auto">
            <SectionHeader title={t('home.blog.title')} href="/blog" />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {loadingPosts ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <GlassCard key={i} className="overflow-hidden animate-pulse">
                    <div className="h-36 bg-white/[0.03]" />
                    <div className="p-5">
                      <div className="h-4 bg-white/[0.05] rounded w-20 mb-3" />
                      <div className="h-5 bg-white/[0.05] rounded w-3/4 mb-2" />
                      <div className="h-4 bg-white/[0.03] rounded w-full" />
                    </div>
                  </GlassCard>
                ))
              ) : recentPosts.length > 0 ? (
                recentPosts.map((post) => (
                  <Link key={post.id} to={`/blog/${post.slug}`}>
                    <GlassCard className="overflow-hidden group">
                      {post.image_url && (
                        <div className="h-36 overflow-hidden">
                          <img
                            src={post.image_url} alt={post.title} loading="lazy"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 opacity-70 group-hover:opacity-100"
                          />
                        </div>
                      )}
                      <div className="p-5 space-y-3">
                        <div className="flex items-center gap-2">
                          {post.categories?.[0] && (
                            <Badge className="bg-violet-500/10 text-violet-400 border-violet-500/20 text-[10px]">
                              {post.categories[0]}
                            </Badge>
                          )}
                          {post.reading_time_minutes && (
                            <span className="text-[10px] text-white/20">{post.reading_time_minutes} min</span>
                          )}
                        </div>
                        <h3 className="text-base font-display text-white group-hover:text-violet-300 transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-white/30 text-xs line-clamp-2">{post.excerpt}</p>
                      </div>
                    </GlassCard>
                  </Link>
                ))
              ) : (
                <div className="col-span-full">
                  <GlassCard className="p-8 text-center">
                    <BookOpen className="text-white/20 mx-auto mb-4" size={48} />
                    <h4 className="font-display text-white/40 mb-2">{t('home.blog.comingSoon')}</h4>
                    <p className="text-white/20 text-xs">{t('home.blog.comingSoonDesc')}</p>
                  </GlassCard>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ═══ METRICS CTA ═══ */}
        <section className="py-12 px-6">
          <div className="max-w-4xl mx-auto">
            <Link to="/metricas">
              <GlassCard className="flex flex-col md:flex-row items-center gap-6 p-8 group">
                <div className="w-14 h-14 rounded-xl bg-white/[0.05] flex items-center justify-center shrink-0">
                  <BarChart3 className="text-white/60" size={28} />
                </div>
                <div className="text-center md:text-left flex-1">
                  <h3 className="text-xl font-display text-white group-hover:text-blue-300 transition-colors mb-1">
                    {t('home.metrics.title')}
                  </h3>
                  <p className="text-white/40 text-sm">{t('home.metrics.description')}</p>
                </div>
                <ArrowRight className="text-white/40 group-hover:translate-x-2 transition-transform" size={24} />
              </GlassCard>
            </Link>
          </div>
        </section>

        {/* ═══ NEWSLETTER ═══ */}
        <section className="py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <GlassCard className="p-8 md:p-12 text-center">
              <h2 className="text-2xl md:text-3xl font-display text-white mb-4">
                <ScrambleText text={t('home.newsletter.title')} speed={25} iterations={10} />
              </h2>
              <p className="text-white/40 text-sm mb-8 max-w-2xl mx-auto">
                {t('home.newsletter.description')}
              </p>
              <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <Input
                  type="email"
                  placeholder={t('home.newsletter.placeholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 rounded-full px-5 focus:border-white/20"
                  required
                />
                <Button
                  type="submit"
                  disabled={loadingNewsletter}
                  className="bg-white text-black font-medium rounded-full px-8 hover:bg-white/90"
                >
                  {loadingNewsletter ? (
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><Mail className="mr-2" size={16} />{t('home.newsletter.button')}</>
                  )}
                </Button>
              </form>
            </GlassCard>
          </div>
        </section>

      </div>
    </div>
  );
}
