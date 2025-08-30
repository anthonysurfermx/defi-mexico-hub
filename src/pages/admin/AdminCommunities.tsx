// src/pages/admin/AdminCommunities.tsx
import { useState, useEffect } from "react";
import { 
  Search, 
  Filter, 
  Plus, 
  MoreHorizontal, 
  Edit, 
  Trash2, 
  Eye,
  Star,
  Shield,
  Loader2,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/components/ui/use-toast";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { communitiesService } from "@/services/communities.service";
import type { Community } from "@/types";

const AdminCommunities = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // Estados
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [featuredFilter, setFeaturedFilter] = useState<"all" | "featured" | "normal">("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [communityToDelete, setCommunityToDelete] = useState<Community | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    featured: 0,
    totalMembers: 0
  });

  // Cargar datos al montar
  useEffect(() => {
    loadCommunities();
    loadStats();
  }, []);

  const loadCommunities = async () => {
    try {
      setLoading(true);
      const result = await communitiesService.getAll({ 
        limit: 100,
        isActive: undefined // Mostrar todas en admin
      });
      
      if (result.data) {
        setCommunities(result.data);
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading communities:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar las comunidades",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const result = await communitiesService.getStats();
      if (result.data) {
        setStats(result.data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  // Filtrar comunidades
  const filteredCommunities = communities.filter(community => {
    const matchesSearch = searchTerm === "" || 
      community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      community.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === "all" || community.category === categoryFilter;
    
    const matchesStatus = statusFilter === "all" || 
      (statusFilter === "active" && community.is_active) ||
      (statusFilter === "inactive" && !community.is_active);
    
    const matchesFeatured = featuredFilter === "all" ||
      (featuredFilter === "featured" && community.is_featured) ||
      (featuredFilter === "normal" && !community.is_featured);
    
    return matchesSearch && matchesCategory && matchesStatus && matchesFeatured;
  });

  // Obtener categorías únicas
  const categories = [...new Set(communities.map(c => c.category).filter(Boolean))];

  // Manejar eliminación
  const handleDelete = (community: Community) => {
    setCommunityToDelete(community);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!communityToDelete) return;

    try {
      const result = await communitiesService.delete(communityToDelete.id);
      if (result.data) {
        toast({
          title: "Éxito",
          description: "Comunidad eliminada correctamente"
        });
        loadCommunities();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo eliminar la comunidad",
        variant: "destructive"
      });
    } finally {
      setDeleteDialogOpen(false);
      setCommunityToDelete(null);
    }
  };

  // Toggle featured
  const toggleFeatured = async (community: Community) => {
    try {
      const result = await communitiesService.update(community.id, {
        is_featured: !community.is_featured
      });
      
      if (result.data) {
        toast({
          title: "Éxito",
          description: community.is_featured 
            ? "Comunidad removida de destacadas" 
            : "Comunidad marcada como destacada"
        });
        loadCommunities();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la comunidad",
        variant: "destructive"
      });
    }
  };

  // Toggle active
  const toggleActive = async (community: Community) => {
    try {
      const result = await communitiesService.update(community.id, {
        is_active: !community.is_active
      });
      
      if (result.data) {
        toast({
          title: "Éxito",
          description: community.is_active 
            ? "Comunidad desactivada" 
            : "Comunidad activada"
        });
        loadCommunities();
      } else if (result.error) {
        toast({
          title: "Error",
          description: result.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo actualizar la comunidad",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Gestión de Comunidades</h1>
            <p className="text-muted-foreground">
              Administra las comunidades del ecosistema DeFi México
            </p>
          </div>
          <Button asChild className="bg-gradient-primary text-primary-foreground">
            <Link to="/admin/comunidades/new">
              <Plus className="w-4 h-4 mr-2" />
              Nueva Comunidad
            </Link>
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar comunidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <div className="flex gap-2">
                <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={featuredFilter} onValueChange={(value: any) => setFeaturedFilter(value)}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Destacadas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    <SelectItem value="featured">Destacadas</SelectItem>
                    <SelectItem value="normal">Normales</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-primary">{stats.total}</div>
              <div className="text-sm text-muted-foreground">Total Comunidades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-500">{stats.active}</div>
              <div className="text-sm text-muted-foreground">Activas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-500">{stats.featured}</div>
              <div className="text-sm text-muted-foreground">Destacadas</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-500">
                {stats.totalMembers.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Miembros Totales</div>
            </CardContent>
          </Card>
        </div>

        {/* Communities Table */}
        <Card>
          <CardHeader>
            <CardTitle>Comunidades ({filteredCommunities.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredCommunities.map((community, index) => (
                <motion.div
                  key={community.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={community.logo_url || undefined} alt={community.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {community.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {community.name}
                        </h3>
                        {community.is_featured && (
                          <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        )}
                        {community.is_active && (
                          <Shield className="w-4 h-4 text-green-500" />
                        )}
                        {community.category && (
                          <Badge variant="outline" className="text-xs">
                            {community.category}
                          </Badge>
                        )}
                        {!community.is_active && (
                          <Badge variant="destructive" className="text-xs">
                            Inactiva
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {community.description}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {community.member_count?.toLocaleString() || "0"}
                      </div>
                      <div className="text-xs text-muted-foreground">Miembros</div>
                    </div>
                    
                    {community.location && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {community.location}
                        </div>
                        <div className="text-xs text-muted-foreground">Ubicación</div>
                      </div>
                    )}

                    {community.founded_date && (
                      <div className="text-right">
                        <div className="text-sm font-medium text-foreground">
                          {new Date(community.founded_date).getFullYear()}
                        </div>
                        <div className="text-xs text-muted-foreground">Fundada</div>
                      </div>
                    )}

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/comunidades/${community.slug || community.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Pública
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link to={`/admin/comunidades/edit/${community.id}`}>
                            <Edit className="w-4 h-4 mr-2" />
                            Editar
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => toggleFeatured(community)}>
                          <Star className="w-4 h-4 mr-2" />
                          {community.is_featured ? "Quitar Destacada" : "Marcar Destacada"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => toggleActive(community)}>
                          <Shield className="w-4 h-4 mr-2" />
                          {community.is_active ? "Desactivar" : "Activar"}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(community)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </motion.div>
              ))}
            </div>

            {filteredCommunities.length === 0 && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-medium text-foreground mb-2">
                  No se encontraron comunidades
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm || categoryFilter !== "all" || statusFilter !== "all" || featuredFilter !== "all"
                    ? "Intenta ajustar los filtros"
                    : "Agrega la primera comunidad"}
                </p>
                <Button asChild>
                  <Link to="/admin/comunidades/new">
                    <Plus className="w-4 h-4 mr-2" />
                    Nueva Comunidad
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta acción eliminará permanentemente la comunidad "{communityToDelete?.name}".
                Esta acción no se puede deshacer.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
                Eliminar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    </div>
  );
};

export default AdminCommunities;