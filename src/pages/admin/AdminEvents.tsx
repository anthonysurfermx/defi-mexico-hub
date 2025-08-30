// src/components/admin/AdminEvents.tsx
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { eventsService } from '@/services/events.service';
import type { Event, EventStatus } from '@/services/events.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Loader2, Plus, Pencil, Trash2, Search, X,
  Calendar, Clock, MapPin, Users, CheckCircle, XCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────
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

// Pagination helper
function visiblePages(total: number, current: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// Modal con focus‑trap
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
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLElement>(
      'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
    );
    first?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      onClose();
      return;
    }
    if (e.key === 'Tab') {
      const nodes = Array.from(
        ref.current?.querySelectorAll<HTMLElement>(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        ) || []
      ).filter(n => !n.hasAttribute('disabled'));
      if (nodes.length === 0) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && (active === first || !active)) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && (active === last || !active)) {
        e.preventDefault();
        first.focus();
      }
    }
  };

  if (!open) return null;

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
          aria-labelledby="admin-events-title"
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-6 relative"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={onKeyDown}
          ref={ref}
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3 top-3 p-1 rounded hover:bg-muted transition-colors"
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 id="admin-events-title" className="text-xl font-semibold mb-4">
            {title}
          </h3>
          {children}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function StatusBadge({ status }: { status: Event['status'] }) {
  const variants = {
    published: { icon: CheckCircle, cls: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' },
    draft: { icon: Clock, cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' },
    cancelled: { icon: XCircle, cls: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' },
    completed: { icon: CheckCircle, cls: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400' },
  };
  const v = variants[status] ?? variants.published;
  const Icon = v.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${v.cls}`}>
      <Icon className="w-3 h-3" />
      {status === 'published' ? 'Publicado' : 
       status === 'draft' ? 'Borrador' : 
       status === 'cancelled' ? 'Cancelado' :
       status === 'completed' ? 'Completado' : 'Desconocido'}
    </span>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main Component
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminEvents() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get('page') ?? '1') || 1;
  const initialQ = searchParams.get('q') ?? '';
  const initialStatus = (searchParams.get('status') ?? 'all') as 'all' | EventStatus;

  const [page, setPage] = useState(initialPage);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<'all' | EventStatus>(initialStatus);

  const debouncedQ = useDebouncedValue(q, 300);

  const [data, setData] = useState<{ items: Event[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Event | null>(null);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    start_time: '',
    venue_name: '',
    venue_address: '',
    image_url: '',
    registration_url: '',
    capacity: '',
    current_attendees: '0',
    tags: '',
    status: 'published' as EventStatus,
    is_featured: false,
  });

  const fetchToken = useRef(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const token = ++fetchToken.current;
    try {
      const filters = {
        search: debouncedQ || undefined,
        status: status === 'all' ? undefined : status,
        limit: PAGE_SIZE,
        offset: (page - 1) * PAGE_SIZE,
      };
      const result = await eventsService.getAll(filters);
      if (result.error) throw new Error(result.error);
      const res = {
        items: result.data || [],
        total: result.data?.length || 0
      };
      if (token === fetchToken.current) setData(res);
    } catch (e) {
      if (token === fetchToken.current) setError(e instanceof Error ? e.message : 'Error al cargar eventos');
    } finally {
      if (token === fetchToken.current) setLoading(false);
    }
  }, [page, debouncedQ, status]);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (page > 1) params.page = String(page);
    if (debouncedQ) params.q = debouncedQ;
    if (status !== 'all') params.status = status;
    setSearchParams(params, { replace: true });
    load();
  }, [page, debouncedQ, status, setSearchParams, load]);

  const totalPages = useMemo(() => {
    if (!data) return 1;
    return Math.max(1, Math.ceil(data.total / PAGE_SIZE));
  }, [data]);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: data?.total ?? 0,
      upcoming: items.filter(e => e.status === 'published').length,
      past: items.filter(e => e.status === 'completed').length,
      attendees: items.reduce((acc, e) => acc + (e.current_attendees ?? 0), 0),
    };
  }, [data]);

  // CRUD Handlers
  const openNew = () => {
    setEditing(null);
    setForm({
      title: '',
      description: '',
      start_date: '',
      start_time: '',
      venue_name: '',
      venue_address: '',
      image_url: '',
      registration_url: '',
      capacity: '',
      current_attendees: '0',
      tags: '',
      status: 'published',
      is_featured: false,
    });
    setOpen(true);
  };

  const openEdit = (event: Event) => {
    setEditing(event);
    setForm({
      title: event.title || '',
      description: event.description || '',
      start_date: event.start_date || '',
      start_time: event.start_time || '',
      venue_name: event.venue_name || '',
      venue_address: event.venue_address || '',
      image_url: event.image_url || '',
      registration_url: event.registration_url || '',
      capacity: String(event.capacity ?? ''),
      current_attendees: String(event.current_attendees ?? 0),
      tags: (event.tags ?? []).join(', '),
      status: event.status,
      is_featured: event.is_featured || false,
    });
    setOpen(true);
  };

  const normalizeUrl = (url: string) => {
    if (!url) return '';
    const trimmed = url.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('El título es obligatorio');
      return;
    }

    const payload = {
      title: form.title.trim(),
      slug: editing ? editing.slug : generateSlug(form.title.trim()),
      description: form.description.trim(),
      start_date: form.start_date || null,
      start_time: form.start_time || null,
      venue_name: form.venue_name.trim() || null,
      venue_address: form.venue_address.trim() || null,
      image_url: form.image_url ? normalizeUrl(form.image_url) : null,
      registration_url: form.registration_url ? normalizeUrl(form.registration_url) : null,
      capacity: form.capacity ? Math.max(0, parseInt(form.capacity, 10)) : null,
      current_attendees: Math.max(0, parseInt(form.current_attendees || '0', 10)),
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : null,
      status: form.status,
      event_type: 'presencial' as const,
      timezone: 'America/Mexico_City',
      is_free: true,
      price: 0,
      currency: 'MXN',
      registration_required: !!form.registration_url,
      is_featured: form.is_featured,
    };

    setIsSubmitting(true);
    try {
      if (editing) {
        const result = await eventsService.update(editing.id, payload);
        if (result.error) throw new Error(result.error);
      } else {
        const result = await eventsService.create(payload);
        if (result.error) throw new Error(result.error);
      }
      setOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar el evento');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (event: Event) => {
    if (!confirm(`¿Eliminar "${event.title}"?`)) return;
    try {
      const result = await eventsService.delete(event.id);
      if (result.error) throw new Error(result.error);
      await load();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el evento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col lg:flex-row lg:items-center gap-4 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Eventos</h2>
          <p className="text-sm text-muted-foreground">
            Administra eventos, talleres y meetups del ecosistema
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => {
                setPage(1);
                setQ(e.target.value);
              }}
              placeholder="Buscar eventos..."
              className="pl-8 w-64"
            />
          </div>

          <select
            value={status}
            onChange={(e) => {
              setPage(1);
              setStatus(e.target.value as 'all' | EventStatus);
            }}
            className="h-9 rounded-md border bg-background px-3 text-sm"
            aria-label="Filtro de estado"
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
            <option value="cancelled">Cancelados</option>
            <option value="completed">Completados</option>
          </select>

          <Button type="button" onClick={openNew} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo evento
          </Button>
        </div>
      </header>

      {/* Stats */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold">{stats.total}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Próximos</span>
            </div>
            <p className="text-2xl font-bold">{stats.upcoming}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Pasados</span>
            </div>
            <p className="text-2xl font-bold">{stats.past}</p>
          </div>

          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-blue-500" />
              <span className="text-sm font-medium">Asistentes</span>
            </div>
            <p className="text-2xl font-bold">{stats.attendees}</p>
          </div>
        </div>
      )}

      {/* Events Grid */}
      <div className="relative" aria-busy={loading}>
        {loading && (
          <div className="absolute inset-0 grid place-items-center bg-background/50 z-10">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        )}

        {error && (
          <div className="border border-destructive/30 bg-destructive/5 text-destructive p-4 rounded-lg">
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {!error && !loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(data?.items || []).map((event) => (
              <motion.div
                key={`event-${event.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-lg border hover:shadow-lg transition-shadow"
              >
                {event.image_url && (
                  <img
                    src={event.image_url}
                    alt={event.title}
                    className="w-full h-48 object-cover rounded-t-lg"
                    loading="lazy"
                    decoding="async"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-lg line-clamp-1">{event.title}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {event.start_date ? new Date(event.start_date).toLocaleDateString() : 'Sin fecha'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start_time || 'Sin hora'}
                        </span>
                      </div>
                    </div>
                    <StatusBadge status={event.status} />
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {event.description || 'Sin descripción'}
                  </p>

                  <div className="flex items-center gap-1 text-sm mb-3">
                    <MapPin className="w-3 h-3" />
                    <span className="line-clamp-1">{event.venue_name || 'Ubicación por confirmar'}</span>
                  </div>

                  {typeof event.capacity === 'number' && (
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">Asistentes</span>
                      <span className="text-sm font-medium">
                        {event.current_attendees || 0} / {event.capacity}
                      </span>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="flex-1"
                      onClick={() => openEdit(event)}
                      disabled={isSubmitting}
                    >
                      <Pencil className="w-3 h-3 mr-1" />
                      Editar
                    </Button>

                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(event)}
                      className="px-3"
                      disabled={isSubmitting}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}

            {data && data.items.length === 0 && (
              <div className="col-span-full py-12 text-center text-muted-foreground">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No hay eventos que coincidan con los filtros</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {data.total} evento{data.total !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-1" role="navigation" aria-label="Paginación">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              Anterior
            </Button>

            {visiblePages(totalPages, page).map((n) => (
              <Button
                key={n}
                type="button"
                variant={n === page ? 'default' : 'outline'}
                size="sm"
                onClick={() => setPage(n)}
                className="w-10"
                aria-current={n === page ? 'page' : undefined}
              >
                {n}
              </Button>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page === totalPages}
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminModal
        open={open}
        title={editing ? `Editar: ${editing.title}` : 'Nuevo evento'}
        onClose={() => !isSubmitting && setOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Título *">
            <Input
              value={form.title}
              onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))}
              required
            />
          </Field>

          <Field label="Descripción">
            <textarea
              value={form.description}
              onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              className="w-full rounded-md border bg-background p-2 text-sm resize-y"
              rows={3}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha">
              <Input
                type="date"
                value={form.start_date}
                onChange={(e) => setForm(f => ({ ...f, start_date: e.target.value }))}
              />
            </Field>

            <Field label="Hora">
              <Input
                type="time"
                value={form.start_time}
                onChange={(e) => setForm(f => ({ ...f, start_time: e.target.value }))}
              />
            </Field>
          </div>

          <Field label="Lugar del evento">
            <Input
              value={form.venue_name}
              onChange={(e) => setForm(f => ({ ...f, venue_name: e.target.value }))}
              placeholder="Centro de Convenciones CDMX"
            />
          </Field>

          <Field label="Dirección">
            <Input
              value={form.venue_address}
              onChange={(e) => setForm(f => ({ ...f, venue_address: e.target.value }))}
              placeholder="Av. Revolución 1234, Col. Centro"
            />
          </Field>

          <Field label="URL de registro">
            <Input
              value={form.registration_url}
              onChange={(e) => setForm(f => ({ ...f, registration_url: e.target.value }))}
              placeholder="https://eventbrite.com/..."
              inputMode="url"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Capacidad máxima">
              <Input
                type="number"
                value={form.capacity}
                onChange={(e) => setForm(f => ({ ...f, capacity: e.target.value }))}
                min="0"
              />
            </Field>

            <Field label="Asistentes actuales">
              <Input
                type="number"
                value={form.current_attendees}
                onChange={(e) => setForm(f => ({ ...f, current_attendees: e.target.value }))}
                min="0"
              />
            </Field>
          </div>

          <Field label="Estado">
            <select
              value={form.status}
              onChange={(e) => setForm(f => ({ ...f, status: e.target.value as EventStatus }))}
              className="w-full rounded-md border bg-background p-2 text-sm"
            >
              <option value="published">Publicado</option>
              <option value="draft">Borrador</option>
              <option value="cancelled">Cancelado</option>
              <option value="completed">Completado</option>
            </select>
          </Field>

          <div className="flex items-center space-x-2">
            <input
              id="is_featured"
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              className="w-4 h-4 text-primary bg-background border-gray-300 rounded focus:ring-primary focus:ring-2"
            />
            <label htmlFor="is_featured" className="text-sm font-medium">
              Marcar como evento destacado (aparece en HomePage)
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editing ? 'Guardar cambios' : 'Crear evento'
              )}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}

// Field Component
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block mb-4">
      <span className="block text-sm font-medium mb-1">{label}</span>
      {children}
    </label>
  );
} 