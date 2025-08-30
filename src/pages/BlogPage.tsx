// src/pages/BlogPage.tsx - SIMPLIFICADO
import React from "react";
import { motion } from "framer-motion";

const BlogPage = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Blog <span className="text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">DeFi México</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            Mantente al día con las últimas tendencias, análisis técnicos y noticias del ecosistema DeFi mexicano y global.
          </p>
        </motion.div>

        {/* Próximamente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border border-primary/20 p-8 text-center mt-12"
        >
          <div className="text-6xl mb-4">📝</div>
          <h3 className="text-2xl font-bold mb-4">Próximamente contenido educativo sobre DeFi</h3>
          <p className="text-muted-foreground mb-6">
            Estamos preparando artículos increíbles sobre finanzas descentralizadas. ¡Mantente atento!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Proponer artículo
            </button>
            <button className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
              Unirse a la comunidad
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPage;