// src/pages/BlogPostPage.tsx - SIMPLIFICADO
import React from "react";
import { motion } from "framer-motion";

const BlogPostPage = () => {
  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold mb-4">Artículo no encontrado</h1>
          <p className="text-muted-foreground">Este artículo no existe o ha sido eliminado.</p>
        </motion.div>
      </div>
    </div>
  );
};

export default BlogPostPage;