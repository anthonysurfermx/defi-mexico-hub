import { useState, useMemo, useEffect } from 'react';
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
  Globe,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/ui/stats-card';
import { coursesService, type Course, type CourseCategory } from '@/services/courses.service';

// Mapeo de categorías para las tabs
const categoryTabs: { label: string; value: CourseCategory | 'all' }[] = [
  { label: 'Todos', value: 'all' },
  { label: 'DeFi', value: 'defi' },
  { label: 'DeFAI', value: 'defai' },
  { label: 'Fintech', value: 'fintech' },
  { label: 'Trading', value: 'trading' },
];

const DeFiAcademyPage = () => {
  const [activeTab, setActiveTab] = useState<CourseCategory | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('all');
  
  // Estados para los datos reales
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [featuredCourses, setFeaturedCourses] = useState<Course[]>([]);
  const [courseStats, setCourseStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingStats, setLoadingStats] = useState(true);
  
  // Cargar cursos al montar el componente
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);
        console.log('🔄 Cargando cursos desde Supabase...');
        
        // Cargar todos los cursos publicados
        const { data: coursesData, error: coursesError } = await coursesService.getPublishedCourses({ 
          page: 1, 
          pageSize: 100 
        });
        
        if (coursesError) {
          console.error('❌ Error cargando cursos:', coursesError);
          return;
        }
        
        if (coursesData) {
          setAllCourses(coursesData);
          console.log(`✅ ${coursesData.length} cursos cargados`);
        }
        
        // Cargar cursos destacados
        const { data: featuredData, error: featuredError } = await coursesService.getFeaturedCourses(6);
        
        if (!featuredError && featuredData) {
          setFeaturedCourses(featuredData);
          console.log(`✅ ${featuredData.length} cursos destacados cargados`);
        }
        
      } catch (error) {
        console.error('❌ Error en loadCourses:', error);
      } finally {
        setLoading(false);
      }
    };
    
    const loadStats = async () => {
      try {
        setLoadingStats(true);
        const { data: statsData, error: statsError } = await coursesService.getCourseStats();
        
        if (!statsError && statsData) {
          setCourseStats(statsData);
          console.log('✅ Estadísticas de cursos cargadas');
        }
      } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
      } finally {
        setLoadingStats(false);
      }
    };
    
    loadCourses();
    loadStats();
  }, []);

  // Filtrar cursos por categoría activa, búsqueda y nivel
  const filteredCourses = useMemo(() => {
    let courses = allCourses;
    
    // Filtrar por categoría (tab activa)
    if (activeTab !== 'all') {
      courses = courses.filter(course => course.category === activeTab);
    }
    
    // Filtrar por búsqueda
    if (searchQuery) {
      courses = courses.filter(course => 
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.instructor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.topics.some(topic => topic.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    // Filtrar por nivel
    if (selectedLevel !== 'all') {
      courses = courses.filter(course => course.level === selectedLevel);
    }
    
    // Ordenar por destacados primero, luego por rating y estudiantes
    return courses.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (b.rating !== a.rating) return b.rating - a.rating;
      return b.students - a.students;
    });
  }, [allCourses, activeTab, searchQuery, selectedLevel]);
  
  // Obtener cursos por categoría para las tabs
  const getCoursesByCategory = (category: CourseCategory) => {
    return allCourses.filter(course => course.category === category);
  };

  // Estadísticas calculadas
  const totalCourses = courseStats?.totalCourses || allCourses.length;
  const totalStudents = courseStats?.totalStudents || allCourses.reduce((acc, course) => acc + course.students, 0);
  const avgRating = courseStats?.averageRating?.toFixed(1) || 
    (allCourses.length > 0 ? 
      (allCourses.reduce((acc, course) => acc + course.rating, 0) / allCourses.length).toFixed(1) : 
      '0.0');
  const uniqueInstructors = new Set(allCourses.map(c => c.instructor)).size;

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 bg-gradient-to-br from-primary/5 via-background to-muted/20">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <h1 className="text-4xl md:text-6xl font-bold">
                DeFi Academy
              </h1>
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Aprende DeFi, DeFAI y Fintech con expertos de la industria. 
                Cursos prácticos que te llevarán de principiante a experto.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <a href="#cursos">
                    Explorar Cursos
                    <BookOpen className="ml-2 w-5 h-5" />
                  </a>
                </Button>
                <Button variant="outline" size="lg">
                  Certificaciones
                  <Award className="ml-2 w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {loadingStats ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="bg-card p-6 rounded-lg border animate-pulse">
                  <div className="w-12 h-12 bg-muted rounded mb-4"></div>
                  <div className="h-8 bg-muted rounded mb-2"></div>
                  <div className="h-4 bg-muted rounded w-2/3"></div>
                </div>
              ))
            ) : (
              <>
                <StatsCard
                  title="Cursos Disponibles"
                  value={totalCourses.toString()}
                  description="Contenido actualizado"
                  icon={BookOpen}
                />
                <StatsCard
                  title="Estudiantes Activos"
                  value={totalStudents.toLocaleString()}
                  description="Aprendiendo juntos"
                  icon={Users}
                />
                <StatsCard
                  title="Rating Promedio"
                  value={`${avgRating}★`}
                  description="Satisfacción estudiantil"
                  icon={Star}
                />
                <StatsCard
                  title="Instructores Expertos"
                  value={uniqueInstructors.toString()}
                  description="Profesionales de la industria"
                  icon={Award}
                />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Featured Courses */}
      {featuredCourses.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl font-bold mb-4">Cursos Destacados</h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Los cursos más populares y mejor valorados por nuestra comunidad
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredCourses.map((course) => (
                <CourseCard key={course.id} course={course} featured={true} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Courses Section */}
      <section id="cursos" className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl font-bold mb-4">Todos los Cursos</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Encuentra el curso perfecto para tu nivel y área de interés
            </p>
          </motion.div>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto mb-8 space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar cursos, instructores, temas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select 
                value={selectedLevel} 
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-background min-w-[150px]"
              >
                <option value="all">Todos los niveles</option>
                <option value="Principiante">Principiante</option>
                <option value="Intermedio">Intermedio</option>
                <option value="Avanzado">Avanzado</option>
              </select>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as CourseCategory | 'all')} className="w-full">
            <TabsList className="grid w-full grid-cols-5 max-w-2xl mx-auto">
              {categoryTabs.map(tab => (
                <TabsTrigger key={tab.value} value={tab.value} className="text-sm">
                  {tab.label}
                  {tab.value !== 'all' && (
                    <span className="ml-1 text-xs opacity-70">
                      ({getCoursesByCategory(tab.value as CourseCategory).length})
                    </span>
                  )}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Contenido dinámico basado en datos reales */}
            {categoryTabs.map(tab => (
              <TabsContent key={tab.value} value={tab.value} className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">
                    {tab.label === 'Todos' ? 'Todos los Cursos' : `Cursos ${tab.label}`}
                  </h3>
                  <div className="text-sm text-muted-foreground">
                    {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} encontrado{filteredCourses.length !== 1 ? 's' : ''}
                  </div>
                </div>
                
                {loading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <div key={i} className="bg-card p-6 rounded-lg border animate-pulse">
                        <div className="w-full h-40 bg-muted rounded mb-4"></div>
                        <div className="h-4 bg-muted rounded mb-2"></div>
                        <div className="h-3 bg-muted rounded w-2/3 mb-4"></div>
                        <div className="flex items-center gap-2 mb-4">
                          <div className="h-3 bg-muted rounded w-16"></div>
                          <div className="h-3 bg-muted rounded w-20"></div>
                        </div>
                        <div className="h-10 bg-muted rounded"></div>
                      </div>
                    ))}
                  </div>
                ) : filteredCourses.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCourses.map((course) => (
                      <CourseCard key={course.id} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                    <h4 className="text-lg font-semibold mb-2">No se encontraron cursos</h4>
                    <p className="text-muted-foreground">
                      {searchQuery 
                        ? `No hay cursos que coincidan con "${searchQuery}"` 
                        : 'No hay cursos disponibles en esta categoría'}
                    </p>
                    {searchQuery && (
                      <Button 
                        variant="outline" 
                        onClick={() => setSearchQuery('')}
                        className="mt-4"
                      >
                        Limpiar búsqueda
                      </Button>
                    )}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary/5">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h2 className="text-3xl font-bold">
              ¿Listo para comenzar tu viaje DeFi?
            </h2>
            <p className="text-xl text-muted-foreground">
              Únete a miles de estudiantes que ya están construyendo el futuro de las finanzas
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg">
                Comenzar Ahora
                <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <Button variant="outline" size="lg">
                Hablar con un Experto
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

// Componente para cada curso (actualizado para usar Course type)
const CourseCard = ({ course, featured = false }: { course: Course; featured?: boolean }) => {
  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Principiante': 
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'Intermedio': 
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'Avanzado': 
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: 
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-card p-6 rounded-xl border transition-all hover:shadow-lg hover:border-primary/50 relative ${
        featured ? 'border-primary/20' : ''
      }`}
    >
      {course.thumbnail_url && (
        <div className="w-full h-40 bg-muted rounded-lg mb-4 overflow-hidden">
          <img
            src={course.thumbnail_url}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="flex items-center justify-between mb-3">
        <Badge className={getLevelColor(course.level)}>
          {course.level}
        </Badge>
        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
          <Star className="w-4 h-4 fill-current text-yellow-500" />
          <span>{course.rating}</span>
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2 line-clamp-2">
        {course.title}
      </h3>
      
      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
        {course.description}
      </p>

      <div className="flex items-center justify-between mb-4 text-sm text-muted-foreground">
        <div className="flex items-center space-x-2">
          <Clock className="w-4 h-4" />
          <span>{course.duration}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4" />
          <span>{course.students.toLocaleString()}</span>
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-4">
        Por <span className="font-medium">{course.instructor}</span>
      </p>

      {course.topics && course.topics.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-4">
          {course.topics.slice(0, 3).map((topic: string) => (
            <Badge key={topic} variant="outline" className="text-xs">
              {topic}
            </Badge>
          ))}
          {course.topics.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{course.topics.length - 3} más
            </Badge>
          )}
        </div>
      )}

      {course.featured && (
        <div className="absolute top-3 right-3">
          <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400 border-yellow-200">
            <Star className="w-3 h-3 mr-1 fill-current" />
            Destacado
          </Badge>
        </div>
      )}
      
      <Button className="w-full group" asChild>
        <a
          href={course.circle_url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full"
        >
          <Play className="w-4 h-4 mr-2" />
          Comenzar curso
          <ExternalLink className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
        </a>
      </Button>
    </motion.div>
  );
};

export default DeFiAcademyPage;