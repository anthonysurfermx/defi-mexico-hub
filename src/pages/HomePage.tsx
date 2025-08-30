// src/pages/HomePage.tsx - SIN SECCIÓN DE ESTADÍSTICAS
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
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Star,
  Globe,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { blogService, type DomainPost } from '@/services/blog.service';

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

  // Cargar blog posts al montar el componente
  useEffect(() => {
    loadFeaturedBlogPosts();
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
                    href="https://t.me/defimexico" 
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
                {/* Evento 1 */}
                <motion.div variants={fadeUp}>
                  <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">
                        Próximo
                      </span>
                      <span className="text-xs text-muted-foreground">15 Sep 2024</span>
                    </div>
                    <h4 className="font-semibold mb-1">DeFi México Meetup - CDMX</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Networking y charlas sobre las últimas tendencias en DeFi mexicano
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        Polanco, Ciudad de México
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        18:00 - 21:00
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Evento 2 */}
                <motion.div variants={fadeUp}>
                  <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        Workshop
                      </span>
                      <span className="text-xs text-muted-foreground">22 Sep 2024</span>
                    </div>
                    <h4 className="font-semibold mb-1">Construyendo tu primera DApp</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Taller práctico para desarrolladores sobre desarrollo en blockchain
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        Guadalajara, JAL
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        10:00 - 16:00
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Evento 3 */}
                <motion.div variants={fadeUp}>
                  <div className="p-4 bg-card rounded-lg border border-border hover:border-primary/50 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">
                        Conferencia
                      </span>
                      <span className="text-xs text-muted-foreground">10 Oct 2024</span>
                    </div>
                    <h4 className="font-semibold mb-1">Conferencia Anual DeFi México 2024</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      El evento más importante del ecosistema con speakers internacionales
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-xs text-muted-foreground">
                        <MapPin className="w-3 h-3 mr-1" />
                        Centro de Convenciones, CDMX
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3 mr-1" />
                        09:00 - 18:00
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>
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