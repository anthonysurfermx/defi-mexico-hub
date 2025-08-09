import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, ExternalLink, Calendar, Users, BarChart3, Twitter, Linkedin, MessageCircle, Github, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCommunities } from "@/data/communities";
import { motion } from "framer-motion";

const CommunityDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const community = mockCommunities.find(s => s.id === id);

  if (!community) {
    return (
      <div className="min-h-screen py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-foreground mb-4">Comunidad no encontrada</h1>
            <p className="text-muted-foreground mb-6">La comunidad que buscas no existe o ha sido eliminada.</p>
            <Button onClick={() => navigate("/comunidades")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Comunidades
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const getSocialIcon = (platform: string) => {
    switch (platform) {
      case 'twitter': return Twitter;
      case 'linkedin': return Linkedin;
      case 'telegram': return MessageCircle;
      case 'discord': return MessageCircle;
      case 'github': return Github;
      case 'medium': return Globe;
      case 'meetup': return Globe;
      case 'instagram': return Globe;
      default: return Globe;
    }
  };

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
            onClick={() => navigate("/comunidades")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Volver a Comunidades
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
              <div className="w-20 h-20 bg-gradient-primary rounded-2xl flex items-center justify-center text-primary-foreground font-bold text-2xl">
                {(community as any).logo ? (
                  <img src={(community as any).logo} alt={community.name} className="w-full h-full object-cover rounded-2xl" />
                ) : (
                  community.name.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">{community.name}</h1>
                <div className="flex items-center text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4 mr-2" />
                  Fundada en {community.foundedYear}
                </div>
                <div className="flex gap-2">
                  {community.platform && (
                    <Badge variant="outline" className="text-xs">
                      📱 {community.platform}
                    </Badge>
                  )}
                  {community.region && (
                    <Badge variant="outline" className="text-xs">
                      📍 {community.region}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex flex-wrap gap-2 lg:ml-auto">
              {community.tags?.map((tag) => (
                <Badge key={tag} variant="default" className="bg-primary/10 text-primary hover:bg-primary/20">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>

          <p className="text-lg text-muted-foreground mt-6 leading-relaxed">
            {community.longDescription || community.description}
          </p>

          <div className="flex flex-wrap gap-4 mt-6">
            {community.website && (
              <Button asChild>
                <a href={community.website} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Unirse a la Comunidad
                </a>
              </Button>
            )}
            
            {community.socialLinks && Object.entries(community.socialLinks).map(([platform, url]) => {
              const Icon = getSocialIcon(platform);
              return (
                <Button key={platform} variant="outline" size="sm" asChild>
                  <a href={url} target="_blank" rel="noopener noreferrer">
                    <Icon className="w-4 h-4 mr-2" />
                    {platform.charAt(0).toUpperCase() + platform.slice(1)}
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
                  Métricas de la Comunidad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {community.members && (
                    <div className="text-center p-4 bg-primary/5 rounded-lg">
                      <div className="text-2xl font-bold text-primary">{community.members}</div>
                      <div className="text-sm text-muted-foreground">Miembros Totales</div>
                    </div>
                  )}
                  {community.monthlyMessages && (
                    <div className="text-center p-4 bg-secondary/10 rounded-lg">
                      <div className="text-2xl font-bold text-secondary">{community.monthlyMessages}</div>
                      <div className="text-sm text-muted-foreground">Mensajes por Mes</div>
                    </div>
                  )}
                  {community.metrics && Object.entries(community.metrics).map(([key, value]) => (
                    <div key={key} className="text-center p-4 bg-accent/10 rounded-lg">
                      <div className="text-2xl font-bold text-accent">{value}</div>
                      <div className="text-sm text-muted-foreground capitalize">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Additional Metrics */}
            {community.metrics && (
              <Card>
                <CardHeader>
                  <CardTitle>Métricas Adicionales</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(community.metrics).map(([key, value]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </span>
                        <span className="font-semibold text-foreground">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Sidebar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="space-y-6"
          >
            {/* Founders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Fundadores
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {community.founders.map((founder, index) => (
                    <div key={founder} className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center text-primary-foreground font-semibold">
                        {founder.split(' ').map(n => n[0]).join('')}
                      </div>
                      <div>
                        <div className="font-medium text-foreground">{founder}</div>
                        <div className="text-sm text-muted-foreground">Co-fundador</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Community Info */}
            <Card>
              <CardHeader>
                <CardTitle>Información de la Comunidad</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Año de Fundación</span>
                  <span className="font-medium">{community.foundedYear}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fundadores</span>
                  <span className="font-medium">{community.founders.length}</span>
                </div>
                {community.platform && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Plataforma</span>
                    <span className="font-medium">{community.platform}</span>
                  </div>
                )}
                {community.region && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Región</span>
                    <span className="font-medium">{community.region}</span>
                  </div>
                )}
                {community.type && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo</span>
                    <span className="font-medium capitalize">{community.type}</span>
                  </div>
                )}
                {community.tags && (
                  <div>
                    <span className="text-muted-foreground block mb-2">Categorías</span>
                    <div className="flex flex-wrap gap-1">
                      {community.tags.map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CommunityDetailPage;