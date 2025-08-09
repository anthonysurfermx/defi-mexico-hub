import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Search, Loader2, AlertCircle, Filter, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';
import { startupsService } from '../services/startups.service';
import type { DomainStartup, Page } from '../types/database.types';
import { Link, useSearchParams, useLocation } from "react-router-dom";

// Config
const PAGE_SIZE = 12;

// Debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Visible pages helper for compact pagination (max 5)
function getVisiblePages(total: number, current: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// Skeleton loader para las cards
const StartupCardSkeleton = () => (
  <div className="bg-card border rounded-lg p-6 animate-pulse">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted"></div>
        <div>
          <div className="h-5 w-32 bg-muted rounded mb-2"></div>
          <div className="h-3 w-20 bg-muted rounded"></div>
        </div>
      </div>
    </div>
    <div className="h-4 bg-muted rounded mb-2"></div>
    <div className="h-4 bg-muted rounded w-3/4 mb-4"></div>
    <div className="flex gap-2">
      <div className="h-6 w-16 bg-muted rounded"></div>
      <div className="h-6 w-16 bg-muted rounded"></div>
    </div>
  </div>
);

// Loading Overlay Component
const LoadingOverlay = () => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-lg"
    >
      <div className="bg-card p-4 rounded-lg shadow-lg flex items-center gap-3">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="text-sm font-medium">Actualizando...</span>
      </div>
    </motion.div>
  </AnimatePresence>
);

// Simple modal without extra deps
function AdminModal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const root = dialogRef.current;
    if (!root) return;
    const focusable = root.querySelector<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    focusable?.focus();
  }, [open]);

  if (!open) return null;

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const root = dialogRef.current;
      if (!root) return;
      const nodes = Array.from(
        root.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
      ).filter(el => !el.hasAttribute('disabled'));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const currentIndex = nodes.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && (document.activeElement === first || currentIndex === -1)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (document.activeElement === last || currentIndex === -1)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={onClose}
      />
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.98 }}
        className="fixed inset-0 z-50 grid place-items-center p-4"
      >
        <div
          role="dialog"
          aria-modal="true"
          className="w-full max-w-xl bg-card border border-border rounded-xl shadow-xl p-6 relative"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
          ref={dialogRef}
        >
          <button
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded hover:bg-muted"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 className="text-xl font-semibold mb-4">{title}</h3>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
}

