import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, ArrowUpRight, Users, TrendingUp, Globe, Filter, Rocket, DollarSign, Loader2 } from 'lucide-react';
import { startupsService } from '@/services/startups.service';

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
  // Campos adicionales para compatibilidad
  stage?: string;
  funding_stage?: string;
  employee_range?: string;
}

export default function StartupsPage() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStage, setSelectedStage] = useState('all');

  useEffect(() => {
    loadStartups();
  }, []);

  const loadStartups = async () => {
    try {
      setLoading(true);
      const data = await startupsService.getAll();
      console.log('Startups loaded:', data);
      setStartups(data || []);
    } catch (error) {
      console.error('Error loading startups:', error);
      setStartups([]);
    } finally {
      setLoading(false);
    }
  };

  // Extraer categorías únicas de las startups
  const allCategories = Array.from(
    new Set(startups.flatMap(s => s.categories || s.tags || []))
  ).filter(Boolean);

  // Extraer stages únicos
  const allStages = Array.from(
    new Set(startups.map(s => s.stage || s.funding_stage || 'N/A').filter(s => s !== 'N/A'))
  );

  const filteredStartups = startups.filter(startup => {
    const matchesSearch = 
      (startup.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (startup.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === 'all' || 
      startup.categories?.includes(selectedCategory) ||
      startup.tags?.includes(selectedCategory);
    
    const matchesStage = selectedStage === 'all' || 
      startup.stage === selectedStage ||
      startup.funding_stage === selectedStage;
    
    return matchesSearch && matchesCategory && matchesStage;
  });


  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Directorio de Startups</h1>
          <p className="text-muted-foreground text-lg">
            Descubre las empresas que están liderando la revolución DeFi en México
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar startups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {allCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {allStages.length > 0 && (
            <Select value={selectedStage} onValueChange={setSelectedStage}>
              <SelectTrigger className="w-full md:w-[180px]">
                <SelectValue placeholder="Etapa" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {allStages.map(stage => (
                  <SelectItem key={stage} value={stage}>
                    {stage}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" />
            Más filtros
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Startups</CardDescription>
              <CardTitle className="text-2xl">{filteredStartups.length}</CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Startups Grid */}
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredStartups.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStartups.map((startup) => (
              <Card key={startup.id} className="hover:shadow-lg transition-all hover:-translate-y-1">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-3">
                      {startup.logo_url ? (
                        <img 
                          src={startup.logo_url} 
                          alt={startup.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Rocket className="w-6 h-6 text-primary" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-xl">{startup.name}</CardTitle>
                        {startup.founded_date && (
                          <p className="text-xs text-muted-foreground">
                            Fundada en {new Date(startup.founded_date).getFullYear()}
                          </p>
                        )}
                      </div>
                    </div>
                    {startup.is_featured && (
                      <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-600">
                        ⭐ Destacada
                      </Badge>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {startup.description || 'Innovando en el ecosistema DeFi de México'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {startup.categories?.slice(0, 1).map((cat) => (
                      <Badge key={cat} variant="outline">{cat}</Badge>
                    ))}
                    {startup.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    {startup.total_users && (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{startup.total_users.toLocaleString()} usuarios</span>
                      </div>
                    )}
                    {startup.city && (
                      <span>📍 {startup.city}</span>
                    )}
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <div className="flex gap-2 w-full">
                    <Button asChild variant="outline" className="flex-1">
                      <Link to={`/startups/${startup.id}`}>Ver más</Link>
                    </Button>
                    {startup.website && (
                      <Button asChild variant="default" size="icon">
                        <a href={startup.website} target="_blank" rel="noopener noreferrer">
                          <Globe className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="p-12 text-center">
            <Rocket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No se encontraron startups</h3>
            <p className="text-muted-foreground mb-4">
              {searchQuery || selectedCategory !== 'all' || selectedStage !== 'all' 
                ? 'Intenta ajustar los filtros o buscar con otros términos'
                : 'No hay startups publicadas en este momento'}
            </p>
            {!loading && startups.length === 0 && (
              <Button asChild variant="outline">
                <Link to="/admin/startups/new">
                  <Rocket className="w-4 h-4 mr-2" />
                  Agregar primera startup
                </Link>
              </Button>
            )}
          </Card>
        )}
      </div>
    </div>
  );
}