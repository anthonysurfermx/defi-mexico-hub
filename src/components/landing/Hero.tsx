import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { motion, useSpring, useTransform } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import { Rocket, Shield, Users, GitBranch, ArrowRight, Zap } from "lucide-react";

// Animated number using framer-motion springs
function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 120, damping: 20 });
  useEffect(() => {
    spring.set(value);
  }, [value, spring]);
  const rounded = useTransform(spring, (latest) => Math.floor(latest));
  return <motion.span aria-live="polite">{rounded}</motion.span>;
}


const partners = [
  { name: "Bitso" },
  { name: "Kubo Financiero" },
  { name: "Agrotoken" },
  { name: "DeFi Latam" },
  { name: "Minka" },
  { name: "Polygon" },
  { name: "Ethereum MX" },
];

export default function Hero() {
  // auto-scroll carousel every 3s
  useEffect(() => {
    const buttons = document.querySelectorAll<HTMLButtonElement>("[data-hero-carousel-next]");
    const interval = setInterval(() => {
      buttons.forEach((btn) => btn.click());
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // SEO heading text
  const heading = useMemo(() => "DeFi México — Hub del Ecosistema Blockchain Mexicano", []);

  return (
    <section className="relative overflow-hidden py-20 lg:py-28 gradient-purple">
      {/* Glow overlay */}
      <div className="absolute inset-0 opacity-25 gradient-glow" aria-hidden="true" />

      {/* Floating pseudo-3D shapes */}
      <motion.div
        className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl"
        animate={{ y: [0, -15, 0], x: [0, 10, 0] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />
      <motion.div
        className="pointer-events-none absolute -bottom-24 -left-24 w-80 h-80 rounded-3xl bg-secondary/10 blur-3xl rotate-12"
        animate={{ y: [0, 18, 0], x: [0, -12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        aria-hidden
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-card/40 backdrop-blur border border-border/60 shadow-elegant mb-6"
            aria-label="Badge principal del sitio"
          >
            <Zap className="w-4 h-4 text-primary" aria-hidden />
            <span className="text-sm">El Hub #1 de DeFi en México</span>
          </motion.div>

          {/* Heading */}
          <h1 className="text-4xl md:text-6xl font-extrabold text-white drop-shadow">
            {heading}
          </h1>
          <p className="text-white/80 mt-4 text-lg md:text-xl">
            Conecta con startups, eventos y recursos para construir el futuro de las finanzas descentralizadas en México.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" asChild className="shadow-neon transition-standard">
              <Link to="/startups" aria-label="Explorar startups DeFi en México">
                Explorar Startups
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="transition-standard">
              <Link to="/dashboard-web3" aria-label="Ver dashboard Web3">
                Ver Dashboard
                <ArrowRight className="ml-2 w-5 h-5" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* Stats counters */}
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="glass-card rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
                <Rocket className="w-4 h-4 text-primary" aria-hidden /> Startups
              </div>
              <div className="text-3xl font-bold text-white"><AnimatedNumber value={128} />+</div>
            </div>
            <div className="glass-card rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
                <Users className="w-4 h-4 text-primary" aria-hidden /> Miembros
              </div>
              <div className="text-3xl font-bold text-white"><AnimatedNumber value={8200} />+</div>
            </div>
            <div className="glass-card rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
                <Shield className="w-4 h-4 text-primary" aria-hidden /> TVL
              </div>
              <div className="text-3xl font-bold text-white">$<AnimatedNumber value={12} />M</div>
            </div>
            <div className="glass-card rounded-xl p-5 text-left">
              <div className="flex items-center gap-2 text-sm text-white/80 mb-1">
                <GitBranch className="w-4 h-4 text-primary" aria-hidden /> Proyectos
              </div>
              <div className="text-3xl font-bold text-white"><AnimatedNumber value={45} />+</div>
            </div>
          </div>
        </div>

        {/* Partners carousel */}
        <div className="mt-12 glass-card rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/80 text-sm">Aliados del ecosistema</p>
          </div>
          <Carousel opts={{ align: "start", loop: true }}>
            <CarouselContent className="-ml-2">
              {partners.concat(partners).map((p, idx) => (
                <CarouselItem key={`${p.name}-${idx}`} className="basis-1/2 md:basis-1/5 pl-2">
                  <div className="h-14 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                    {/* Using placeholder but keeping semantic alt text */}
                    <img
                      src="/placeholder.svg"
                      alt={`Logo de ${p.name}`}
                      loading="lazy"
                      className="h-8 w-auto opacity-90"
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="h-8 w-8" aria-label="Anterior logos" />
            <CarouselNext className="h-8 w-8" aria-label="Siguiente logos" data-hero-carousel-next />
          </Carousel>
        </div>

        {/* Bento grid features */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass-card rounded-xl p-6 md:col-span-2">
            <h3 className="text-white font-semibold mb-2">Eventos y Comunidad</h3>
            <p className="text-white/80 text-sm mb-4">Aprende, conecta y colabora en meetups, workshops y conferencias.</p>
            <Button asChild variant="outline" size="sm">
              <Link to="/eventos" aria-label="Explorar eventos">Ver eventos</Link>
            </Button>
          </div>
          <div className="glass-card rounded-xl p-6">
            <h3 className="text-white font-semibold mb-2">Recursos</h3>
            <p className="text-white/80 text-sm mb-4">Guías, artículos y herramientas para crecer en Web3.</p>
            <Button asChild size="sm">
              <Link to="/blog" aria-label="Leer el blog">Ir al blog</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
