// src/pages/ReferentesPage.tsx
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Users, Sparkles, Filter } from 'lucide-react';
import { advocatesService, type DeFiAdvocate } from '@/services/advocates.service';
import AdvocateCard from '@/components/advocates/AdvocateCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

const trackFilters = [
  { value: 'all', label: 'Todos' },
  { value: 'developer', label: 'Programadores' },
  { value: 'lawyer', label: 'Abogados' },
  { value: 'financial', label: 'Financieros' },
  { value: 'designer', label: 'Diseñadores' },
  { value: 'marketer', label: 'Marketers' },
  { value: 'other', label: 'Otros' },
];

export default function ReferentesPage() {
  const [advocates, setAdvocates] = useState<DeFiAdvocate[]>([]);
  const [filteredAdvocates, setFilteredAdvocates] = useState<DeFiAdvocate[]>([]);
  const [selectedTrack, setSelectedTrack] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAdvocates();
  }, []);

  useEffect(() => {
    if (selectedTrack === 'all') {
      setFilteredAdvocates(advocates);
    } else {
      setFilteredAdvocates(advocates.filter((adv) => adv.track === selectedTrack));
    }
  }, [selectedTrack, advocates]);

  const loadAdvocates = async () => {
    try {
      setLoading(true);
      const data = await advocatesService.getActiveAdvocates();
      setAdvocates(data || []);
      setFilteredAdvocates(data || []);
    } catch (err) {
      console.error('Error loading advocates:', err);
      setError('Error al cargar los referentes');
    } finally {
      setLoading(false);
    }
  };

  const featuredAdvocates = advocates.filter((adv) => adv.is_featured);

  return (
    <>
      <Helmet>
        <title>Referentes DeFi México | DeFi Hub México</title>
        <meta
          name="description"
          content="Conoce a los referentes y líderes del ecosistema DeFi en México. Desarrolladores, educadores, investigadores y advocates que están construyendo el futuro de las finanzas descentralizadas."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-4">
            <Users className="w-5 h-5 text-primary" />
            <span className="text-sm font-medium text-primary">Referentes del Ecosistema</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
            Referentes DeFi México
          </h1>

          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Cuando piensas en DeFi en México, estos son los expertos, educadores y líderes que
            están impulsando la innovación y el crecimiento del ecosistema de finanzas
            descentralizadas en el país.
          </p>
        </div>

        {/* Featured Advocates */}
        {featuredAdvocates.length > 0 && (
          <div className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-6 h-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Destacados</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {featuredAdvocates.map((advocate) => (
                <AdvocateCard key={advocate.id} advocate={advocate} />
              ))}
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <h3 className="text-lg font-semibold">Filtrar por categoría</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            {trackFilters.map((filter) => (
              <Button
                key={filter.value}
                variant={selectedTrack === filter.value ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTrack(filter.value)}
              >
                {filter.label}
                {filter.value !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    {advocates.filter((adv) => adv.track === filter.value).length}
                  </Badge>
                )}
              </Button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner size="lg" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">{error}</p>
            <Button onClick={loadAdvocates} className="mt-4">
              Reintentar
            </Button>
          </div>
        )}

        {/* Advocates Grid */}
        {!loading && !error && (
          <>
            {filteredAdvocates.length === 0 ? (
              <div className="text-center py-12">
                <Users className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-xl font-semibold mb-2">No hay referentes en esta categoría</h3>
                <p className="text-muted-foreground">
                  Intenta seleccionar otra categoría o revisa más tarde.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredAdvocates
                  .filter((adv) => !adv.is_featured) // Excluir los destacados ya mostrados
                  .map((advocate) => (
                    <AdvocateCard key={advocate.id} advocate={advocate} />
                  ))}
              </div>
            )}
          </>
        )}

        {/* CTA Section */}
        <div className="mt-16 text-center bg-gradient-to-r from-primary/10 via-purple-500/10 to-pink-500/10 rounded-2xl p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold mb-4">
            ¿Quieres ser parte de los referentes?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Si eres un experto en DeFi, educador, desarrollador o líder comunitario en México,
            nos encantaría conocerte y destacar tu contribución al ecosistema.
          </p>
          <Button size="lg" asChild>
            <a href="mailto:contacto@defimexico.com">Postúlate Ahora</a>
          </Button>
        </div>
      </div>
    </>
  );
}
