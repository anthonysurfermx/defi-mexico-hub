import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowLeft, ExternalLink, Calendar, Users, BarChart3, Twitter, Linkedin, MessageCircle, Github, Globe, Building2, MapPin, Loader2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { motion } from "framer-motion";
import { startupsService } from "@/services/startups.service";
import { supabase } from "@/lib/supabase";

interface Startup {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  founded_date?: string;
  linkedin_url?: string;
  twitter_url?: string;
  github_url?: string;
  tags?: string[];
  categories?: string[];
  total_users?: number;
  is_featured?: boolean;
  status: string;
  country?: string;
  city?: string;
  created_at?: string;
  // Campos adicionales que podrías tener
  stage?: string;
  funding_stage?: string;
  employee_range?: string;
  verification_status?: string;
}

const StartupDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [startup, setStartup] = useState<Startup | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStartup();
  }, [id]);

  const loadStartup = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      
      setStartup(data);
    } catch (error) {
      console.error('Error loading startup:', error);
      setStartup(null);
    } finally {
      setLoading(false);
    }
  };

  const getSocialIcon = (platform: string) => {
    switch (platform.toLowerCase()) {
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      case 'telegram': return MessageCircle;
      case 'discord': return MessageCircle;
      case 'github': return Github;
      default: return Globe;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!startup) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <Building2 className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h1 className="text-2xl font-bold text-foreground mb-4">Startup no encontrada</h1>
            <p className="text-muted-foreground mb-6">La startup que buscas no existe o ha sido eliminada.</p>
            <Button onClick={() => navigate("/startups")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Startups
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Preparar las redes sociales
  const socialLinks: Record<string, string> = {};
  if (startup.twitter_url) socialLinks.Twitter = startup.twitter_url;
  if (startup.linkedin_url) socialLinks.LinkedIn = startup.linkedin_url;
  if (startup.github_url) socialLinks.GitHub = startup.github_url;

  // Obtener el año de fundación
  const foundedYear = startup.founded_date ? new Date(startup.founded_date).getFullYear() : null;

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-6"
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate("/startups")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Startups
          </Button>
        </motion.div>

        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-8 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            <div className="flex items-center space-x-4">
              {startup.logo_url ? (
                <img 
                  src={startup.logo_url} 
                  alt={startup.name}
                  className="w-20 h-20 rounded-2xl object-cover"
                />
              ) : (
                <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl">
                  {startup.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl lg:text-4xl font-bold text-foreground">{startup.name}</h1>
                  {startup.is_featured && (
                    <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
                  )}
                </div>
                {foundedYear && (
                  <div className="flex items-center text-muted-foreground mb-2">
                    <Calendar className="w-4 h-4 mr-2" />
                    Fundada en {foundedYear}
                  </div>
                )}
                {(startup.city || startup.country) && (
                  <div className="flex items-center text-muted-foreground">
                    <MapPin className="w-4 h-4 mr-2" />
                    {[startup.city, startup.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              {startup.categories?.map((cat) => (
                <Badge key={cat} variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {cat}
                </Badge>
              ))}
              {startup.tags?.map((tag) => (
                <Badge key={tag} variant="outline">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-lg text-muted-foreground mt-6 leading-relaxed">
            {startup.description || 'Innovando en el ecosistema DeFi de México'}
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            {startup.website && (
              <Button asChild>
                <a href={startup.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Sitio Web
                </a>
              </Button>
            )}
            
            {Object.entries(socialLinks).map(([platform, url]) => {
              const Icon = getSocialIcon(platform);
              return (
                <Button key={platform} variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="w-4 h-4 mr-2" />
                    {platform}
                  </a>
                </Button>
              );
            })}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Metrics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="w-5 h-5 mr-2" />
                  Métricas Principales
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {startup.total_users && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">
                        {startup.total_users.toLocaleString()}
                      </div>
                      <div className="text-sm text-muted-foreground">Usuarios Totales</div>
                    </div>
                  )}
                  {startup.stage && (
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <div className="text-xl font-bold text-secondary capitalize">{startup.stage}</div>
                      <div className="text-sm text-muted-foreground">Etapa</div>
                    </div>
                  )}
                  {startup.funding_stage && (
                    <div className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-xl font-bold text-accent capitalize">
                        {startup.funding_stage.replace('-', ' ')}
                      </div>
                      <div className="text-sm text-muted-foreground">Ronda de Inversión</div>
                    </div>
                  )}
                  {startup.employee_range && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-xl font-bold text-primary">{startup.employee_range}</div>
                      <div className="text-sm text-muted-foreground">Empleados</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información Adicional</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <span className="text-muted-foreground">Estado</span>
                    <Badge variant={startup.status === 'published' || startup.status === 'approved' ? 'default' : 'secondary'}>
                      {startup.status}
                    </Badge>
                  </div>
                  {startup.verification_status && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Verificación</span>
                      <Badge variant={startup.verification_status === 'verified' ? 'default' : 'outline'}>
                        {startup.verification_status}
                      </Badge>
                    </div>
                  )}
                  {startup.created_at && (
                    <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                      <span className="text-muted-foreground">Registrada</span>
                      <span className="font-semibold text-foreground">
                        {new Date(startup.created_at).toLocaleDateString('es-MX', {
                          year: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Company Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Empresa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {foundedYear && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Año de Fundación</span>
                    <span className="font-medium">{foundedYear}</span>
                  </div>
                )}
                {startup.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Ciudad</span>
                    <span className="font-medium">{startup.city}</span>
                  </div>
                )}
                {startup.country && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">País</span>
                    <span className="font-medium">{startup.country}</span>
                  </div>
                )}
                {(startup.categories && startup.categories.length > 0) && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Categorías</span>
                    <div className="flex flex-wrap gap-1">
                      {startup.categories.map(cat => (
                        <Badge key={cat} variant="outline" className="text-xs">
                          {cat}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {(startup.tags && startup.tags.length > 0) && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Tags</span>
                    <div className="flex flex-wrap gap-1">
                      {startup.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {startup.website && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={startup.website} target="_blank" rel="noopener noreferrer">
                      <Globe className="w-4 h-4 mr-2" />
                      Visitar Sitio Web
                    </a>
                  </Button>
                )}
                {startup.twitter_url && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={startup.twitter_url} target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4 mr-2" />
                      Seguir en Twitter
                    </a>
                  </Button>
                )}
                {startup.linkedin_url && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={startup.linkedin_url} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-2" />
                      Ver en LinkedIn
                    </a>
                  </Button>
                )}
                {startup.github_url && (
                  <Button variant="outline" className="w-full justify-start" asChild>
                    <a href={startup.github_url} target="_blank" rel="noopener noreferrer">
                      <Github className="w-4 h-4 mr-2" />
                      Ver en GitHub
                    </a>
                  </Button>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default StartupDetailPage;