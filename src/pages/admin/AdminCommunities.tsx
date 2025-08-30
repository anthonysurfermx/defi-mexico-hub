import { useState } from "react";
import { Search, Filter, Plus, MoreHorizontal, Edit, Trash2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { mockCommunities } from "@/data/communities";
import { motion } from "framer-motion";

const AdminCommunities = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  const filteredCommunities = mockCommunities.filter(community => {
    const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         community.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                         (statusFilter === "active" && community.members && parseInt(community.members.replace(/,/g, '')) > 100);
    const matchesPlatform = platformFilter === "all" || community.platform === platformFilter;
    
    return matchesSearch && matchesStatus && matchesPlatform;
  });

  const platforms = [...new Set(mockCommunities.map(c => c.platform).filter(Boolean))];

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
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Activas</SelectItem>
                    <SelectItem value="inactive">Inactivas</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={platformFilter} onValueChange={setPlatformFilter}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas</SelectItem>
                    {platforms.map(platform => (
                      <SelectItem key={platform} value={platform}>
                        {platform}
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
              <div className="text-2xl font-bold text-primary">{mockCommunities.length}</div>
              <div className="text-sm text-muted-foreground">Total Comunidades</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-secondary">
                {mockCommunities.filter(c => c.platform === "Discord").length}
              </div>
              <div className="text-sm text-muted-foreground">Discord</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-accent">
                {mockCommunities.filter(c => c.platform === "Telegram").length}
              </div>
              <div className="text-sm text-muted-foreground">Telegram</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-orange-500">
                {mockCommunities.reduce((sum, c) => sum + (c.members ? parseInt(c.members.replace(/,/g, '')) : 0), 0).toLocaleString()}
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
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center space-x-4 flex-1">
                    <Avatar className="w-12 h-12">
                      <AvatarImage src={community.logo} alt={community.name} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {community.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {community.name}
                        </h3>
                        {community.platform && (
                          <Badge variant="outline" className="text-xs">
                            {community.platform}
                          </Badge>
                        )}
                        {community.region && (
                          <Badge variant="secondary" className="text-xs">
                            {community.region}
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
                        {community.members || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">Miembros</div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {community.monthlyMessages || "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">Mensajes/mes</div>
                    </div>

                    <div className="text-right">
                      <div className="text-sm font-medium text-foreground">
                        {community.foundedYear}
                      </div>
                      <div className="text-xs text-muted-foreground">Fundada</div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link to={`/comunidades/${community.id}`}>
                            <Eye className="w-4 h-4 mr-2" />
                            Ver Detalles
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive">
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
                  Intenta ajustar los filtros o agregar nuevas comunidades.
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
      </motion.div>
    </div>
  );
};

export default AdminCommunities;