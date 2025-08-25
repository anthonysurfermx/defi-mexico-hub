// src/components/ui/blog-card.tsx - ARREGLADO
import { Link } from "react-router-dom";
import { Calendar, Clock, ArrowRight } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

interface BlogCardProps {
  id: string;
  slug: string;  // ✅ AGREGADO - Para generar URL correcta
  title: string;
  excerpt: string;
  publishedAt: string;
  readTime: string;
  category: string;
  image?: string;
  author?: string;
}

const BlogCard = ({ 
  id, 
  slug,      // ✅ NUEVO PARÁMETRO
  title, 
  excerpt, 
  publishedAt, 
  readTime, 
  category, 
  image, 
  author 
}: BlogCardProps) => {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card className="h-full bg-card hover:shadow-elegant transition-all duration-300 border-border hover:border-primary/30 overflow-hidden">
        {image && (
          <div className="relative h-48 overflow-hidden">
            <img 
              src={image} 
              alt={title}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
            />
            <div className="absolute top-4 left-4">
              <Badge className="bg-primary text-primary-foreground">
                {category}
              </Badge>
            </div>
          </div>
        )}

        <CardHeader className="space-y-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Calendar className="w-4 h-4" />
              <span>{publishedAt}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{readTime}</span>
            </div>
          </div>
          
          <h3 className="font-semibold text-lg text-foreground line-clamp-2 hover:text-primary transition-colors">
            {title}
          </h3>
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground text-sm line-clamp-3 mb-4">
            {excerpt}
          </p>
          
          {author && (
            <div className="text-xs text-muted-foreground">
              Por {author}
            </div>
          )}
        </CardContent>

        <CardFooter>
          <Link 
            to={`/blog/${slug}`} // ✅ ARREGLADO - USA SLUG EN LUGAR DE ID
            className="inline-flex items-center text-primary hover:text-primary/80 transition-colors text-sm font-medium group"
          >
            Leer artículo
            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
          </Link>
        </CardFooter>
      </Card>
    </motion.div>
  );
};

export default BlogCard;