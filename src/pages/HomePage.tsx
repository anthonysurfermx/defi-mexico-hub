// src/pages/HomePage.tsx - Modern Minimalist Design
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowRight,
  Building2,
  Users,
  Calendar,
  Mail,
  Sparkles
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { blogService, type DomainPost } from '@/services/blog.service';
import { communitiesService, type Community } from '@/services/communities.service';
import { eventsService, type Event } from '@/services/events.service';
import { useAuth } from '@/hooks/useAuth';

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
  const { user, isAdmin, hasRole } = useAuth();
  const [email, setEmail] = useState('');
  const [loadingNewsletter, setLoadingNewsletter] = useState(false);
  const [blogPosts, setBlogPosts] = useState<DomainPost[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>([]);
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

  // ✨ FUNCIÓN PARA CARGAR POSTS DEL BLOG
  const loadFeaturedBlogPosts = async () => {
    try {
      setLoadingBlog(true);
      console.log('🔍 Cargando posts del blog para HomePage...');
      
      // Usar getRecent() - Método específico para posts recientes publicados
      const posts = await blogService.getRecent(3);
      setBlogPosts(posts);
      console.log('✅ Posts del blog cargados:', posts.length);
      
    } catch (error) {
      console.error('❌ Error cargando posts del blog:', error);
      setBlogPosts([]);
    } finally {
      setLoadingBlog(false);
    }
  };

  // ✨ FUNCIÓN PARA CARGAR COMUNIDADES DESTACADAS
  const loadFeaturedCommunities = async () => {
    try {
      setLoadingCommunities(true);
      console.log('🔍 Cargando comunidades destacadas para HomePage...');
      
      const result = await communitiesService.getFeatured(6);
      
      if (result.data) {
        setFeaturedCommunities(result.data);
        console.log('✅ Comunidades destacadas cargadas:', result.data.length);
      } else if (result.error) {
        console.error('❌ Error loading featured communities:', result.error);
        setFeaturedCommunities([]);
      }
    } catch (error) {
      console.error('❌ Error in loadFeaturedCommunities:', error);
      setFeaturedCommunities([]);
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

  // Cargar blog posts, comunidades y eventos
  useEffect(() => {
    loadFeaturedBlogPosts();
    loadFeaturedCommunities();
    loadFeaturedEvents();
  }, []);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setLoadingNewsletter(true);
    
    try {
      // Simular envío (implementar con tu servicio de email)
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('¡Te has suscrito exitosamente al newsletter!');
      setEmail('');
    } catch (error) {
      toast.error('Error al suscribirse. Inténtalo de nuevo.');
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
            <span className="text-xs md:text-sm text-primary font-medium">El Hub DeFi de México</span>
            <Sparkles className="w-3 h-3 md:w-4 md:h-4 text-primary" />
          </div>

          {/* Título grande y limpio */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight">
            Conecta con el ecosistema
            <span className="block bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              DeFi de México
            </span>
          </h1>

          {/* Subtítulo conciso */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            La plataforma que reúne startups, comunidades, eventos y oportunidades del ecosistema DeFi mexicano en un solo lugar
          </p>

          {/* CTAs modernos */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Button size="lg" className="rounded-full px-8" asChild>
              <Link to="/ecosistema">Explorar Ecosistema</Link>
            </Button>
            <Button size="lg" variant="outline" className="rounded-full px-8" asChild>
              <Link to={handleContributeClick()}>Contribuir</Link>
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
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-2xl font-bold">Startups DeFi</h3>
                <p className="text-muted-foreground">
                  Descubre las startups más innovadoras construyendo el futuro de las finanzas descentralizadas en México
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/startups">
                    Explorar startups
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Card normal - Comunidades */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Comunidades</h3>
                <p className="text-muted-foreground line-clamp-2">
                  Únete a comunidades activas de builders, inversores y entusiastas
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/comunidades">
                    Ver comunidades
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Card normal - Eventos */}
            <div className="bg-card border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Eventos</h3>
                <p className="text-muted-foreground line-clamp-2">
                  Participa en meetups, conferencias y talleres presenciales
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/eventos">
                    Próximos eventos
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
              </div>
            </div>

            {/* Card normal - Blog */}
            <div className="md:col-span-2 bg-gradient-to-br from-primary/5 to-purple-500/5 border rounded-2xl p-8 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Recursos y Aprendizaje</h3>
                <p className="text-muted-foreground">
                  Accede a artículos, tutoriales y análisis sobre DeFi, blockchain y finanzas descentralizadas
                </p>
                <Button variant="ghost" className="group" asChild>
                  <Link to="/blog">
                    Explorar recursos
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comunidades Destacadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Únete a las comunidades más activas del ecosistema DeFi en México
            </p>
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
            ) : featuredCommunities.length > 0 ? (
              featuredCommunities.slice(0, 3).map((community) => (
                <Link
                  key={community.id}
                  to={`/comunidades/${community.slug || community.id}`}
                  className="bg-card border rounded-2xl p-6 hover:shadow-lg transition-all group"
                >
                  <div className="space-y-4">
                    {community.logo_url ? (
                      <img
                        src={community.logo_url}
                        alt={community.name}
                        className="w-12 h-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div>
                      <h3 className="text-xl font-bold mb-1 group-hover:text-primary transition-colors">
                        {community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {community.description}
                      </p>
                    </div>
                    <div className="flex items-center text-sm text-muted-foreground">
                      <Users className="w-4 h-4 mr-1" />
                      {community.member_count?.toLocaleString() || '0'} miembros
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">
                  No hay comunidades destacadas disponibles
                </h3>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Blog & Events Section - Minimal Cards */}
      <section className="py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Blog Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl md:text-3xl font-bold">Últimas Publicaciones</h3>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link to="/blog">
                    Ver todo
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {loadingBlog ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  ))
                ) : blogPosts.length > 0 ? (
                  blogPosts.slice(0, 3).map((post) => (
                    <Link
                      key={post.id}
                      to={`/blog/${post.slug}`}
                      className="block bg-card border rounded-2xl overflow-hidden hover:shadow-lg transition-all group"
                    >
                      <div className="p-6 space-y-3">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full">
                            {(post.categories && post.categories.length > 0) ? post.categories[0] : 'General'}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(post.published_at || post.created_at)}
                          </span>
                        </div>
                        <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
                          {post.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {post.excerpt}
                        </p>
                        <Button variant="ghost" className="group-hover:translate-x-1 transition-transform p-0">
                          Leer más <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <h4 className="font-semibold mb-2">Próximamente contenido educativo</h4>
                    <p className="text-sm text-muted-foreground">
                      Estamos preparando artículos increíbles sobre DeFi
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Events Section */}
            <div>
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-2xl md:text-3xl font-bold">Próximos Eventos</h3>
                <Button variant="outline" className="rounded-full" asChild>
                  <Link to="/eventos">
                    Ver todo
                  </Link>
                </Button>
              </div>

              <div className="space-y-4">
                {loadingEvents ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="bg-card border rounded-2xl p-6 animate-pulse">
                      <div className="h-4 bg-muted rounded w-20 mb-3"></div>
                      <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                      <div className="h-4 bg-muted rounded w-full"></div>
                    </div>
                  ))
                ) : featuredEvents.length > 0 ? (
                  featuredEvents.slice(0, 3).map((event) => (
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
                          Ver detalles <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                      </div>
                    </Link>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <h4 className="font-semibold mb-2">Próximos eventos en camino</h4>
                    <p className="text-sm text-muted-foreground">
                      Estamos preparando increíbles eventos para la comunidad
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* Newsletter Section - Simplified */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-primary/10 to-purple-500/10 border rounded-3xl p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Mantente al día con DeFi México
          </h2>
          <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
            Recibe las últimas noticias, eventos y oportunidades del ecosistema
          </p>
          <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-full"
              required
            />
            <Button type="submit" disabled={loadingNewsletter} className="rounded-full px-8">
              {loadingNewsletter ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Suscribiendo...
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4 mr-2" />
                  Suscribirse
                </>
              )}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}