// Componente de Card para cada Startup
function StartupCard({
  startup,
  admin,
  onEdit,
  onDelete,
}: {
  startup: DomainStartup;
  admin?: boolean;
  onEdit?: (s: DomainStartup) => void;
  onDelete?: (s: DomainStartup) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-card border rounded-lg p-6 hover:shadow-lg transition-all hover:border-primary/30 relative group"
      aria-label={`Startup ${startup.name}`}
    >
      {admin && (
        <div className="absolute right-3 top-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => onEdit?.(startup)} aria-label={`Editar ${startup.name}`}>
            <Pencil className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="destructive" className="h-8 w-8" onClick={() => onDelete?.(startup)} aria-label={`Eliminar ${startup.name}`}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      )}
      
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          {startup.logo_url ? (
            <img
              src={startup.logo_url}
              alt={`Logo de ${startup.name}`}
              className="w-12 h-12 rounded-lg object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
              <span className="text-primary font-bold text-lg">
                {startup.name.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-semibold text-lg">{startup.name}</h3>
            {startup.founded_year && (
              <p className="text-sm text-muted-foreground">
                Desde {startup.founded_year}
              </p>
            )}
          </div>
        </div>
        {startup.is_featured && (
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
            Destacada
          </span>
        )}
      </div>

      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 min-h-[40px]">
        {startup.description || 'Innovando en el ecosistema DeFi mexicano'}
      </p>

      {/* Categorías */}
      {startup.categories && startup.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {startup.categories.slice(0, 3).map((category: string, index: number) => (
            <span 
              key={index}
              className="px-2 py-1 bg-secondary text-secondary-foreground text-xs rounded"
            >
              {category}
            </span>
          ))}
        </div>
      )}

      {/* Enlaces */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-4">
          {startup.website && (
            <a 
              href={startup.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline text-xs inline-flex items-center gap-1"
            >
              Sitio web →
            </a>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function StartupsPage() {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Check if we're in admin mode based on route
  const adminMode = location.pathname.includes('/admin');
  
  const initialPage = Number(searchParams.get('page') ?? '1') || 1;
  const initialQuery = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category');

  const [page, setPage] = useState(initialPage);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory ?? null);
  const debouncedQuery = useDebouncedValue(searchQuery, 300);

  const [startupsData, setStartupsData] = useState<Page<DomainStartup> | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);

  // Admin form state
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editing, setEditing] = useState<DomainStartup | null>(null);
  const [form, setForm] = useState({
    name: '',
    description: '',
    website: '',
    logo_url: '',
    founded_year: '' as string | number,
    category: '',
    is_featured: false,
  });

  const openNew = () => {
    setEditing(null);
    setForm({
      name: '',
      description: '',
      website: '',
      logo_url: '',
      founded_year: new Date().getFullYear(),
      category: '',
      is_featured: false,
    });
    setShowForm(true);
  };

  const openEdit = (s: DomainStartup) => {
    setEditing(s);
    setForm({
      name: s.name || '',
      description: s.description || '',
      website: s.website || '',
      logo_url: s.logo_url || '',
      founded_year: s.founded_year ?? '',
      category: s.categories?.[0] ?? '',
      is_featured: !!s.is_featured,
    });
    setShowForm(true);
  };

  const closeForm = () => setShowForm(false);

  // Utilidad para normalizar URLs
  const normalizeUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      alert('El nombre es obligatorio');
      return;
    }
    setIsSubmitting(true);
    try {
      // Basic normalization & validation
      const year = form.founded_year ? Math.max(1900, Math.min(new Date().getFullYear(), Number(form.founded_year))) : null;
      const website = form.website ? normalizeUrl(form.website) : null;
      const logo = form.logo_url ? normalizeUrl(form.logo_url) : null;
      let category = form.category || null;
      if (category === 'otra') {
        alert('Escribe una nueva categoría o selecciona una existente.');
        setIsSubmitting(false);
        return;
      }
      if (editing) {
        await startupsService.update(editing.id, {
          name: form.name.trim(),
          description: form.description || '',
          website,
          logo_url: logo,
          founded_year: year,
          category,
          is_featured: !!form.is_featured,
        });
      } else {
        await startupsService.create({
          name: form.name.trim(),
          description: form.description || '',
          website,
          logo_url: logo,
          founded_year: year,
          category,
          is_featured: !!form.is_featured,
        });
      }
      closeForm();
      await loadStartups();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar. Revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (s: DomainStartup) => {
    if (!confirm(`¿Eliminar "${s.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await startupsService.delete(s.id);
      await loadStartups();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar.');
    }
  };

  const fetchRef = useRef(0);
  const loadStartups = useCallback(async (args?: { resetPage?: boolean }) => {
    if (startupsData) {
      setIsUpdating(true);
    } else {
      setLoading(true);
    }
    
    setError(null);
    if (args?.resetPage) setPage(1);

    const token = ++fetchRef.current;
    try {
      const data = await startupsService.getFiltered({
        page,
        pageSize: PAGE_SIZE,
        search: debouncedQuery,
        category: selectedCategory || undefined,
      });
      if (token === fetchRef.current) setStartupsData(data);
    } catch (err: any) {
      if (token === fetchRef.current) {
        setError(err.message || 'Error al cargar las startups');
        console.error('Error loading startups:', err);
      }
    } finally {
      if (token === fetchRef.current) {
        setLoading(false);
        setIsUpdating(false);
      }
    }
  }, [page, debouncedQuery, selectedCategory, startupsData]);

  // Cargar categorías disponibles
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const cats = await startupsService.getCategories();
        setCategories(cats);
      } catch (err) {
        console.error('Error loading categories:', err);
      }
    };
    loadCategories();
  }, []);

  // Cargar startups con filtros
  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (debouncedQuery) params.q = debouncedQuery;
    if (selectedCategory) params.category = selectedCategory;
    setSearchParams(params, { replace: true });

    loadStartups();
  }, [page, debouncedQuery, selectedCategory, setSearchParams, loadStartups]);


  // Calcular páginas totales
  const totalPages = useMemo(() => {
    if (!startupsData) return 1;
    const size = startupsData.pageSize || PAGE_SIZE;
    return Math.ceil(startupsData.total / size);
  }, [startupsData]);

  // Scroll to top cuando cambia la página
  useEffect(() => {
    if (!adminMode) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [page, adminMode]);

  // Mostrar error si hay (solo si no hay datos previos)
  if (error && !loading && !startupsData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error al cargar startups</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => loadStartups()}>
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={adminMode ? '' : 'min-h-screen bg-background'}>
      <div className={adminMode ? '' : 'container mx-auto px-4 py-16'}>
        {/* Header - solo mostrar cuando NO es admin */}
        {!adminMode && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gradient">
              Directorio de Startups DeFi
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Descubre las empresas que están construyendo el futuro financiero de México
            </p>
          </motion.div>
        )}

        {/* Admin controls */}
        {adminMode && (
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-muted-foreground">Gestiona las startups del directorio</p>
            </div>
            <Button onClick={openNew} className="inline-flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Nueva Startup
            </Button>
          </div>
        )}

        {/* Barra de búsqueda y filtros */}
        <div className={adminMode ? 'mb-6 space-y-4' : 'max-w-4xl mx-auto mb-8 space-y-4'}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              type="text"
              placeholder="Buscar por nombre o descripción..."
              value={searchQuery}
              onChange={(e) => {
                setPage(1);
                setSearchQuery(e.target.value);
              }}
              className="pl-10"
              disabled={isUpdating || isSubmitting}
            />
          </div>

          {/* Filtros de categoría */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => {
                setPage(1);
                setSelectedCategory(null);
              }}
              disabled={isUpdating || isSubmitting}
            >
              Todas
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  setPage(1);
                  setSelectedCategory(category);
                }}
                disabled={isUpdating || isSubmitting}
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Contador de resultados */}
          {startupsData && !loading && (
            <p className="text-sm text-muted-foreground" aria-live="polite">
              {startupsData.total} startup{startupsData.total !== 1 ? 's' : ''} encontrada{startupsData.total !== 1 ? 's' : ''}
              {debouncedQuery && ` para "${debouncedQuery}"`}
              {selectedCategory && ` en ${selectedCategory}`}
            </p>
          )}

          {/* Mostrar error inline si hay datos previos */}
          {error && startupsData && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 text-sm text-destructive">
              Error al actualizar. Mostrando resultados anteriores.
            </div>
          )}
        </div>

        {/* Grid de startups con loading overlay */}
        <div className="relative" aria-busy={isUpdating}>
          {/* Loading overlay cuando se actualiza */}
          {isUpdating && startupsData && <LoadingOverlay />}
          
          {/* Initial loading state */}
          {loading && !startupsData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <StartupCardSkeleton key={i} />
              ))}
            </div>
          ) : startupsData && startupsData.items.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-lg">
                {debouncedQuery || selectedCategory
                  ? 'No se encontraron startups con los filtros seleccionados'
                  : adminMode 
                    ? 'No hay startups registradas. Haz clic en "Nueva Startup" para agregar la primera.'
                    : 'No hay startups registradas aún'}
              </p>
              {(debouncedQuery || selectedCategory) && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory(null);
                  }}
                  className="mt-4"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {startupsData?.items.map((startup, index) => (
                <motion.div
                  key={startup.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.05, 0.3) }}
                >
                  <StartupCard
                    startup={startup}
                    admin={adminMode}
                    onEdit={openEdit}
                    onDelete={handleDelete}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Paginación */}
        {startupsData && totalPages > 1 && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center gap-2 mt-12"
          >
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1 || isUpdating}
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Anterior</span>
            </Button>
            
            <div className="flex gap-1" role="navigation" aria-label="Paginación">
              {getVisiblePages(totalPages, page).map((pageNum) => (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => setPage(pageNum)}
                  className="w-10"
                  aria-current={pageNum === page ? "page" : undefined}
                  disabled={isUpdating}
                >
                  {pageNum}
                </Button>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages || isUpdating}
            >
              <span className="hidden sm:inline">Siguiente</span>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* Info footer - solo en modo público */}
        {!adminMode && (
          <div className="text-center mt-12 text-sm text-muted-foreground">
            <p title="Los listados se obtienen con filtros y paginación desde la base de datos">
              Datos en tiempo real desde Supabase 🚀
            </p>
          </div>
        )}

        {/* Admin form modal */}
        <AdminModal
          open={showForm}
          onClose={() => !isSubmitting && closeForm()}
          title={editing ? `Editar: ${editing.name}` : 'Nueva startup'}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Nombre *">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Ej. Bitso"
                required
                autoFocus
              />
            </Field>

            <Field label="Descripción">
              <textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Breve descripción de la startup"
                className="w-full rounded-md border bg-background p-2 text-sm"
                rows={4}
              />
            </Field>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Sitio web">
                <Input
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  placeholder="https://ejemplo.com"
                  type="url"
                />
              </Field>
              <Field label="Logo URL">
                <Input
                  value={form.logo_url}
                  onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
                  placeholder="https://ejemplo.com/logo.png"
                  type="url"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Field label="Año de fundación">
                <Input
                  value={form.founded_year}
                  onChange={(e) => setForm((f) => ({ ...f, founded_year: e.target.value }))}
                  placeholder="2024"
                  type="number"
                  min="1900"
                  max={new Date().getFullYear()}
                />
              </Field>
              <Field label="Categoría">
                <select
                  value={form.category}
                  onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  className="w-full rounded-md border bg-background p-2 text-sm h-10"
                >
                  <option value="">Seleccionar...</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="otra">Otra (escribir nueva)</option>
                </select>
                {form.category === 'otra' && (
                  <Input
                    className="mt-2"
                    placeholder="Nueva categoría"
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                  />
                )}
              </Field>
              <label className="flex items-center gap-2 mt-7">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((f) => ({ ...f, is_featured: e.target.checked }))}
                  className="h-4 w-4"
                />
                <span className="text-sm">Destacada</span>
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={closeForm} disabled={isSubmitting}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  editing ? 'Guardar cambios' : 'Crear startup'
                )}
              </Button>
            </div>
          </form>
        </AdminModal>
      </div>
    </div>
  );
}