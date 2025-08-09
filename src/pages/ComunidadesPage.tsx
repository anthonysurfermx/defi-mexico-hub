import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import CommunityCard from "@/components/ui/community-card";
import { mockCommunities } from "@/data/communities";
import { motion } from "framer-motion";

const CommunidadesPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const filteredCommunities = mockCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesYear = yearFilter === "all" || community.foundedYear.toString() === yearFilter;
    const matchesTags = selectedTags.length === 0 || 
                       selectedTags.every(tag => community.tags?.includes(tag));
    
    return matchesSearch && matchesYear && matchesTags;
  });

  const foundedYears = [...new Set(mockCommunities.map(s => s.foundedYear))].sort((a, b) => b - a);
  const allTags = [...new Set(mockCommunities.flatMap(s => s.tags || []))].sort();

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setYearFilter("all");
    setSelectedTags([]);
  };

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
            Comunidades <span className="text-gradient">DeFi México</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Únete a las comunidades más activas del ecosistema DeFi mexicano. 
            Desde Discord servers hasta meetups presenciales, encuentra tu tribu 
            y conecta con otros entusiastas de blockchain.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="space-y-6 mb-8"
        >
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
              <Input
                placeholder="Buscar comunidades por nombre o descripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <div className="flex gap-2">
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Año de fundación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos los años</SelectItem>
                  {foundedYears.map(year => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Tags Filter */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium text-foreground">Filtrar por categorías:</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <Badge 
                  key={tag}
                  variant={selectedTags.includes(tag) ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/20 transition-colors"
                  onClick={() => toggleTag(tag)}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>

          {/* Active Filters */}
          {(searchTerm || yearFilter !== "all" || selectedTags.length > 0) && (
            <div className="flex items-center gap-2 pt-2 border-t border-border">
              <span className="text-sm text-muted-foreground">Filtros activos:</span>
              {searchTerm && (
                <Badge variant="secondary" className="text-xs">
                  Búsqueda: "{searchTerm}"
                </Badge>
              )}
              {yearFilter !== "all" && (
                <Badge variant="secondary" className="text-xs">
                  Año: {yearFilter}
                </Badge>
              )}
              {selectedTags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={clearAllFilters}
                className="text-xs"
              >
                Limpiar todos
              </Button>
            </div>
          )}
        </motion.div>

        {/* Results Count */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mb-6"
        >
          <p className="text-muted-foreground">
            Mostrando {filteredCommunities.length} de {mockCommunities.length} comunidades
          </p>
        </motion.div>

        {/* Communities Grid */}
        {filteredCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCommunities.map((community, index) => (
              <motion.div
                key={community.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 * index }}
              >
                <CommunityCard {...community} />
              </motion.div>
            ))}
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground mb-2">
              Aún no hay comunidades registradas
            </h3>
            <p className="text-muted-foreground mb-4">
              ¡Sé el primero en registrar tu comunidad DeFi en nuestro ecosistema!
            </p>
            <Button 
              variant="outline" 
              onClick={clearAllFilters}
            >
              Limpiar filtros
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default CommunidadesPage;