import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Rocket, FileText, Calendar, Users, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    title: "Nueva Startup",
    description: "Agregar una nueva startup al catálogo",
    icon: Rocket,
    href: "/admin/startups/new",
    color: "from-primary to-primary/80"
  },
  {
    title: "Nuevo Artículo",
    description: "Escribir un nuevo post para el blog",
    icon: FileText,
    href: "/admin/blog/new",
    color: "from-secondary to-secondary/80"
  },
  {
    title: "Nuevo Evento",
    description: "Crear un evento o meetup",
    icon: Calendar,
    href: "/admin/eventos/new",
    color: "from-accent to-accent/80"
  },
  {
    title: "Gestionar Usuarios",
    description: "Administrar permisos y roles",
    icon: Users,
    href: "/admin/users",
    color: "from-purple-500 to-purple-400"
  },
  {
    title: "Ver Analytics",
    description: "Revisar métricas y estadísticas",
    icon: BarChart3,
    href: "/admin/analytics",
    color: "from-orange-500 to-orange-400"
  },
];

export function QuickActionsGrid() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <Plus className="w-5 h-5 text-primary" />
        Acciones Rápidas
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Card className="bg-gradient-dark border-border hover:border-primary/30 transition-all duration-300 overflow-hidden cursor-pointer"
                    onClick={() => navigate(action.href)}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${action.color}`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h4 className="font-medium text-foreground mb-1">
                        {action.title}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {action.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}