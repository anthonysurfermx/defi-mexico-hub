import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreHorizontal 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Link } from "react-router-dom";
import { mockStartups } from "@/data/mockData";

const AdminStartups = () => {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);

  // Filter logic
  const filteredStartups = mockStartups.filter(startup => {
    const matchesSearch = startup.name.toLowerCase().includes(search.toLowerCase()) ||
                         startup.description.toLowerCase().includes(search.toLowerCase());
    
    const matchesCategory = selectedCategory === "all" || 
                           startup.tags?.includes(selectedCategory);
    
    // Mock status - in real app this would come from data
    const status = Math.random() > 0.8 ? "draft" : "published";
    const matchesStatus = selectedStatus === "all" || status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const allCategories = Array.from(
    new Set(mockStartups.flatMap(s => s.tags || []))
  );

  const toggleStartupSelection = (startupId: string) => {
    setSelectedStartups(prev => 
      prev.includes(startupId) 
        ? prev.filter(id => id !== startupId)
        : [...prev, startupId]
    );
  };

  const toggleSelectAll = () => {
    setSelectedStartups(
      selectedStartups.length === filteredStartups.length 
        ? [] 
        : filteredStartups.map(s => s.id)
    );
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Startups</h1>
          <p className="text-muted-foreground">
            Administra el directorio de startups de DeFi México
          </p>
        </div>
        <Button asChild className="bg-gradient-primary text-primary-foreground">
          <Link to="/admin/startups/new" className="flex items-center">
            <Plus className="w-4 h-4 mr-2" />
            Nueva Startup
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-card border-border">
        <CardContent className="p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre o descripción..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Category Filter */}
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las categorías</SelectItem>
                {allCategories.map(category => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Status Filter */}
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-full lg:w-48">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="published">Publicado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="w-full lg:w-auto">
              <Filter className="w-4 h-4 mr-2" />
              Más filtros
            </Button>
          </div>

          {/* Results count and bulk actions */}
          <div className="flex justify-between items-center mt-4 pt-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              {filteredStartups.length} startup{filteredStartups.length !== 1 ? 's' : ''} encontrada{filteredStartups.length !== 1 ? 's' : ''}
            </div>
            
            {selectedStartups.length > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {selectedStartups.length} seleccionada{selectedStartups.length !== 1 ? 's' : ''}
                </span>
                <Button variant="destructive" size="sm">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Startups Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedStartups.length === filteredStartups.length && filteredStartups.length > 0}
                      onCheckedChange={toggleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Startup</TableHead>
                  <TableHead>Categorías</TableHead>
                  <TableHead>Founders</TableHead>
                  <TableHead>Fundación</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="w-24">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStartups.map((startup) => {
                  const isSelected = selectedStartups.includes(startup.id);
                  const status = Math.random() > 0.8 ? "draft" : "published"; // Mock status
                  
                  return (
                    <TableRow key={startup.id} className={isSelected ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleStartupSelection(startup.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={startup.logo} alt={startup.name} />
                            <AvatarFallback className="bg-primary/10 text-primary">
                              {startup.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-foreground">{startup.name}</div>
                            <div className="text-sm text-muted-foreground max-w-xs truncate">
                              {startup.description}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1 max-w-48">
                          {startup.tags?.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {startup.tags && startup.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{startup.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {startup.founders.slice(0, 2).join(", ")}
                          {startup.founders.length > 2 && ` +${startup.founders.length - 2}`}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {startup.foundedYear}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={status === "published" ? "default" : "secondary"}
                          className={status === "published" ? "bg-neon-green/10 text-neon-green" : ""}
                        >
                          {status === "published" ? "Publicado" : "Borrador"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link to={`/startups/${startup.id}`}>
                                <Eye className="w-4 h-4 mr-2" />
                                Ver
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Edit3 className="w-4 h-4 mr-2" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash2 className="w-4 h-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex items-center justify-between p-4 border-t border-border">
              <div className="text-sm text-muted-foreground">
                Mostrando 1-{Math.min(10, filteredStartups.length)} de {filteredStartups.length}
              </div>
              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" disabled>
                  Anterior
                </Button>
                <Button variant="outline" size="sm">
                  Siguiente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminStartups;