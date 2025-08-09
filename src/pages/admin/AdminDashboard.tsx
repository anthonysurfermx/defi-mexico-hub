import { motion } from "framer-motion";
import { 
  Rocket, 
  FileText, 
  Calendar, 
  TrendingUp,
  Plus,
  Eye,
  Edit3,
  Trash2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Link } from "react-router-dom";
// Chart functionality temporarily disabled for demo
import { mockStartups, mockBlogPosts, mockEvents } from "@/data/mockData";

// Mock analytics data
const analyticsData = [
  { month: 'Ago', startups: 2 },
  { month: 'Sep', startups: 4 },
  { month: 'Oct', startups: 6 },
  { month: 'Nov', startups: 8 },
  { month: 'Dic', startups: 12 },
  { month: 'Ene', startups: 15 },
];

const recentActivity = [
  { action: "Startup agregada", item: "Kubo Finance", time: "hace 2 horas" },
  { action: "Artículo publicado", item: "El futuro de DeFi en LATAM", time: "hace 5 horas" },
  { action: "Evento creado", item: "Meetup DeFi CDMX", time: "hace 1 día" },
  { action: "Startup editada", item: "Solarity", time: "hace 2 días" },
  { action: "Artículo borrador", item: "Análisis de TVL", time: "hace 3 días" },
];

const AdminDashboard = () => {
  const latestStartups = mockStartups.slice(0, 5);
  const statsCards = [
    {
      title: "Total Startups",
      value: mockStartups.length.toString(),
      description: "Startups registradas",
      icon: Rocket,
      trend: "+12% vs mes anterior",
      isPositive: true
    },
    {
      title: "Total Artículos",
      value: mockBlogPosts.length.toString(),
      description: "Artículos publicados",
      icon: FileText,
      trend: "+8% vs mes anterior",
      isPositive: true
    },
    {
      title: "Eventos Activos",
      value: mockEvents.filter(e => e.isUpcoming).length.toString(),
      description: "Próximos eventos",
      icon: Calendar,
      trend: "2 este mes",
      isPositive: true
    },
    {
      title: "Visitantes del Mes",
      value: "24.5K",
      description: "Usuarios únicos",
      icon: TrendingUp,
      trend: "+15% vs mes anterior",
      isPositive: true
    }
  ];

  const quickActionCards = [
    {
      title: "Nueva Startup",
      description: "Agregar startup al directorio",
      link: "/admin/startups/new",
      icon: Rocket,
      color: "bg-primary/10 text-primary"
    },
    {
      title: "Nuevo Artículo",
      description: "Crear nuevo post para el blog",
      link: "/admin/blog/new",
      icon: FileText,
      color: "bg-neon-green/10 text-neon-green"
    },
    {
      title: "Nuevo Evento",
      description: "Programar un nuevo evento",
      link: "/admin/eventos/new",
      icon: Calendar,
      color: "bg-neon-blue/10 text-neon-blue"
    }
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
          >
            <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-primary/10 rounded-xl">
                    <stat.icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className={`text-sm font-medium ${
                    stat.isPositive ? 'text-neon-green' : 'text-destructive'
                  }`}>
                    {stat.trend}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold text-foreground">{stat.value}</h3>
                  <p className="text-sm font-medium text-foreground">{stat.title}</p>
                  <p className="text-xs text-muted-foreground">{stat.description}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="lg:col-span-2"
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Startups Agregadas por Mes</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="flex items-center justify-center h-64 bg-muted/20 rounded-lg">
                  <p className="text-muted-foreground">Gráfica de actividad (Demo)</p>
                </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Actividad Reciente</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="space-y-1">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="p-4 hover:bg-muted/50 transition-colors">
                    <div className="text-sm text-foreground">
                      <span className="font-medium">{activity.action}</span>
                      <span className="text-muted-foreground"> - {activity.item}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      {activity.time}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.7 }}
      >
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {quickActionCards.map((action, index) => (
                <Link key={action.title} to={action.link}>
                  <Card className="cursor-pointer hover:scale-105 transition-all duration-300 hover:border-primary/30 bg-gradient-subtle">
                    <CardContent className="p-6 text-center">
                      <div className={`inline-flex p-4 rounded-full ${action.color} mb-4`}>
                        <action.icon className="w-8 h-8" />
                      </div>
                      <h3 className="font-semibold text-foreground mb-2">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Startups Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.8 }}
      >
        <Card className="bg-card border-border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-foreground">Últimas Startups</CardTitle>
            <Button variant="outline" asChild>
              <Link to="/admin/startups">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Startup</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fundación</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestStartups.map((startup) => (
                  <TableRow key={startup.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={startup.logo} alt={startup.name} />
                          <AvatarFallback>{startup.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-foreground">{startup.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {startup.description.slice(0, 50)}...
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {startup.tags?.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{startup.foundedYear}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Button size="sm" variant="ghost" asChild>
                          <Link to={`/startups/${startup.id}`}>
                            <Eye className="w-4 h-4" />
                          </Link>
                        </Button>
                        <Button size="sm" variant="ghost">
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminDashboard;