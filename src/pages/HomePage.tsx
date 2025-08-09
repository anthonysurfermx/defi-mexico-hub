import { motion } from "framer-motion";
import { useEffect, useState, useMemo } from 'react';
import { ArrowRight, Rocket, Users, TrendingUp, Calendar, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { startupsService } from '../services/startups.service';
import { Link } from "react-router-dom";
import StartupCard from "@/components/ui/startup-card";
import BlogCard from "@/components/ui/blog-card";
import StatsCard from "@/components/ui/stats-card";
import { mockBlogPosts, mockEvents, mockStats } from "@/data/mockData";
import type { Startup } from "@/types/database.types";

// Framer Motion Variants
const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

const fadeIn = {
  hidden: { opacity: 0 },
  show: { opacity: 1 }
};

// Skeleton Component for Loading State
const StartupGridSkeleton = ({ count = 3 }: { count?: number }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-card rounded-xl border border-border p-6 animate-pulse">
        <div className="w-full h-48 bg-muted rounded-lg mb-4"></div>
        <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-full mb-4"></div>
        <div className="flex gap-2">
          <div className="h-6 bg-muted rounded-full w-20"></div>
          <div className="h-6 bg-muted rounded-full w-20"></div>
        </div>
      </div>
    ))}
  </div>
);

// Empty State Component
const EmptyState = ({ title, description }: { title: string; description: string }) => (
  <div className="text-center py-12">
    <div className="max-w-md mx-auto">
      <Rocket className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground">{description}</p>
    </div>
  </div>
);

const HomePage = () => {
  const [featuredStartups, setFeaturedStartups] = useState<Startup[]>([]);
  const [loadingStartups, setLoadingStartups] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        setError(null);
        const data = await startupsService.getFeatured();
        setFeaturedStartups(data);
      } catch (err: any) {
        console.error('Error loading featured startups:', err);
        setError('No pudimos cargar las startups. Intenta de nuevo más tarde.');
      } finally {
        setLoadingStartups(false);
      }
    };
    fetchFeatured();
  }, []);

  // Use useMemo for derived state
  const latestStartups = useMemo(() => featuredStartups.slice(0, 3), [featuredStartups]);
  const latestBlogPosts = useMemo(() => mockBlogPosts.slice(0, 3), []);
  const upcomingEvents = useMemo(() => 
    mockEvents.filter(event => event.isUpcoming).slice(0, 2), 
    []
  );

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden" aria-labelledby="hero-title">
        <div className="absolute inset-0 bg-gradient-glow opacity-30" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <motion.div
              initial="hidden"
              animate="show"
              variants={fadeUp}
              transition={{ duration: 0.8 }}
            >
              <h1 id="hero-title" className="text-5xl lg:text-7xl font-bold mb-6">
                <span className="text-gradient">DeFi México</span>
              </h1>
              <p className="text-xl lg:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
                Construimos el futuro de las finanzas descentralizadas en México. 
                Conectamos startups, desarrolladores y entusiastas para crear un 
                ecosistema DeFi próspero e inclusivo.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-primary text-primary-foreground hover:shadow-neon transition-all duration-300" 
                  asChild
                >
                  <Link 
                    to="/startups" 
                    aria-label="Descubre startups DeFi en México"
                    className="inline-flex items-center"
                  >
                    Descubre Startups
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Link>
                </Button>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
                  asChild
                >
                  <a 
                    href="https://t.me/defimexico" 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    aria-label="Únete al Telegram de DeFi México"
                    className="inline-flex items-center"
                  >
                    Únete al Telegram
                    <MessageCircle className="ml-2 w-5 h-5" />
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-darker-surface" aria-labelledby="stats-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-80px" }}
            className="text-center mb-12"
          >
            <h2 id="stats-title" className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Nuestro Impacto
            </h2>
            <p className="text-lg text-muted-foreground">
              Números que reflejan el crecimiento del ecosistema DeFi mexicano
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {mockStats.map((stat, index) => (
              <motion.div
                key={stat.title}
                initial="hidden"
                whileInView="show"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <StatsCard
                  title={stat.title}
                  value={stat.value}
                  description={stat.description}
                  icon={index === 0 ? Rocket : index === 1 ? Calendar : index === 2 ? Users : TrendingUp}
                  trend={stat.trend}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Startups */}
      <section className="py-16" aria-labelledby="startups-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 id="startups-title" className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Startups Destacadas
              </h2>
              <p className="text-lg text-muted-foreground">
                Descubre las últimas startups que están revolucionando DeFi en México
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/startups" className="inline-flex items-center">
                Ver todas
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          {/* Loading State with Skeletons */}
          {loadingStartups && <StartupGridSkeleton count={3} />}

          {/* Data State */}
          {!loadingStartups && !error && latestStartups.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestStartups.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial="hidden"
                  whileInView="show"
                  variants={fadeUp}
                  transition={{ duration: 0.6, delay: index * 0.08 }}
                  viewport={{ once: true }}
                >
                  <StartupCard {...startup} />
                </motion.div>
              ))}
            </div>
          )}

          {/* Error or Empty State */}
          {!loadingStartups && (error || latestStartups.length === 0) && (
            <EmptyState
              title={error ? "No pudimos cargar las startups" : "Aún no hay startups destacadas"}
              description={error || "Vuelve pronto, estamos preparando contenido increíble."}
            />
          )}
        </div>
      </section>

      {/* Latest Blog Posts */}
      <section className="py-16 bg-darker-surface" aria-labelledby="blog-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="flex justify-between items-center mb-12"
          >
            <div>
              <h2 id="blog-title" className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Últimas Publicaciones
              </h2>
              <p className="text-lg text-muted-foreground">
                Mantente al día con las últimas tendencias y análisis DeFi
              </p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/blog" className="inline-flex items-center">
                Ver blog
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {latestBlogPosts.map((post, index) => (
              <motion.div
                key={post.id}
                initial="hidden"
                whileInView="show"
                variants={fadeUp}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
              >
                <BlogCard {...post} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16" aria-labelledby="events-title">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 id="events-title" className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Próximos Eventos
            </h2>
            <p className="text-lg text-muted-foreground">
              Únete a nuestra comunidad en los próximos eventos
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {upcomingEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: index * 0.08 }}
                viewport={{ once: true }}
                className="bg-card p-6 rounded-xl border border-border hover:border-primary/30 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-primary/10 text-primary text-sm font-medium rounded-full">
                    {event.type}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {event.date} • {event.time}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {event.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {event.description}
                </p>
                <div className="text-sm text-muted-foreground">
                  📍 {event.location}
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div
            initial="hidden"
            whileInView="show"
            variants={fadeUp}
            transition={{ duration: 0.6, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-center mt-8"
          >
            <Button variant="outline" asChild>
              <Link to="/eventos" className="inline-flex items-center">
                Ver todos los eventos
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;