// src/pages/HomePage.tsx - SIN SECCIÓN DE ESTADÍSTICAS
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { 
  ArrowRight, 
  Rocket, 
  Building2, 
  Users, 
  TrendingUp,
  Calendar,
  Clock,
  FileText,
  MessageCircle,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Star,
  Globe,
  Zap,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { blogService, type DomainPost } from '@/services/blog.service';
import { communitiesService, type Community } from '@/services/communities.service';
import { eventsService, type Event } from '@/services/events.service';
import { coursesService, type Course } from '@/services/courses.service';

// Datos estáticos de InvestmentOpportunitiesPage para la mejor oportunidad
const gbmFunds = [
  {
    id: 'gbmcash',
    name: 'GBMCASH - Liquidez en dólares',
    platform: 'GBM',
    apy: 4.70,
    currency: 'USD',
    risk: 'Alto',
    type: 'Renta Fija',
    horizon: 'Corto plazo',
    tvl: '150M',
    description: 'Fondo con liquidez diaria en dólares'
  },
  {
    id: 'gbmglobal',
    name: 'GBMGLOBAL - Mercados globales',
    platform: 'GBM',
    apy: 6.8,
    currency: 'USD',
    risk: 'Alto',
    type: 'Renta Variable',
    horizon: 'Largo plazo',
    tvl: '340M',
    description: 'Diversificación en mercados desarrollados y emergentes'
  }
];

const defiVaults = [
  {
    id: 'yearn-usdt',
    name: 'Yearn USDT Strategy',
    platform: 'Yearn',
    apy: 5.8,
    currency: 'USDT',
    risk: 'Medio',
    type: 'Strategy',
    horizon: 'Flexible',
    tvl: '89M',
    description: 'Estrategia automatizada multi-protocolo'
  }
];

// Animation variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const staggerContainer = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

// Utility function para formatear tiempo
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Hace un momento';
  if (diffInSeconds < 3600) return `Hace ${Math.floor(diffInSeconds / 60)} min`;
  if (diffInSeconds < 86400) return `Hace ${Math.floor(diffInSeconds / 3600)} h`;
  if (diffInSeconds < 604800) return `Hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return date.toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Utility function para calcular tiempo de lectura
const calculateReadTime = (content: string): number => {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / wordsPerMinute));
};

export default function HomePage() {
  const [email, setEmail] = useState('');
  const [loadingNewsletter, setLoadingNewsletter] = useState(false);
  const [blogPosts, setBlogPosts] = useState<DomainPost[]>([]);
  const [loadingBlog, setLoadingBlog] = useState(true);
  const [featuredCommunities, setFeaturedCommunities] = useState<Community[]>([]);
  const [loadingCommunities, setLoadingCommunities] = useState(true);
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  
  // Estado para la mejor inversión y curso destacado
  const [bestInvestment, setBestInvestment] = useState<any>(null);
  const [featuredCourseData, setFeaturedCourseData] = useState<Course | null>(null);
  const [loadingFeaturedCourse, setLoadingFeaturedCourse] = useState(true);

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

  // ✨ FUNCIÓN PARA CARGAR CURSO MÁS POPULAR
  const loadFeaturedCourse = async () => {
    try {
      setLoadingFeaturedCourse(true);
      console.log('📚 Cargando curso más popular para HomePage...');
      
      const { data, error } = await coursesService.getMostPopularCourse();
      
      if (error) {
        console.error('❌ Error loading featured course:', error);
        setFeaturedCourseData(null);
      } else if (data) {
        setFeaturedCourseData(data);
        console.log('✅ Curso más popular cargado:', data.title);
      }
    } catch (error) {
      console.error('❌ Error in loadFeaturedCourse:', error);
      setFeaturedCourseData(null);
    } finally {
      setLoadingFeaturedCourse(false);
    }
  };

  // Función para obtener la mejor oportunidad de inversión
  const getBestInvestment = () => {
    const allOpportunities = [...gbmFunds, ...defiVaults];
    const best = allOpportunities.reduce((prev, current) => 
      (prev.apy > current.apy) ? prev : current
    );
    return best;
  };

  // Cargar blog posts, comunidades, eventos y datos de cursos
  useEffect(() => {
    loadFeaturedBlogPosts();
    loadFeaturedCommunities();
    loadFeaturedEvents();
    loadFeaturedCourse(); // Cargar curso más popular desde Supabase
    
    // Cargar datos estáticos de inversiones
    setBestInvestment(getBestInvestment());
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
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-muted/20">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <motion.div
              initial="hidden"
              animate="show"
              variants={staggerContainer}
              className="space-y-8"
            >
              <motion.div variants={fadeUp} className="space-y-4">
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold">
                  México es una potencia{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                    DeFi
                  </span>{" "}
        
                </h1>
              </motion.div>

              <motion.p 
                variants={fadeUp}
                className="text-xl sm:text-2xl text-muted-foreground max-w-4xl mx-auto"
              >
                Contribuye para hacerlo realidad y forma parte de algo chingon
              </motion.p>

              <motion.div 
                variants={fadeUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
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
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section - ¡SECCIÓN DE ESTADÍSTICAS ELIMINADA! */}
      <section className="py-24 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Impulsando el ecosistema DeFi mexicano
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Desde startups innovadoras hasta comunidades vibrantes, somos el hub central 
              del desarrollo blockchain en México
            </motion.p>
          </motion.div>

          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            <motion.div variants={fadeUp} className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all">
              <Building2 className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Startups Innovadoras</h3>
              <p className="text-muted-foreground mb-4">
                Descubre y conecta con las startups DeFi más prometedoras de México
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/startups">
                  Explorar <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all">
              <Users className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Comunidad Activa</h3>
              <p className="text-muted-foreground mb-4">
                Únete a miles de desarrolladores, inversores y entusiastas del DeFi
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/comunidades">
                  Participar <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>

            <motion.div variants={fadeUp} className="bg-card p-8 rounded-xl border border-border hover:border-primary/50 transition-all">
              <Calendar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-3">Eventos y Meetups</h3>
              <p className="text-muted-foreground mb-4">
                Participa en conferencias, talleres y networking events presenciales
              </p>
              <Button variant="outline" size="sm" asChild>
                <Link to="/eventos">
                  Ver eventos <ArrowRight className="ml-1 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DeFi Llama Stats Section */}
      <section className="py-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Datos en Tiempo Real del Ecosistema DeFi
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Estadísticas actualizadas del Total Value Locked (TVL) en protocolos DeFi globalmente
            </motion.p>
          </motion.div>

          <motion.div
            variants={fadeUp}
            className="bg-card rounded-xl border border-border overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">DeFi Protocol Rankings</h3>
                <a 
                  href="https://defillama.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline inline-flex items-center"
                >
                  Ver en DeFi Llama <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </div>
              
              <div className="bg-muted/20 rounded-lg overflow-hidden" style={{ height: '400px' }}>
                <iframe
                  width="100%"
                  height="100%"
                  src="https://defillama.com/chart/chain/All?theme=dark"
                  title="DefiLlama"
                  frameBorder="0"
                  className="w-full h-full border-0"
                  loading="lazy"
                  style={{ height: '400px' }}
                />
              </div>
            </div>
          </motion.div>

          {/* Métricas adicionales */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12"
          >
            <motion.div variants={fadeUp} className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <TrendingUp className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="text-lg font-semibold mb-2">TVL Global</h4>
                <p className="text-2xl font-bold text-primary">$100B+</p>
                <p className="text-sm text-muted-foreground mt-1">Total Value Locked</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <Globe className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="text-lg font-semibold mb-2">Protocolos</h4>
                <p className="text-2xl font-bold text-primary">2,000+</p>
                <p className="text-sm text-muted-foreground mt-1">Protocolos activos</p>
              </div>
            </motion.div>

            <motion.div variants={fadeUp} className="text-center">
              <div className="bg-card p-6 rounded-lg border border-border">
                <Zap className="h-8 w-8 text-primary mx-auto mb-3" />
                <h4 className="text-lg font-semibold mb-2">Crecimiento</h4>
                <p className="text-2xl font-bold text-primary">+15%</p>
                <p className="text-sm text-muted-foreground mt-1">Crecimiento mensual</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Featured Communities Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-bold mb-4">
              Comunidades Destacadas
            </motion.h2>
            <motion.p variants={fadeUp} className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              Únete a las comunidades más activas del ecosistema DeFi en México
            </motion.p>
            <motion.div variants={fadeUp}>
              <Button asChild size="lg">
                <Link to="/comunidades" className="inline-flex items-center">
                  Ver todas las comunidades <ArrowRight className="ml-2 w-4 h-4" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>

          {/* Communities Grid */}
          <motion.div
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {loadingCommunities ? (
              // Loading skeletons
              Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  className="bg-card p-6 rounded-xl border border-border animate-pulse"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-muted rounded-lg"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded mb-2"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-3 bg-muted rounded"></div>
                    <div className="h-3 bg-muted rounded w-4/5"></div>
                  </div>
                  <div className="flex justify-between items-center">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-8 bg-muted rounded w-20"></div>
                  </div>
                </motion.div>
              ))
            ) : featuredCommunities.length > 0 ? (
              featuredCommunities.map((community) => (
                <motion.div
                  key={community.id}
                  variants={fadeUp}
                  className="bg-card p-6 rounded-xl border border-border hover:border-primary/50 transition-all group hover:shadow-lg"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    {community.logo_url ? (
                      <img 
                        src={community.logo_url} 
                        alt={community.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {community.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {community.category || 'Comunidad'}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {community.description}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {community.member_count?.toLocaleString() || '0'}
                      </div>
                      {community.location && (
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {community.location}
                        </div>
                      )}
                    </div>
                    <Button size="sm" variant="ghost" asChild>
                      <Link 
                        to={`/comunidades/${community.slug || community.id}`}
                        className="text-primary hover:text-primary/80"
                      >
                        Ver más <ChevronRight className="w-4 h-4 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              ))
            ) : (
              <motion.div 
                variants={fadeUp}
                className="col-span-full text-center py-12"
              >
                <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No hay comunidades destacadas disponibles
                </h3>
                <p className="text-muted-foreground">
                  Vuelve pronto para descubrir las comunidades más activas
                </p>
              </motion.div>
            )}
          </motion.div>
        </div>
      </section>

      {/* Blog & Events Grid */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
          {/* Blog Section */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Últimas Publicaciones</h3>
                  <p className="text-muted-foreground">
                    Mantente actualizado con análisis y noticias del ecosistema DeFi
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/blog" className="inline-flex items-center">
                    Ver todo <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              <div className="space-y-6">
                {loadingBlog ? (
                  // Loading skeletons
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border border-border animate-pulse">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-5 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-muted rounded w-full mb-3"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-muted rounded w-24"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  ))
                ) : blogPosts.length > 0 ? (
                  blogPosts.map((post) => (
                    <motion.div key={post.id} variants={fadeUp}>
                      <Link
                        to={`/blog/${post.slug}`}
                        className="block group"
                      >
                        <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {(post.categories && post.categories.length > 0) ? post.categories[0] : 'General'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {formatTimeAgo(post.published_at || post.created_at)}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {post.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {post.excerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <FileText className="w-3 h-3 mr-1" />
                              {calculateReadTime(post.content)} min de lectura
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Por {post.author}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <motion.div variants={fadeUp} className="text-center py-8">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Próximamente contenido educativo sobre DeFi</h4>
                    <p className="text-sm text-muted-foreground">
                      Estamos preparando artículos increíbles sobre finanzas descentralizadas
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>
            
            {/* Events Section */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Próximos Eventos</h3>
                  <p className="text-muted-foreground">
                    Participa en meetups, conferencias y talleres presenciales
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/eventos" className="inline-flex items-center">
                    Ver todo <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              <div className="space-y-6">
                {loadingEvents ? (
                  // Loading skeletons para eventos
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 bg-card rounded-lg border border-border animate-pulse">
                      <div className="flex items-start justify-between mb-2">
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-5 bg-muted rounded w-3/4 mb-1"></div>
                      <div className="h-4 bg-muted rounded w-full mb-3"></div>
                      <div className="flex items-center justify-between">
                        <div className="h-3 bg-muted rounded w-28"></div>
                        <div className="h-3 bg-muted rounded w-20"></div>
                      </div>
                    </div>
                  ))
                ) : featuredEvents.length > 0 ? (
                  featuredEvents.map((event) => (
                    <motion.div key={event.id} variants={fadeUp}>
                      <Link
                        to={`/eventos/${event.id}`}
                        className="block group"
                      >
                        <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                          <div className="flex items-start justify-between mb-2">
                            <span className={`px-2 py-1 text-xs rounded ${
                              event.event_type === 'presencial' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              event.event_type === 'online' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
                            }`}>
                              {event.event_type === 'presencial' ? 'Presencial' :
                               event.event_type === 'online' ? 'Online' :
                               'Híbrido'}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.start_date ? new Date(event.start_date).toLocaleDateString('es-ES', { 
                                day: 'numeric', 
                                month: 'short' 
                              }) : 'Fecha TBD'}
                            </span>
                          </div>
                          <h4 className="font-semibold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                            {event.title}
                          </h4>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                            {event.description || 'Evento del ecosistema DeFi mexicano'}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3 mr-1" />
                              <span className="line-clamp-1">
                                {event.venue_name || event.venue_city || 'Ubicación TBD'}
                              </span>
                            </div>
                            {event.start_time && (
                              <div className="flex items-center text-xs text-muted-foreground">
                                <Clock className="w-3 h-3 mr-1" />
                                {event.start_time}
                              </div>
                            )}
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <motion.div variants={fadeUp} className="text-center py-8">
                    <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Próximos eventos en camino</h4>
                    <p className="text-sm text-muted-foreground">
                      Estamos preparando increíbles eventos para la comunidad DeFi mexicana
                    </p>
                  </motion.div>
                )}
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Investment & Academy Featured Section */}
      <section className="py-24 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            
            {/* Best Investment Opportunity */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Mejor APY del Mercado</h3>
                  <p className="text-muted-foreground">
                    El mayor APY disponible comparando fintech y DeFi
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/oportunidades" className="inline-flex items-center">
                    Ver análisis completo <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              {bestInvestment && (
                <motion.div variants={fadeUp}>
                  <Link
                    to="/oportunidades"
                    className="block group"
                  >
                    <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold ${
                          bestInvestment.platform === 'GBM' ? 'bg-blue-500 text-white' : 'bg-primary text-primary-foreground'
                        }`}>
                          {bestInvestment.platform.slice(0, 2).toUpperCase()}
                        </div>
                        <div className="text-right">
                          <div className="text-3xl font-bold text-primary">
                            {bestInvestment.apy.toFixed(1)}%
                          </div>
                          <div className="text-xs text-muted-foreground">APY</div>
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {bestInvestment.name}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {bestInvestment.description}
                      </p>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm">
                          <Badge variant="outline">{bestInvestment.currency}</Badge>
                          <span className="text-muted-foreground">{bestInvestment.type}</span>
                        </div>
                        <div className="text-sm font-medium">
                          TVL: {bestInvestment.tvl}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-border">
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Riesgo: {bestInvestment.risk}</span>
                          <span>Plazo: {bestInvestment.horizon}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              )}
            </motion.div>

            {/* Featured Course */}
            <motion.div
              initial="hidden"
              whileInView="show"
              variants={staggerContainer}
              viewport={{ once: true }}
            >
              <motion.div variants={fadeUp} className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold mb-2">Curso Destacado de DeFi Academy</h3>
                  <p className="text-muted-foreground">
                    El curso más popular de nuestra academia DeFi
                  </p>
                </div>
                <Button variant="outline" asChild>
                  <Link to="/academia" className="inline-flex items-center">
                    Ver todos <ArrowRight className="ml-1 w-4 h-4" />
                  </Link>
                </Button>
              </motion.div>

              {loadingFeaturedCourse ? (
                <motion.div variants={fadeUp}>
                  <div className="p-6 bg-card rounded-xl border border-border animate-pulse">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-muted rounded-lg"></div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-muted rounded"></div>
                        <div className="w-8 h-4 bg-muted rounded"></div>
                      </div>
                    </div>
                    
                    <div className="h-6 bg-muted rounded mb-2"></div>
                    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="h-4 bg-muted rounded w-16"></div>
                        <div className="h-4 bg-muted rounded w-20"></div>
                      </div>
                      <div className="h-6 bg-muted rounded w-16"></div>
                    </div>
                    
                    <div className="flex gap-2 mb-4">
                      <div className="h-6 bg-muted rounded w-24"></div>
                      <div className="h-6 bg-muted rounded w-20"></div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="h-4 bg-muted rounded w-24"></div>
                      <div className="h-4 bg-muted rounded w-20"></div>
                    </div>
                  </div>
                </motion.div>
              ) : featuredCourseData ? (
                <motion.div variants={fadeUp}>
                  <a
                    href={featuredCourseData.circle_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                  >
                    <div className="p-6 bg-card rounded-xl border border-border hover:border-primary/50 transition-all hover:shadow-lg">
                      <div className="flex items-start justify-between mb-4">
                        <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                          <BookOpen className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="font-medium">{featuredCourseData.rating}</span>
                        </div>
                      </div>
                      
                      <h4 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                        {featuredCourseData.title}
                      </h4>
                      
                      <p className="text-sm text-muted-foreground mb-4">
                        {featuredCourseData.description}
                      </p>
                      
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {featuredCourseData.duration}
                          </div>
                          <div className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {featuredCourseData.students.toLocaleString()}
                          </div>
                        </div>
                        <Badge variant="secondary">{featuredCourseData.level}</Badge>
                      </div>
                      
                      {featuredCourseData.topics && featuredCourseData.topics.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-4">
                          {featuredCourseData.topics.slice(0, 2).map((topic: string) => (
                            <span key={topic} className="px-2 py-1 bg-primary/10 text-primary text-xs rounded">
                              {topic}
                            </span>
                          ))}
                          {featuredCourseData.topics.length > 2 && (
                            <span className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                              +{featuredCourseData.topics.length - 2} más
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Por {featuredCourseData.instructor}
                        </span>
                        <div className="flex items-center text-primary group-hover:translate-x-1 transition-transform">
                          <span className="mr-1">Empezar curso</span>
                          <ExternalLink className="w-4 h-4" />
                        </div>
                      </div>
                    </div>
                  </a>
                </motion.div>
              ) : (
                <motion.div variants={fadeUp}>
                  <div className="p-6 bg-card rounded-xl border border-border text-center">
                    <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <h4 className="font-semibold mb-2">Curso no disponible</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      No hay cursos destacados disponibles en este momento.
                    </p>
                    <Button variant="outline" asChild>
                      <Link to="/academia">
                        Ver todos los cursos
                      </Link>
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
            
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section id="newsletter" className="py-24 bg-gradient-to-br from-primary/5 via-primary/3 to-background">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={staggerContainer}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <motion.div variants={fadeUp} className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold">
                Mantente al día con DeFi México
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Recibe las últimas noticias, análisis y oportunidades del ecosistema 
                DeFi mexicano directamente en tu inbox
              </p>
            </motion.div>

            <motion.form 
              variants={fadeUp}
              onSubmit={handleNewsletterSubmit}
              className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
            >
              <Input
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
                required
              />
              <Button 
                type="submit" 
                disabled={loadingNewsletter}
                className="whitespace-nowrap"
              >
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
            </motion.form>

            <motion.p variants={fadeUp} className="text-sm text-muted-foreground">
              Únete a más de 1,000 suscriptores. Sin spam, cancela cuando quieras.
            </motion.p>
          </motion.div>
        </div>
      </section>
    </div>
  );
}