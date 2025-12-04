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
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { communitiesService, type Community } from '@/services/communities.service';
import { eventsService, type Event } from '@/services/events.service';
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

  // Función para manejar el clic en "Contribuye"
  const handleContributeClick = () => {
    if (!user) {
      // Si no está autenticado, ir al login
      return '/login';
    }
    
    // Si está autenticado, redirigir según su rol
    if (isAdmin() || hasRole('editor')) {
      return '/admin';
    } else if (hasRole('startup_owner')) {
      return '/startup-register';
    } else {
      // Usuario normal va al dashboard de registro de startup
      return '/startup-register';
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
      console.log('🔍 Cargando eventos destacados para HomePage...');
      
      const result = await eventsService.getFeatured(4);
      
      if (result.data) {
        setFeaturedEvents(result.data);
        console.log('✅ Eventos destacados cargados:', result.data.length);
      } else if (result.error) {
        console.error('❌ Error loading featured events:', result.error);
        setFeaturedEvents([]);
      }
    } catch (error) {
      console.error('❌ Error in loadFeaturedEvents:', error);
      setFeaturedEvents([]);
    } finally {
      setLoadingEvents(false);
    }
  };

  // Cargar comunidades y eventos
  useEffect(() => {
    loadOfficialCommunities();
    loadFeaturedEvents();
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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

            {/* Card normal - Comunidades */}
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

            {/* Card normal - Eventos */}
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
                  No hay comunidades oficiales disponibles
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
                        {event.event_type === 'presencial' ? 'Presencial' :
                         event.event_type === 'online' ? 'Online' : 'Híbrido'}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {event.start_date ? formatDate(event.start_date) : 'Fecha TBD'}
                      </span>
                    </div>
                    <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                      {event.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {event.description || 'Evento del ecosistema DeFi mexicano'}
                    </p>
                    <Button variant="ghost" className="group-hover:translate-x-1 transition-transform p-0">
                      Ver detalles <PixelArrowRight className="ml-2" size={16} />
                    </Button>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <PixelCalendar className="text-muted-foreground mx-auto mb-4" size={48} />
                <h4 className="font-semibold mb-2">Próximos eventos en camino</h4>
                <p className="text-sm text-muted-foreground">
                  Estamos preparando increíbles eventos para la comunidad
                </p>
              </div>
            )}
          </div>
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