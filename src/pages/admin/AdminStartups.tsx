import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  Loader2,
  Building2
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
import { Link, useNavigate } from "react-router-dom";
import { startupsService } from "@/services/startups.service";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";

interface Startup {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  website?: string;
  logo_url?: string;
  founded_date?: string;
  tags?: string[];
  categories?: string[];
  status: string;
  is_featured?: boolean;
  created_at?: string;
  total_users?: number;
  city?: string;
  country?: string;
}

const AdminStartups = () => {
  const navigate = useNavigate();
  const [startups, setStartups] = useState<Startup[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedStartups, setSelectedStartups] = useState<string[]>([]);

  useEffect(() => {
    loadStartups();
  }, []);

  const loadStartups = async () => {
    try {
      setLoading(true);
      // Cargar TODAS las startups, no solo las publicadas
      const { data, error } = await supabase
        .from('startups')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('Startups loaded in admin:', data);
      setStartups(data || []);
    } catch (error) {
      console.error('Error loading startups:', error);
      toast.error('Error al cargar las startups');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de eliminar "${name}"?`)) return;

    try {
      const { error } = await supabase
        .from('startups')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Startup eliminada correctamente');
      loadStartups(); // Recargar lista
    } catch (error) {
      console.error('Error deleting startup:', error);
      toast.error('Error al eliminar la startup');
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('startups')
        .update({ status: newStatus })
        .eq('id', id);

      if (error) throw error;

      toast.success(`Estado actualizado a ${newStatus}`);
      loadStartups(); // Recargar lista
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Error al actualizar el estado');
    }
  };

  // Obtener categorías únicas
  const allCategories = Array.from(
    new Set(startups.flatMap(s => s.categories || s.tags || []))
  ).filter(Boolean);

  // Filtrar startups
  const filteredStartups = startups.filter(startup => {
    const matchesSearch = 
      startup.name.toLowerCase().includes(search.toLowerCase()) ||
      (startup.description?.toLowerCase().includes(search.toLowerCase()) || false);
    
    const matchesCategory = selectedCategory === "all" || 
      startup.categories?.includes(selectedCategory) ||
      startup.tags?.includes(selectedCategory);
    
    const matchesStatus = selectedStatus === "all" || startup.status === selectedStatus;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

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

  const handleBulkDelete = async () => {
    if (!confirm(`¿Eliminar ${selectedStartups.length} startups seleccionadas?`)) return;

    try {
      const { error } = await supabase
        .from('startups')
        .delete()
        .in('id', selectedStartups);

      if (error) throw error;

      toast.success(`${selectedStartups.length} startups eliminadas`);
      setSelectedStartups([]);
      loadStartups();
    } catch (error) {
      console.error('Error bulk deleting:', error);
      toast.error('Error al eliminar las startups');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; className?: string }> = {
      published: { variant: "default", label: "Publicado", className: "bg-green-500/10 text-green-500 border-green-500/20" },
      approved: { variant: "default", label: "Aprobado", className: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
      draft: { variant: "secondary", label: "Borrador" },
      pending: { variant: "outline", label: "Pendiente" },
      rejected: { variant: "destructive", label: "Rechazado" },
    };

    const config = statusConfig[status] || { variant: "outline", label: status };
    
    return (
      <Badge variant={config.variant} className={config.className}>
        {config.label}
      </Badge>
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
        <Button asChild className="bg-green-600 hover:bg-green-700 text-white">
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
                <SelectItem value="approved">Aprobado</SelectItem>
                <SelectItem value="draft">Borrador</SelectItem>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="rejected">Rechazado</SelectItem>
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
                <Button 
                  variant="destructive" 
                  size="sm"
                  onClick={handleBulkDelete}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Eliminar
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Startups Table */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : filteredStartups.length > 0 ? (
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
                    <TableHead>Ciudad</TableHead>
                    <TableHead>Fundación</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="w-24">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStartups.map((startup) => {
                    const isSelected = selectedStartups.includes(startup.id);
                    
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
                              <AvatarImage src={startup.logo_url} alt={startup.name} />
                              <AvatarFallback className="bg-primary/10 text-primary">
                                {startup.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="font-medium text-foreground">{startup.name}</div>
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {startup.description || 'Sin descripción'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1 max-w-48">
                            {startup.categories?.slice(0, 2).map((cat) => (
                              <Badge key={cat} variant="secondary" className="text-xs">
                                {cat}
                              </Badge>
                            ))}
                            {startup.tags?.slice(0, startup.categories ? 1 : 2).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {((startup.categories?.length || 0) + (startup.tags?.length || 0)) > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{(startup.categories?.length || 0) + (startup.tags?.length || 0) - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {startup.city || 'N/A'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {startup.founded_date 
                            ? new Date(startup.founded_date).getFullYear()
                            : 'N/A'
                          }
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(startup.status)}
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
                              <DropdownMenuItem 
                                onClick={() => navigate(`/admin/startups/edit/${startup.id}`)}
                              >
                                <Edit3 className="w-4 h-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              {startup.status === 'draft' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(startup.id, 'published')}
                                  className="text-green-600"
                                >
                                  <Building2 className="w-4 h-4 mr-2" />
                                  Publicar
                                </DropdownMenuItem>
                              )}
                              {startup.status === 'published' && (
                                <DropdownMenuItem 
                                  onClick={() => handleStatusChange(startup.id, 'draft')}
                                  className="text-yellow-600"
                                >
                                  <Building2 className="w-4 h-4 mr-2" />
                                  Cambiar a Borrador
                                </DropdownMenuItem>
                              )}
                              <DropdownMenuItem 
                                className="text-destructive"
                                onClick={() => handleDelete(startup.id, startup.name)}
                              >
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
                  <Button variant="outline" size="sm" disabled={filteredStartups.length <= 10}>
                    Siguiente
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <Card className="p-12 text-center">
          <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No se encontraron startups</h3>
          <p className="text-muted-foreground mb-4">
            {search || selectedCategory !== 'all' || selectedStatus !== 'all' 
              ? 'Intenta ajustar los filtros'
              : 'No hay startups registradas'}
          </p>
          <Button asChild>
            <Link to="/admin/startups/new">
              <Plus className="w-4 h-4 mr-2" />
              Agregar primera startup
            </Link>
          </Button>
        </Card>
      )}
    </div>
  );
};

export default AdminStartups;