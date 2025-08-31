import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Play, 
  Clock, 
  Users, 
  BookOpen, 
  Star,
  TrendingUp,
  Shield,
  Coins,
  ExternalLink,
  Search,
  Filter,
  ChevronRight,
  Award,
  Target,
  Zap,
  Globe
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/ui/stats-card';

// Datos de cursos por sección
const courseData = {
  defi: [
    {
      id: 'defi-101',
      title: 'DeFi Fundamentals',
      description: 'Aprende los conceptos básicos de las finanzas descentralizadas',
      duration: '2h 30m',
      level: 'Principiante',
      students: 1240,
      rating: 4.8,
      topics: ['Lending', 'DEX', 'Yield Farming', 'Liquidity Pools'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Carlos Mendez',
      circleUrl: 'https://circle.so/defi-fundamentals'
    },
    {
      id: 'defi-advanced',
      title: 'Advanced DeFi Strategies',
      description: 'Estrategias avanzadas para maximizar rendimientos en DeFi',
      duration: '4h 15m',
      level: 'Avanzado',
      students: 856,
      rating: 4.9,
      topics: ['Flash Loans', 'Arbitrage', 'MEV', 'Protocol Governance'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Ana Rodriguez',
      circleUrl: 'https://circle.so/advanced-defi'
    },
    {
      id: 'defi-security',
      title: 'DeFi Security Best Practices',
      description: 'Protege tus activos en el ecosistema DeFi',
      duration: '3h 45m',
      level: 'Intermedio',
      students: 2100,
      rating: 4.7,
      topics: ['Smart Contract Audits', 'Wallet Security', 'Rug Pull Prevention'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Miguel Santos',
      circleUrl: 'https://circle.so/defi-security'
    }
  ],
  defai: [
    {
      id: 'defai-intro',
      title: 'Introduction to DeFai',
      description: 'Inteligencia artificial aplicada a finanzas descentralizadas',
      duration: '3h 20m',
      level: 'Intermedio',
      students: 920,
      rating: 4.6,
      topics: ['AI Trading Bots', 'Predictive Analytics', 'Automated Strategies'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Laura Garcia',
      circleUrl: 'https://circle.so/defai-intro'
    },
    {
      id: 'defai-ml',
      title: 'Machine Learning for DeFi',
      description: 'Aplica machine learning a trading y análisis DeFi',
      duration: '5h 10m',
      level: 'Avanzado',
      students: 645,
      rating: 4.8,
      topics: ['Neural Networks', 'Risk Management', 'Portfolio Optimization'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Roberto Kim',
      circleUrl: 'https://circle.so/defai-ml'
    }
  ],
  fintech: [
    {
      id: 'fintech-blockchain',
      title: 'Fintech on Blockchain',
      description: 'Servicios financieros tradicionales en blockchain',
      duration: '2h 50m',
      level: 'Principiante',
      students: 1560,
      rating: 4.5,
      topics: ['Digital Banking', 'Payment Systems', 'Regulatory Compliance'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'Sofia Martinez',
      circleUrl: 'https://circle.so/fintech-blockchain'
    },
    {
      id: 'fintech-cbdc',
      title: 'Central Bank Digital Currencies',
      description: 'El futuro de las monedas digitales de bancos centrales',
      duration: '4h 00m',
      level: 'Intermedio',
      students: 1180,
      rating: 4.7,
      topics: ['CBDC Design', 'Monetary Policy', 'Cross-Border Payments'],
      thumbnail: '/api/placeholder/300/200',
      instructor: 'David Chen',
      circleUrl: 'https://circle.so/fintech-cbdc'
    }
  ]
};

const DeFiAcademyPage = () => {
  const [activeTab, setActiveTab] = useState('defi');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');

  // Combinar todos los cursos para búsqueda
  const allCourses = [
    ...courseData.defi.map(c => ({ ...c, category: 'DeFi' })),
    ...courseData.defai.map(c => ({ ...c, category: 'DeFai' })),
    ...courseData.fintech.map(c => ({ ...c, category: 'Fintech' }))
  ];

  // Filtrar cursos
  const filteredCourses = useMemo(() => {
    let courses = allCourses;
    
    if (searchQuery) {
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    if (selectedLevel !== 'all') {
      courses = courses.filter(course => course.level === selectedLevel);
    }
    
    return courses;
  }, [searchQuery, selectedLevel, allCourses]);

  // Estadísticas generales
  const stats = useMemo(() => {
    const totalCourses = allCourses.length;
    const totalStudents = allCourses.reduce((acc, course) => acc + course.students, 0);
    const avgRating = allCourses.reduce((acc, course) => acc + course.rating, 0) / totalCourses;
    const totalHours = allCourses.reduce((acc, course) => {
      const [hours, minutes] = course.duration.split('h ');
      return acc + parseInt(hours) + (minutes ? parseInt(minutes) / 60 : 0);
    }, 0);
    
    return {
      totalCourses,
      totalStudents,
      avgRating,
      totalHours: Math.round(totalHours)
    };
  }, [allCourses]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Principiante': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/20 dark:text-emerald-400';
      case 'Intermedio': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Avanzado': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'DeFi': return TrendingUp;
      case 'DeFai': return Zap;
      case 'Fintech': return Shield;
      default: return BookOpen;
    }
  };

  const CourseCard = ({ course, category }: { course: any, category: string }) => {
    const CategoryIcon = getCategoryIcon(category);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="group"
      >
        <Card className="h-full hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
          <div className="relative">
            <div className="h-48 bg-gradient-to-br from-primary/20 to-primary/40 rounded-t-lg flex items-center justify-center">
              <CategoryIcon className="w-16 h-16 text-primary/70" />
            </div>
            <div className="absolute top-3 left-3">
              <Badge className={getLevelColor(course.level)}>
                {course.level}
              </Badge>
            </div>
            <div className="absolute top-3 right-3">
              <Badge variant="secondary" className="bg-background/80 backdrop-blur">
                {category}
              </Badge>
            </div>
          </div>
          
          <CardContent className="p-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-lg mb-2 group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {course.description}
                </p>
              </div>
              
              <div className="flex flex-wrap gap-1">
                {course.topics.slice(0, 3).map((topic: string) => (
                  <Badge key={topic} variant="outline" className="text-xs">
                    {topic}
                  </Badge>
                ))}
                {course.topics.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{course.topics.length - 3}
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.duration}
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.students.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  {course.rating}
                </div>
              </div>
              
              <div className="pt-2 border-t">
                <p className="text-xs text-muted-foreground mb-3">
                  Instructor: {course.instructor}
                </p>
                <Button 
                  className="w-full group"
                  onClick={() => window.open(course.circleUrl, '_blank')}
                >
                  <Play className="w-4 h-4 mr-2" />
                  Comenzar Curso
                  <ExternalLink className="w-4 h-4 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Principal */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-dark opacity-50" />
        <div className="relative container mx-auto px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 rounded-full bg-primary/20">
                <Award className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-6xl font-bold text-foreground">
                DeFi Academy
              </h1>
            </div>
            <p className="text-xl text-muted-foreground mb-8">
              Domina el futuro de las finanzas con cursos especializados en DeFi, DeFai y Fintech on-chain
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <div className="relative w-full max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar cursos, temas o instructores..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="lg">
                <Globe className="w-4 h-4 mr-2" />
                Ver en Circle.so
              </Button>
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Estadísticas */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="Cursos Disponibles"
            value={stats.totalCourses.toString()}
            description="Especialización completa"
            icon={BookOpen}
            trend={{ value: "5 nuevos", isPositive: true }}
          />
          <StatsCard
            title="Estudiantes Activos"
            value={stats.totalStudents.toLocaleString()}
            description="Comunidad en crecimiento"
            icon={Users}
            trend={{ value: "+12%", isPositive: true }}
          />
          <StatsCard
            title="Rating Promedio"
            value={stats.avgRating.toFixed(1)}
            description="Calidad certificada"
            icon={Star}
            trend={{ value: "4.7/5.0", isPositive: true }}
          />
          <StatsCard
            title="Horas de Contenido"
            value={`${stats.totalHours}h`}
            description="Aprendizaje profundo"
            icon={Clock}
          />
        </div>

        {/* Filtros y Navegación */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          <div className="flex-1">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="defi" className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  DeFi
                </TabsTrigger>
                <TabsTrigger value="defai" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  DeFai
                </TabsTrigger>
                <TabsTrigger value="fintech" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Fintech
                </TabsTrigger>
              </TabsList>
              
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center gap-2">
                  <Filter className="w-4 h-4 text-muted-foreground" />
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(e.target.value)}
                    className="px-3 py-1 border rounded-md bg-background text-foreground text-sm"
                  >
                    <option value="all">Todos los niveles</option>
                    <option value="Principiante">Principiante</option>
                    <option value="Intermedio">Intermedio</option>
                    <option value="Avanzado">Avanzado</option>
                  </select>
                </div>
              </div>

              {/* Contenido de las pestañas */}
              <TabsContent value="defi" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">Finanzas Descentralizadas (DeFi)</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Domina los protocolos DeFi, desde conceptos básicos hasta estrategias avanzadas de yield farming y gestión de riesgos.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseData.defi.map(course => (
                      <CourseCard key={course.id} course={course} category="DeFi" />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="defai" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Zap className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">DeFi + AI (DeFai)</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Combina inteligencia artificial con finanzas descentralizadas para crear estrategias de trading e inversión automatizadas.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseData.defai.map(course => (
                      <CourseCard key={course.id} course={course} category="DeFai" />
                    ))}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="fintech" className="space-y-6">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Shield className="w-5 h-5 text-primary" />
                    <h2 className="text-2xl font-bold">Fintech On-Chain</h2>
                  </div>
                  <p className="text-muted-foreground mb-6">
                    Aprende cómo los servicios financieros tradicionales se están transformando con tecnología blockchain.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {courseData.fintech.map(course => (
                      <CourseCard key={course.id} course={course} category="Fintech" />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Resultados de búsqueda */}
        {searchQuery && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Search className="w-5 h-5" />
                  Resultados de búsqueda ({filteredCourses.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredCourses.map(course => (
                    <CourseCard key={course.id} course={course} category={course.category} />
                  ))}
                </div>
                {filteredCourses.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No se encontraron cursos que coincidan con tu búsqueda
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardContent className="p-8 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Target className="w-8 h-8 text-primary" />
              <h3 className="text-2xl font-bold">¿Listo para comenzar tu carrera en DeFi?</h3>
            </div>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Únete a nuestra comunidad de aprendizaje en Circle.so y accede a contenido exclusivo, 
              mentorías personalizadas y networking con expertos de la industria.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" onClick={() => window.open('https://circle.so/', '_blank')}>
                <ExternalLink className="w-4 h-4 mr-2" />
                Únete a la Comunidad
              </Button>
              <Button variant="outline" size="lg">
                <BookOpen className="w-4 h-4 mr-2" />
                Ver Plan de Estudios
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DeFiAcademyPage;