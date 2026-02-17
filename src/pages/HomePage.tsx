// src/pages/HomePage.tsx - Modern Minimalist Design
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  PixelArrowRight,
  PixelRocket,
  PixelUsers,
  PixelCalendar,
  PixelMail,
  PixelSparkles
} from '@/components/ui/pixel-icons';
import { Rocket, Briefcase, FileText, UserCheck, BarChart3 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { communitiesService, type Community } from '@/services/communities.service';
import { eventsService, type Event } from '@/services/events.service';
import { jobsService, type Job } from '@/services/jobs.service';
import { blogService, type DomainPost } from '@/services/blog.service';
import { advocatesService, type DeFiAdvocate } from '@/services/advocates.service';
import { startupsService } from '@/services/startups.service';
import { useAuth } from '@/hooks/useAuth';
import { getTwitterAvatar } from '@/lib/utils';

// Utility function para formatear fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
};


export default function HomePage() {
  const { t } = useTranslation();
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
  const [featuredAdvocates, setFeaturedAdvocates] = useState<DeFiAdvocate[]>([]);
  const [loadingAdvocates, setLoadingAdvocates] = useState(true);
  const [hackathonCount, setHackathonCount] = useState(0);

  // Función para manejar el clic en "Contribuye"
  const handleContributeClick = () => {
    if (!user) {
      // Si no está autenticado, ir al login
      return '/login';
    }
    
    // Si está autenticado, redirigir según su rol
    if (isAdmin() || hasRole('editor')) {
      return '/admin';
    } else {
      // Usuario normal va al dashboard de propuestas
      return '/user';
    }
  };

  // ✨ FUNCIÓN PARA CARGAR COMUNIDADES OFICIALES
  const loadOfficialCommunities = async () => {
    try {
      setLoadingCommunities(true);
      console.log('🔍 Cargando comunidades oficiales para HomePage...');

      const result = await communitiesService.getOfficial(6);

      if (result.data) {
        setOfficialCommunities(result.data);
        console.log('✅ Comunidades oficiales cargadas:', result.data.length);
      } else if (result.error) {
        console.error('❌ Error loading official communities:', result.error);
        setOfficialCommunities([]);
      }
    } catch (error) {
      console.error('❌ Error in loadOfficialCommunities:', error);
      setOfficialCommunities([]);
    } finally {
      setLoadingCommunities(false);
    }
  };

  // ✨ FUNCIÓN PARA CARGAR EVENTOS DESTACADOS
  const loadFeaturedEvents = async () => {
    try {
      setLoadingEvents(true);
      const result = await eventsService.getFeatured(4);
      if (result.data) {
        setFeaturedEvents(result.data);
      } else {
        setFeaturedEvents([]);
      }
    } catch (error) {
      console.error('Error loading featured events:', error);
      setFeaturedEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // FUNCIÓN PARA CARGAR TRABAJOS DESTACADOS
  const loadFeaturedJobs = async () => {
    try {
      setLoadingJobs(true);
      const result = await jobsService.getFeatured(4);
      if (result.data) {
        setFeaturedJobs(result.data);
      } else {
        setFeaturedJobs([]);
      }
    } catch (error) {
      console.error('Error loading featured jobs:', error);
      setFeaturedJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  };

  // FUNCIÓN PARA CARGAR POSTS RECIENTES
  const loadRecentPosts = async () => {
    try {
      setLoadingPosts(true);
      const posts = await blogService.getRecent(3);
      setRecentPosts(posts);
    } catch (error) {
      console.error('Error loading recent posts:', error);
      setRecentPosts([]);
    } finally {
      setLoadingPosts(false);
    }
  };

  // FUNCIÓN PARA CARGAR REFERENTES DESTACADOS
  const loadFeaturedAdvocates = async () => {
    try {
      setLoadingAdvocates(true);
      const data = await advocatesService.getFeaturedAdvocates();
      setFeaturedAdvocates(data?.slice(0, 4) || []);
    } catch (error) {
      console.error('Error loading advocates:', error);
      setFeaturedAdvocates([]);
    } finally {
      setLoadingAdvocates(false);
    }
  };

  // FUNCIÓN PARA CARGAR CONTEO DE HACKATHON MVPs
  const loadHackathonCount = async () => {
    try {
      const data = await startupsService.getHackathonProjects();
      setHackathonCount(data?.length || 0);
    } catch (error) {
      console.error('Error loading hackathon count:', error);
    }
  };

  // Cargar todo en paralelo
  useEffect(() => {
    Promise.all([
      loadOfficialCommunities(),
      loadFeaturedEvents(),
      loadFeaturedJobs(),
      loadRecentPosts(),
      loadFeaturedAdvocates(),
      loadHackathonCount(),
    ]);
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error(t('home.newsletter.error'));
      return;
    }

    setLoadingNewsletter(true);

    try {
      // Simular envío (implementar con tu servicio de email)
      await new Promise(resolve => setTimeout(resolve, 1500));

      toast.success(t('home.newsletter.success'));
      setEmail('');
    } catch (error) {
      toast.error(t('home.newsletter.error'));
    } finally {
      setLoadingNewsletter(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section - Modern & Clean */}
      <section className="relative min-h-[90vh] flex items-center justify-center px-4 py-20">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          {/* Badge sutil */}
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full border border-primary/20">
            <span className="text-xs md:text-sm text-primary font-medium">{t('home.badge')}</span>
            <PixelSparkles className="text-primary" size={16} />
          </div>

          {/* Título grande y limpio */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            {t('home.hero.title')}
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              {t('home.hero.titleGradient')}
            </span>
          </h1>

          {/* Subtítulo conciso */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            {t('home.hero.description')}
          </p>

          {/* CTAs modernos */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/startups">{t('home.hero.exploreButton')}</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <Link to={handleContributeClick()}>{t('home.hero.contributeButton')}</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid - Bento Box Style */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card grande (span 2) - Startups */}
            <div className="md:col-span-2 bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PixelRocket className="text-primary" size={24} />
                </div>
                <h3 className="text-2xl font-bold">{t('home.features.startups.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.features.startups.description')}
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/startups">
                    {t('home.startups.viewAll')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Comunidades */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PixelUsers className="text-primary" size={24} />
                </div>
                <h3 className="text-xl font-bold">{t('home.features.communities.title')}</h3>
                <p className="text-muted-foreground line-clamp-2">
                  {t('home.features.communities.description')}
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/comunidades">
                    {t('home.communities.viewAll')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Eventos */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <PixelCalendar className="text-primary" size={24} />
                </div>
                <h3 className="text-xl font-bold">{t('home.features.events.title')}</h3>
                <p className="text-muted-foreground line-clamp-2">
                  {t('home.features.events.description')}
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/eventos">
                    {t('home.events.viewAll')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Trabajos Web3 */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Briefcase className="text-blue-500" size={24} />
                </div>
                <h3 className="text-xl font-bold">{t('home.jobs.title')}</h3>
                <p className="text-muted-foreground line-clamp-2">
                  {t('home.jobs.description')}
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/ecosistema/trabajos">
                    {t('home.jobs.viewJobs')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Blog */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center">
                  <FileText className="text-orange-500" size={24} />
                </div>
                <h3 className="text-xl font-bold">{t('home.blog.title')}</h3>
                <p className="text-muted-foreground line-clamp-2">
                  {t('home.blog.description')}
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/blog">
                    {t('home.blog.readArticles')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

            {/* MVPs Hackathon (span 2) */}
            <div className="md:col-span-2 bg-gradient-to-br from-violet-500/5 to-purple-600/5 border border-violet-500/20 rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center">
                    <Rocket className="text-violet-500" size={24} />
                  </div>
                  <Badge className="bg-violet-500/10 text-violet-500 border-violet-500/20">MVP</Badge>
                </div>
                <h3 className="text-2xl font-bold">{t('home.hackathon.title')}</h3>
                <p className="text-muted-foreground">
                  {t('home.hackathon.description')}
                  {hackathonCount > 0 && <span className="text-violet-400 font-medium"> {t('home.hackathon.projectsRegistered', { count: hackathonCount })}</span>}
                </p>
                <Button variant="ghost" className="group text-violet-500 hover:text-violet-400" asChild>
                  <Link to="/hackathon-projects">
                    {t('home.hackathon.viewProjects')}
                    <PixelArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={16} />
                  </Link>
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* Featured Communities Section - Minimal */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                {t('home.communities.title')}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('communities.description')}
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/comunidades">
                {t('common.viewMore')}
              </Link>
            </Button>
          </div>

          {/* Communities Grid - Solo 3 cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingCommunities ? (
              // Loading skeletons
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded-xl mb-4"></div>
                  <div className="h-6 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-16"></div>
                </div>
              ))
            ) : officialCommunities.length > 0 ? (
              officialCommunities.slice(0, 3).map((community) => (
                <Link
                  key={community.id}
                  to={`/comunidades/${community.slug || community.id}`}
                  className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-4">
                    {(() => {
                      const socialLinks = (community as any).links || community.social_links || {};
                      const imageUrl = (community as any).image_url || community.logo_url;
                      const twitterAvatar = getTwitterAvatar(socialLinks?.twitter);
                      const displayImage = imageUrl || twitterAvatar;

                      return displayImage ? (
                        <img
                          src={displayImage}
                          alt={community.name}
                          loading="lazy"
                          className="w-12 h-12 rounded-xl object-cover"
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            e.currentTarget.nextElementSibling?.classList.remove('hidden');
                          }}
                        />
                      ) : null;
                    })()}
                    <div className={`w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center ${((community as any).image_url || community.logo_url || getTwitterAvatar(((community as any).links || community.social_links)?.twitter)) ? 'hidden' : ''}`}>
                      <PixelUsers className="text-primary" size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {community.description}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <PixelUsers className="mr-1" size={16} />
                      {community.member_count?.toLocaleString() || '0'} {t('home.communities.members')}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <PixelUsers className="text-muted-foreground mx-auto mb-4" size={48} />
                <h3 className="text-lg font-medium mb-2">
                  {t('common.noCommunities')}
                </h3>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Events Section */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl md:text-3xl font-bold">{t('home.events.title')}</h3>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/eventos">
                {t('common.viewMore')}
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {loadingEvents ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-full"></div>
                </div>
              ))
            ) : featuredEvents.length > 0 ? (
              featuredEvents.slice(0, 4).map((event) => (
                <Link
                  key={event.id}
                  to={`/eventos/${event.id}`}
                  className="block bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full">
                        {event.event_type === 'presencial' ? t('common.presencial') :
                         event.event_type === 'online' ? t('common.online') : t('common.hibrido')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.start_date ? formatDate(event.start_date) : t('common.dateTBD')}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description || t('events.description')}
                    </p>
                    <Button variant="ghost" className="group-hover:translate-x-1 transition-transform p-0">
                      {t('common.viewDetails')} <PixelArrowRight className="ml-2" size={16} />
                    </Button>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <PixelCalendar className="text-muted-foreground mx-auto mb-4" size={48} />
                <h4 className="font-semibold mb-2">{t('common.upcomingEvents')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('common.upcomingEventsDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>


      {/* Featured Jobs Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.jobs.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('home.jobs.description')}
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/ecosistema/trabajos">
                {t('common.viewMore')}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loadingJobs ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                  <div className="h-4 bg-muted rounded w-24 mb-3"></div>
                  <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              ))
            ) : featuredJobs.length > 0 ? (
              featuredJobs.slice(0, 4).map((job) => (
                <Link
                  key={job.id}
                  to={`/ecosistema/trabajos`}
                  className="block bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="rounded-full text-blue-500 border-blue-500/30">
                        {job.job_type === 'remote' ? t('jobs.types.remote') : job.job_type === 'hybrid' ? t('jobs.types.hybrid') : t('jobs.types.onsite')}
                      </Badge>
                      {job.is_featured && (
                        <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 rounded-full">
                          {t('common.featured')}
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-1">
                      {job.title}
                    </h3>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span className="font-medium">{job.company}</span>
                      <span>-</span>
                      <span>{job.location}</span>
                    </div>
                    {job.tags?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {job.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{t('home.jobs.comingSoon')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('home.jobs.comingSoonDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog Section */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.blog.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('home.blog.description')}
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/blog">
                {t('common.viewMore')}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {loadingPosts ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-40 bg-muted"></div>
                  <div className="p-6">
                    <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                    <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-full"></div>
                  </div>
                </div>
              ))
            ) : recentPosts.length > 0 ? (
              recentPosts.map((post) => (
                <Link
                  key={post.id}
                  to={`/blog/${post.slug}`}
                  className="bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                >
                  {post.image_url && (
                    <div className="h-40 overflow-hidden">
                      <img
                        src={post.image_url}
                        alt={post.title}
                        loading="lazy"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6 space-y-3">
                    <div className="flex items-center gap-2">
                      {post.categories?.[0] && (
                        <Badge variant="outline" className="rounded-full text-orange-500 border-orange-500/30">
                          {post.categories[0]}
                        </Badge>
                      )}
                      {post.reading_time_minutes && (
                        <span className="text-xs text-muted-foreground">{post.reading_time_minutes} min</span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {post.excerpt}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{t('home.blog.comingSoon')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('home.blog.comingSoonDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Referentes Section */}
      <section className="py-24 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{t('home.advocates.title')}</h2>
              <p className="text-lg text-muted-foreground max-w-2xl">
                {t('home.advocates.description')}
              </p>
            </div>
            <Button variant="outline" className="rounded-full" asChild>
              <Link to="/referentes">
                {t('common.viewMore')}
              </Link>
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {loadingAdvocates ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse text-center">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4"></div>
                  <div className="h-5 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                </div>
              ))
            ) : featuredAdvocates.length > 0 ? (
              featuredAdvocates.map((advocate) => (
                <Link
                  key={advocate.id}
                  to="/referentes"
                  className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-all group text-center"
                >
                  {advocate.avatar_url ? (
                    <img
                      src={advocate.avatar_url}
                      alt={advocate.name}
                      loading="lazy"
                      className="w-16 h-16 rounded-full mx-auto mb-4 object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 bg-primary/10 flex items-center justify-center">
                      <UserCheck className="w-8 h-8 text-primary" />
                    </div>
                  )}
                  <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-1">
                    {advocate.name}
                  </h3>
                  {advocate.expertise && (
                    <p className="text-sm text-muted-foreground line-clamp-1 mt-1">{advocate.expertise}</p>
                  )}
                  {advocate.track && (
                    <Badge variant="outline" className="mt-2 text-xs">{advocate.track}</Badge>
                  )}
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h4 className="font-semibold mb-2">{t('home.advocates.comingSoon')}</h4>
                <p className="text-sm text-muted-foreground">
                  {t('home.advocates.comingSoonDesc')}
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Métricas CTA */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto">
          <Link
            to="/metricas"
            className="block bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-2xl p-8 hover:shadow-lg transition-all group"
          >
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="w-16 h-16 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                <BarChart3 className="w-8 h-8 text-emerald-500" />
              </div>
              <div className="text-center md:text-left flex-1">
                <h3 className="text-2xl font-bold mb-2 group-hover:text-emerald-500 transition-colors">
                  {t('home.metrics.title')}
                </h3>
                <p className="text-muted-foreground">
                  {t('home.metrics.description')}
                </p>
              </div>
              <PixelArrowRight className="text-emerald-500 group-hover:translate-x-2 transition-transform" size={24} />
            </div>
          </Link>
        </div>
      </section>

      {/* Newsletter Section - Simplified */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-purple-500/10 border rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('home.newsletter.title')}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            {t('home.newsletter.description')}
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder={t('home.newsletter.placeholder')}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full"
              required
            />
            <Button type="submit" disabled={loadingNewsletter} className="rounded-full px-8">
              {loadingNewsletter ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  {t('common.loading')}
                </>
              ) : (
                <>
                  <PixelMail className="mr-2" size={16} />
                  {t('home.newsletter.button')}
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}