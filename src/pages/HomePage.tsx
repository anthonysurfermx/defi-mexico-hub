// src/pages/HomePage.tsx - UPDATED
import React from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Shield, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const HomePage = () => {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center max-w-4xl mx-auto"
          >
            <h1 className="text-5xl md:text-7xl font-bold text-foreground mb-6">
              DeFi México <span className="text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Hub</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              El punto de encuentro del ecosistema DeFi mexicano. Descubre startups, conecta con comunidades y explora oportunidades de inversión.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:shadow-neon transition-all duration-300">
                <Link to="/oportunidades">
                  Ver Oportunidades
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/startups">Explorar Startups</Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-16"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Tu gateway al DeFi mexicano
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Conectamos el ecosistema DeFi mexicano en una sola plataforma
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-primary/20"
            >
              <TrendingUp className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Oportunidades de Inversión</h3>
              <p className="text-muted-foreground mb-4">
                Compara rendimientos entre fintech tradicional y DeFi en tiempo real.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/oportunidades">Ver más</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-primary/20"
            >
              <Shield className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Startups Verificadas</h3>
              <p className="text-muted-foreground mb-4">
                Directorio curado de startups DeFi mexicanas con análisis detallado.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/startups">Explorar</Link>
              </Button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-xl p-8 border border-primary/20"
            >
              <Users className="w-12 h-12 text-primary mb-4" />
              <h3 className="text-xl font-bold mb-3">Comunidades Activas</h3>
              <p className="text-muted-foreground mb-4">
                Únete a las comunidades más vibrantes del ecosistema DeFi mexicano.
              </p>
              <Button asChild variant="outline" size="sm">
                <Link to="/comunidades">Descubrir</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              ¿Listo para explorar el futuro de las finanzas?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              Únete a la revolución DeFi en México y descubre las mejores oportunidades del ecosistema.
            </p>
            <Button asChild size="lg" className="bg-gradient-primary text-primary-foreground hover:shadow-neon transition-all duration-300">
              <Link to="/oportunidades">
                Comenzar ahora
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;