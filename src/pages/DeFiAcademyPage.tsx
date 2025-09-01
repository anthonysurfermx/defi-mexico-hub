import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Star,
  Search,
  ChevronRight,
  Award,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import StatsCard from '@/components/ui/stats-card';
import { coursesService, type Course, type CourseCategory } from '@/services/courses.service';
import CourseCard from '@/components/courses/CourseCard';

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
              {featuredCourses.map((course, index) => (
                <CourseCard key={course.id} course={course} index={index} />
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
                    {filteredCourses.map((course, index) => (
                      <CourseCard key={course.id} course={course} index={index} />
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


export default DeFiAcademyPage;