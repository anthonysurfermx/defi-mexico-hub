// src/components/ui/community-card.tsx
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  ExternalLink, 
  MapPin, 
  Calendar, 
  Shield, 
  Star,
  Globe,
  Github,
  Twitter,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CommunityCardProps {
  id: string;
  name: string;
  description: string;
  logo?: string | null;
  members?: string | number;
  category?: string;
  location?: string | null;
  tags?: string[] | null;
  website?: string | null;
  socialLinks?: any;
  isActive?: boolean;
  isFeatured?: boolean;
  foundedDate?: string | null;
  slug?: string;
}

const categoryColors: Record<string, string> = {
  blockchain: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  defi: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  nft: "bg-pink-500/10 text-pink-500 border-pink-500/20",
  dao: "bg-green-500/10 text-green-500 border-green-500/20",
  educacion: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  desarrollo: "bg-indigo-500/10 text-indigo-500 border-indigo-500/20",
  trading: "bg-red-500/10 text-red-500 border-red-500/20",
  default: "bg-gray-500/10 text-gray-500 border-gray-500/20"
};

export default function CommunityCard({
  id,
  name,
  description,
  logo,
  members = "0",
  category = "",
  location,
  tags = [],
  website,
  socialLinks,
  isActive = true,
  isFeatured = false,
  foundedDate,
  slug
}: CommunityCardProps) {
  // Parsear social links si vienen como JSON
  const parsedSocialLinks = typeof socialLinks === 'string' 
    ? JSON.parse(socialLinks) 
    : socialLinks || {};

  const categoryColor = categoryColors[category?.toLowerCase()] || categoryColors.default;
  const memberCount = typeof members === 'number' ? members.toLocaleString() : members;

  // Calcular años desde fundación
  const foundedYear = foundedDate ? new Date(foundedDate).getFullYear() : null;
  
  return (
    <Card className={cn(
      "group relative overflow-hidden transition-all duration-300 hover:shadow-xl",
      "bg-gradient-to-br from-card to-card/80 border-border/50",
      isFeatured && "ring-2 ring-primary/20",
      !isActive && "opacity-60"
    )}>
      {/* Featured Badge */}
      {isFeatured && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <Star className="w-3 h-3 mr-1" />
            Destacada
          </Badge>
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          {/* Logo */}
          <div className="relative">
            <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center overflow-hidden">
              {logo ? (
                <>
                  <img 
                    src={logo} 
                    alt={name} 
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <span className="hidden text-2xl font-bold text-primary">
                    {name.charAt(0).toUpperCase()}
                  </span>
                </>
              ) : (
                <span className="text-2xl font-bold text-primary">
                  {name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            {isActive && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-card" />
            )}
          </div>

          {/* Title and Category */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg text-foreground truncate group-hover:text-primary transition-colors">
              {name}
            </h3>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className={cn("text-xs", categoryColor)}>
                {category}
              </Badge>
              {isActive && (
                <Shield className="w-4 h-4 text-green-500" title="Comunidad Verificada" />
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">
          {description}
        </p>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{memberCount}</span>
            <span className="text-muted-foreground">miembros</span>
          </div>
          
          {location && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">{location}</span>
            </div>
          )}

          {foundedYear && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">Desde {foundedYear}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.slice(0, 3).map((tag, index) => (
              <Badge 
                key={index} 
                variant="secondary" 
                className="text-xs px-2 py-0.5"
              >
                {tag}
              </Badge>
            ))}
            {tags.length > 3 && (
              <Badge 
                variant="outline" 
                className="text-xs px-2 py-0.5 text-muted-foreground"
              >
                +{tags.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Social Links */}
        <div className="flex items-center justify-between pt-2 border-t border-border/50">
          <div className="flex gap-1">
            {website && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                asChild
              >
                <a 
                  href={website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Visitar sitio web de ${name}`}
                >
                  <Globe className="w-4 h-4" />
                </a>
              </Button>
            )}
            
            {parsedSocialLinks?.github && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                asChild
              >
                <a 
                  href={parsedSocialLinks.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`GitHub de ${name}`}
                >
                  <Github className="w-4 h-4" />
                </a>
              </Button>
            )}
            
            {parsedSocialLinks?.twitter && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                asChild
              >
                <a 
                  href={parsedSocialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Twitter de ${name}`}
                >
                  <Twitter className="w-4 h-4" />
                </a>
              </Button>
            )}
            
            {parsedSocialLinks?.discord && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8"
                asChild
              >
                <a 
                  href={parsedSocialLinks.discord} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  aria-label={`Discord de ${name}`}
                >
                  <MessageCircle className="w-4 h-4" />
                </a>
              </Button>
            )}
          </div>

          {/* View Details Button */}
          <Button 
            variant="default" 
            size="sm"
            className="group/btn"
            asChild
          >
            <Link to={`/comunidades/${slug || id}`}>
              Ver más
              <ExternalLink className="w-3 h-3 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}