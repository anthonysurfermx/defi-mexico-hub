// src/pages/HomePage.tsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Rocket, 
  Building2, 
  Users, 
  TrendingUp,
  Calendar,
  FileText,
  MessageCircle,
  Star,
  GitBranch,
  Zap,
  Shield,
  Globe,
  ChevronRight,
  Mail,
  Loader2
} from 'lucide-react';
import { motion } from "framer-motion";
import { useState, useEffect } from 'react';

// Import hooks and services
import { usePlatformStats } from '@/hooks/usePlatformStats';
import { useCommunities } from '@/hooks/useCommunities';
import { newsletterService } from '@/services/newsletter.service';
import { startupsService } from '@/services/startups.service';
import type { StartupApplication, Community } from '@/types';

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

const staggerContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Mock upcoming events (mantenemos temporalmente hasta que tengamos servicio de eventos)
const mockEvents = [
  {
    id: '1',
    title: 'DeFi Summit México 2025',
    date: '15 Sep',
    type: 'Conferencia',
    location: 'CDMX'
  },
  {
    id: '2',
    title: 'Workshop: Smart Contracts',
    date: '20 Ago',
    type: 'Workshop',
    location: 'Online'
  }
];

// Mock blog posts (mantenemos temporalmente hasta que tengamos servicio de blog)
const mockBlogPosts = [
  {
    id: '1',
    title: 'El Futuro de DeFi en México',
    excerpt: 'Exploramos las tendencias y oportunidades del ecosistema DeFi mexicano para 2025',
    date: 'Hace 2 días',
    readTime: '5 min',
    category: 'Tendencias'
  },
  {
    id: '2',
    title: 'Guía para Principiantes en DeFi',
    excerpt: 'Todo lo que necesitas saber para empezar en finanzas descentralizadas',
    date: 'Hace 5 días',
    readTime: '10 min',
    category: 'Educación'
  },
  {
    id: '3',
    title: 'Top 5 Startups DeFi Mexicanas',
    excerpt: 'Conoce las startups más innovadoras del ecosistema blockchain mexicano',
    date: 'Hace 1 semana',
    readTime: '7 min',
    category: 'Startups'
  }
];

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [featuredStartups, setFeaturedStartups] = useState<StartupApplication[]>([]);
  const [loadingStartups, setLoadingStartups] = useState(true);
  
  // Hooks para datos reales
  const { stats, loading: statsLoading } = usePlatformStats();
  const { communities, loading: communitiesLoading } = useCommunities({ limit: 3, orderBy: 'member_count' });

  // Cargar startups destacadas
  useEffect(() => {
    loadFeaturedStartups();
  }, []);

  const loadFeaturedStartups = async () => {
    try {
      setLoadingStartups(true);
      // CAMBIO IMPORTANTE: Buscar 'published' en lugar de 'accepted'
      const response = await startupsService.getByStatus('published');
      if (response.data) {
        // Tomar solo las primeras 3 startups publicadas
        setFeaturedStartups(response.data.slice(0, 3));
      }
    } catch (error) {
      console.error('Error loading startups:', error);
    } finally {
      setLoadingStartups(false);
    }
  };

  // Manejar suscripción al newsletter
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Por favor ingresa tu email');
      return;
    }

    setIsSubscribing(true);
    
    try {
      const response = await newsletterService.subscribe({
        email,
        status: 'active',
        interests: ['general', 'startups', 'eventos'],
        metadata: {
          source: 'homepage',
          timestamp: new Date().toISOString()
        }
      });

      if (response.error) {
        if (response.error.includes('ya está suscrito')) {
          toast.info('Este email ya está suscrito al newsletter');
        } else {
          toast.error(response.error);
        }
      } else {
        toast.success('¡Gracias por suscribirte! Te enviaremos las últimas novedades.');
        setEmail('');
      }
    } catch (error) {
      toast.error('Error al suscribirse. Por favor intenta de nuevo.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-primary/5 to-background" />
        
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              {/* Badge */}
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6"
              >
                <Zap className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">El Hub #1 de DeFi en México</span>
              </motion.div>

              <h1 className="text-5xl lg:text-7xl font-bold mb-6">
                <span className="bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                  DeFi México Hub
                </span>
              </h1>
              
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Construimos el futuro de las finanzas descentralizadas en México. 
                Conectamos startups, desarrolladores y entusiastas para crear un 
                ecosistema DeFi próspero e inclusivo.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" className="group" asChild>
                  <Link to="/startups" className="inline-flex items-center">
                    Descubre Startups
                    <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a 
                    href="https://t.me/defi_mexico" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center"
                  >
                    <MessageCircle className="mr-2 w-5 h-5" />
                    Únete al Telegram
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section - Con datos reales */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
          >
            <motion.div variants={fadeUp} className="text-center">
              <Building2 className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  stats?.total_startups || '0'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Startups</div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <Users className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  `${(stats?.total_users || 0).toLocaleString()}+`
                )}
              </div>
              <div className="text-sm text-muted-foreground">Miembros</div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <TrendingUp className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  `${stats?.total_communities || '0'}`
                )}
              </div>
              <div className="text-sm text-muted-foreground">Comunidades</div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <Calendar className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-3xl font-bold mb-1">
                {statsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                ) : (
                  stats?.total_events || '0'
                )}
              </div>
              <div className="text-sm text-muted-foreground">Eventos</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Startups Section - NUEVO */}
      {featuredStartups.length > 0 && (
        <section className="py-20 bg-gradient-to-b from-background to-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={fadeUp}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Startups Destacadas
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Conoce las startups más innovadoras del ecosistema DeFi mexicano
              </p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {featuredStartups.map((startup) => (
                <motion.div
                  key={startup.id}
                  variants={fadeUp}
                  className="group relative bg-card rounded-xl border border-border hover:border-primary/50 
                           transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {startup.logo_url ? (
                        <img 
                          src={startup.logo_url} 
                          alt={startup.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Rocket className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      {startup.is_featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {startup.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {startup.description || 'Innovando en el ecosistema DeFi'}
                    </p>
                    
                    {startup.tags && startup.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                        {startup.tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                    
                    <Link 
                      to={`/startups/${startup.id}`}
                      className="inline-flex items-center text-sm text-primary hover:gap-2 transition-all"
                    >
                      Ver más
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <div className="text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/startups" className="inline-flex items-center">
                  Ver todas las startups
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Communities */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Comunidades Destacadas
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Únete a las comunidades más activas del ecosistema DeFi mexicano
            </p>
          </motion.div>

          {communitiesLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : communities.length > 0 ? (
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
            >
              {communities.map((community) => (
                <motion.div
                  key={community.id}
                  variants={fadeUp}
                  className="group relative bg-card rounded-xl border border-border hover:border-primary/50 
                           transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                >
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      {community.logo_url ? (
                        <img 
                          src={community.logo_url} 
                          alt={community.name}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Users className="w-8 h-8 text-primary" />
                        </div>
                      )}
                      {community.is_featured && (
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                      )}
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                      {community.name}
                    </h3>
                    
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                      {community.description}
                    </p>
                    
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        {community.category}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {community.member_count} miembros
                      </span>
                    </div>
                    
                    <Link 
                      to={`/comunidades/${community.id}`}
                      className="inline-flex items-center text-sm text-primary hover:gap-2 transition-all"
                    >
                      Ver más
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No hay comunidades disponibles en este momento</p>
            </div>
          )}

          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/comunidades" className="inline-flex items-center">
                Ver todas las comunidades
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Blog & Events Grid */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Blog Posts */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={fadeUp}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Últimas Publicaciones</h3>
                <Link 
                  to="/blog" 
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  Ver todo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {mockBlogPosts.map((post) => (
                  <Link
                    key={post.id}
                    to={`/blog/${post.id}`}
                    className="block group"
                  >
                    <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                      <div className="flex items-start justify-between mb-2">
                        <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                          {post.category}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {post.date}
                        </span>
                      </div>
                      <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                        {post.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center mt-3 text-xs text-muted-foreground">
                        <FileText className="w-3 h-3 mr-1" />
                        {post.readTime} de lectura
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>

            {/* Upcoming Events */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={fadeUp}
              viewport={{ once: true }}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Próximos Eventos</h3>
                <Link 
                  to="/eventos" 
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  Ver todo
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>

              <div className="space-y-4">
                {mockEvents.map((event) => (
                  <div
                    key={event.id}
                    className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-lg border border-primary/20"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-primary">
                            {event.date.split(' ')[0]}
                          </div>
                          <div className="text-xs text-muted-foreground uppercase">
                            {event.date.split(' ')[1]}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold">{event.title}</h4>
                          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                            <span>{event.type}</span>
                            <span>📍 {event.location}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Button size="sm" variant="outline" className="w-full" asChild>
                      <Link to={`/eventos/${event.id}`}>
                        Más información
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Newsletter Section - Con funcionalidad real */}
      <section className="py-20 bg-gradient-to-t from-muted/30 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            viewport={{ once: true }}
            className="text-center"
          >
            <Mail className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Mantente Actualizado
            </h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
              Recibe las últimas noticias, eventos y oportunidades del ecosistema DeFi mexicano
            </p>
            
            <form onSubmit={handleNewsletterSubmit} className="max-w-md mx-auto">
              <div className="flex gap-2">
                <Input
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1"
                  disabled={isSubscribing}
                  required
                />
                <Button type="submit" disabled={isSubscribing}>
                  {isSubscribing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Suscribirse'
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Al suscribirte, aceptas recibir emails sobre DeFi México Hub.
                Puedes cancelar tu suscripción en cualquier momento.
              </p>
            </form>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              ¿Por qué DeFi México Hub?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Somos el punto de encuentro para construir el futuro financiero de México
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="grid md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <motion.div 
              variants={fadeUp}
              className="text-center p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Ecosistema Global</h3>
              <p className="text-sm text-muted-foreground">
                Conectamos México con el ecosistema DeFi mundial
              </p>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              className="text-center p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Shield className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Seguridad Primera</h3>
              <p className="text-sm text-muted-foreground">
                Promovemos las mejores prácticas en seguridad blockchain
              </p>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              className="text-center p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Comunidad Activa</h3>
              <p className="text-sm text-muted-foreground">
                Miles de builders, inversores y entusiastas
              </p>
            </motion.div>

            <motion.div 
              variants={fadeUp}
              className="text-center p-6"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                <GitBranch className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">Open Source</h3>
              <p className="text-sm text-muted-foreground">
                Construimos herramientas abiertas para todos
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-t from-primary/5 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            viewport={{ once: true }}
          >
            <Rocket className="w-16 h-16 text-primary mx-auto mb-6" />
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              ¿Listo para construir el futuro?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg max-w-2xl mx-auto">
              Únete a la comunidad de innovadores que están transformando las finanzas en México
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/startups" className="inline-flex items-center">
                  Registra tu Startup
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <a 
                  href="https://t.me/defi_mexico" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center"
                >
                  <MessageCircle className="mr-2 w-5 h-5" />
                  Únete a la Comunidad
                </a>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}