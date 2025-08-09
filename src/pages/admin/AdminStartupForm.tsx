import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Save, Eye, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

interface StartupFormData {
  name: string;
  description: string;
  website: string;
  logo: string;
  foundedYear: number;
  founders: string[];
  tags: string[];
  tvl: string;
  users: string;
  transactions: string;
  twitter: string;
  linkedin: string;
  github: string;
}

const AdminStartupForm = () => {
  const { toast } = useToast();
  const [isPreview, setIsPreview] = useState(false);
  const [newFounder, setNewFounder] = useState("");
  const [newTag, setNewTag] = useState("");
  
  const [formData, setFormData] = useState<StartupFormData>({
    name: "",
    description: "",
    website: "",
    logo: "",
    foundedYear: new Date().getFullYear(),
    founders: [],
    tags: [],
    tvl: "",
    users: "",
    transactions: "",
    twitter: "",
    linkedin: "",
    github: ""
  });

  const availableTags = ["DeFi", "NFT", "DAO", "DEX", "Lending", "Staking", "Gaming", "Infrastructure"];
  const yearOptions = Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i);

  const handleInputChange = (field: keyof StartupFormData, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addFounder = () => {
    if (newFounder.trim() && !formData.founders.includes(newFounder.trim())) {
      setFormData(prev => ({
        ...prev,
        founders: [...prev.founders, newFounder.trim()]
      }));
      setNewFounder("");
    }
  };

  const removeFounder = (founder: string) => {
    setFormData(prev => ({
      ...prev,
      founders: prev.founders.filter(f => f !== founder)
    }));
  };

  const addTag = (tag: string) => {
    if (!formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSaveDraft = () => {
    toast({
      title: "Borrador guardado",
      description: "Los cambios se han guardado como borrador.",
    });
  };

  const handlePublish = () => {
    toast({
      title: "Startup publicada",
      description: "La startup ha sido publicada exitosamente.",
    });
  };

  // Preview Card Component
  const PreviewCard = () => (
    <Card className="bg-gradient-dark border-border hover:border-primary/30 transition-all duration-300 max-w-sm">
      <CardContent className="p-6">
        <div className="flex items-center space-x-4 mb-4">
          <Avatar className="w-16 h-16">
            <AvatarImage src={formData.logo} alt={formData.name} />
            <AvatarFallback className="bg-primary/10 text-primary text-lg">
              {formData.name.slice(0, 2).toUpperCase() || "ST"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground truncate">
              {formData.name || "Nombre de Startup"}
            </h3>
            <p className="text-sm text-muted-foreground">
              Fundada en {formData.foundedYear}
            </p>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
          {formData.description || "Descripción de la startup..."}
        </p>

        {formData.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {formData.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <div className="flex justify-between items-center">
          <Button size="sm" variant="outline">
            Ver más
          </Button>
          {formData.website && (
            <Button size="sm" variant="ghost">
              🔗
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/startups">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Nueva Startup</h1>
            <p className="text-muted-foreground">
              Agrega una nueva startup al directorio
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={() => setIsPreview(!isPreview)}
            className="flex items-center"
          >
            <Eye className="w-4 h-4 mr-2" />
            {isPreview ? "Editar" : "Preview"}
          </Button>
          <Button variant="outline" onClick={handleSaveDraft}>
            <Save className="w-4 h-4 mr-2" />
            Guardar Borrador
          </Button>
          <Button onClick={handlePublish} className="bg-gradient-primary text-primary-foreground">
            Publicar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form */}
        <div className="lg:col-span-2">
          {isPreview ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex justify-center"
            >
              <PreviewCard />
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Tabs defaultValue="basic" className="space-y-6">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Básico</TabsTrigger>
                  <TabsTrigger value="founders">Founders</TabsTrigger>
                  <TabsTrigger value="metrics">Métricas</TabsTrigger>
                  <TabsTrigger value="social">Enlaces</TabsTrigger>
                </TabsList>

                <TabsContent value="basic">
                  <Card>
                    <CardHeader>
                      <CardTitle>Información Básica</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nombre *</Label>
                          <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => handleInputChange("name", e.target.value)}
                            placeholder="Nombre de la startup"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="foundedYear">Año de Fundación</Label>
                          <Select 
                            value={formData.foundedYear.toString()} 
                            onValueChange={(value) => handleInputChange("foundedYear", parseInt(value))}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {yearOptions.map(year => (
                                <SelectItem key={year} value={year.toString()}>
                                  {year}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="description">Descripción *</Label>
                        <Textarea
                          id="description"
                          value={formData.description}
                          onChange={(e) => handleInputChange("description", e.target.value)}
                          placeholder="Describe qué hace la startup..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="website">Sitio Web</Label>
                        <Input
                          id="website"
                          type="url"
                          value={formData.website}
                          onChange={(e) => handleInputChange("website", e.target.value)}
                          placeholder="https://startup.com"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="logo">URL del Logo</Label>
                        <Input
                          id="logo"
                          type="url"
                          value={formData.logo}
                          onChange={(e) => handleInputChange("logo", e.target.value)}
                          placeholder="https://ejemplo.com/logo.png"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Categorías</Label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {formData.tags.map((tag) => (
                            <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                              {tag}
                              <button onClick={() => removeTag(tag)}>
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <Select onValueChange={addTag}>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTags
                              .filter(tag => !formData.tags.includes(tag))
                              .map(tag => (
                                <SelectItem key={tag} value={tag}>
                                  {tag}
                                </SelectItem>
                              ))
                            }
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="founders">
                  <Card>
                    <CardHeader>
                      <CardTitle>Founders</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-2">
                        <Input
                          value={newFounder}
                          onChange={(e) => setNewFounder(e.target.value)}
                          placeholder="Nombre del founder"
                          onKeyPress={(e) => e.key === "Enter" && addFounder()}
                        />
                        <Button onClick={addFounder} type="button">
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {formData.founders.map((founder) => (
                          <div key={founder} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <span>{founder}</span>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => removeFounder(founder)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="metrics">
                  <Card>
                    <CardHeader>
                      <CardTitle>Métricas DeFi</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="tvl">TVL (Total Value Locked)</Label>
                          <Input
                            id="tvl"
                            value={formData.tvl}
                            onChange={(e) => handleInputChange("tvl", e.target.value)}
                            placeholder="$1.2M"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="users">Usuarios Activos</Label>
                          <Input
                            id="users"
                            value={formData.users}
                            onChange={(e) => handleInputChange("users", e.target.value)}
                            placeholder="5,000"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="transactions">Transacciones Totales</Label>
                          <Input
                            id="transactions"
                            value={formData.transactions}
                            onChange={(e) => handleInputChange("transactions", e.target.value)}
                            placeholder="50,000"
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="social">
                  <Card>
                    <CardHeader>
                      <CardTitle>Enlaces y Redes Sociales</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="twitter">Twitter/X</Label>
                        <Input
                          id="twitter"
                          value={formData.twitter}
                          onChange={(e) => handleInputChange("twitter", e.target.value)}
                          placeholder="https://twitter.com/startup"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="linkedin">LinkedIn</Label>
                        <Input
                          id="linkedin"
                          value={formData.linkedin}
                          onChange={(e) => handleInputChange("linkedin", e.target.value)}
                          placeholder="https://linkedin.com/company/startup"
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="github">GitHub</Label>
                        <Input
                          id="github"
                          value={formData.github}
                          onChange={(e) => handleInputChange("github", e.target.value)}
                          placeholder="https://github.com/startup"
                        />
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </motion.div>
          )}
        </div>

        {/* Live Preview */}
        {!isPreview && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-1"
          >
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-sm">Preview en Vivo</CardTitle>
              </CardHeader>
              <CardContent>
                <PreviewCard />
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminStartupForm;