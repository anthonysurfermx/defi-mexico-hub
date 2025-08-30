// src/pages/CommunitiesPage.tsx - UPDATED
import React from "react";
import { motion } from "framer-motion";

const CommunitiesPage = () => {
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
            Comunidades <span className="text-gradient bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">DeFi</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto mb-4">
            Descubre y únete a las comunidades más activas del ecosistema DeFi mexicano.
          </p>
        </motion.div>

        {/* Próximamente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 rounded-xl border border-primary/20 p-8 text-center mt-12"
        >
          <div className="text-6xl mb-4">🏘️</div>
          <h3 className="text-2xl font-bold mb-4">Directorio de comunidades en desarrollo</h3>
          <p className="text-muted-foreground mb-6">
            Estamos construyendo el directorio más completo de comunidades DeFi en México.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
              Registrar comunidad
            </button>
            <button className="px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors">
              Ver roadmap
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CommunitiesPage;