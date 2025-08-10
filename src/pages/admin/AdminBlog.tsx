
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { blogService } from '@/services/blog.service';
import type { BlogPost } from '@/services/blog.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, Pencil, Trash2, Search, X, FileText, Calendar, User, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ──────────────────────────────────────────────────────────────────────────────
// Config
// ──────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

// Debounce hook
function useDebouncedValue<T>(value: T, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// Compact pagination range (max 5)
function visiblePages(total: number, current: number): number[] {
  if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
  if (current <= 3) return [1, 2, 3, 4, 5];
  if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
  return [current - 2, current - 1, current, current + 1, current + 2];
}

// Modal ligero (sin deps nuevas)
function AdminModal({ 
  open, 
  title, 
  onClose, 
  children 
}: { 
  open: boolean; 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode 
}) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const first = ref.current?.querySelector<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])');
    first?.focus();
  }, [open]);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') { 
      e.stopPropagation(); 
      onClose(); 
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
      const idx = nodes.indexOf(document.activeElement as HTMLElement);
      
      if (e.shiftKey && (document.activeElement === first || idx === -1)) { 
        e.preventDefault(); 
        last.focus(); 
      } else if (!e.shiftKey && (document.activeElement === last || idx === -1)) { 
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
          aria-labelledby="admin-blog-title" 
          className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-card border border-border rounded-xl shadow-xl p-6 relative" 
          onClick={(e) => e.stopPropagation()} 
          onKeyDown={onKeyDown} 
          ref={ref}
        >
          <button 
            onClick={onClose} 
            className="absolute right-3 top-3 p-1 rounded hover:bg-muted transition-colors" 
            aria-label="Cerrar"
          >
            <X className="w-4 h-4" />
          </button>
          <h3 id="admin-blog-title" className="text-xl font-semibold mb-4">
            {title}
          </h3>
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

// ──────────────────────────────────────────────────────────────────────────────
// AdminBlog Component
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminBlog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialPage = Number(searchParams.get('page') ?? '1') || 1;
  const initialQ = searchParams.get('q') ?? '';
  const initialStatus = searchParams.get('status') ?? 'all';

  const [page, setPage] = useState(initialPage);
  const [q, setQ] = useState(initialQ);
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>(initialStatus as any);

  const debouncedQ = useDebouncedValue(q, 300);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    author: '',
    category: '',
    tags: '' as string,
    image_url: '',
    published: false,
  });

  const fetchToken = useRef(0);
  
  const load = useCallback(async () => {
    setLoading(true); 
    setError(null);
    const token = ++fetchToken.current;
    
    try {
      const res = await blogService.getPosts(
        page,
        PAGE_SIZE,
        {
          search: debouncedQ || undefined,
          published: status === 'all' ? undefined : status === 'published'
        }
      );
      
      if (token === fetchToken.current) {
        setData(res);
      }
    } catch (e: any) {
      if (token === fetchToken.current) {
        setError(e.message || 'Error al cargar posts');
      }
    } finally {
      if (token === fetchToken.current) {
        setLoading(false);
      }
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
    return data?.totalPages || 1;
  }, [data]);

  // Handlers CRUD
  const openNew = () => {
    setEditing(null);
    setForm({ 
      title: '', 
      slug: '', 
      excerpt: '', 
      content: '', 
      author: '', 
      category: '', 
      tags: '', 
      image_url: '', 
      published: false 
    });
    setOpen(true);
  };

  const openEdit = (post: BlogPost) => {
    setEditing(post);
    setForm({
      title: post.title || '',
      slug: post.slug || '',
      excerpt: post.excerpt || '',
      content: post.content || '',
      author: post.author || '',
      category: post.category || '',
      tags: (post.tags ?? []).join(', '),
      image_url: post.image_url || '',
      published: post.published || false,
    });
    setOpen(true);
  };

  const closeModal = () => setOpen(false);

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
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.title.trim()) { 
      alert('El título es obligatorio'); 
      return; 
    }
    
    // Auto-generar slug si está vacío
    const finalSlug = form.slug.trim() || generateSlug(form.title);
    
    const payload: any = {
      title: form.title.trim(),
      slug: finalSlug,
      excerpt: form.excerpt.trim(),
      content: form.content,
      author: form.author.trim() || 'Equipo DeFi México',
      category: form.category.trim() || 'General',
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      image_url: form.image_url ? normalizeUrl(form.image_url) : null,
      published: !!form.published,
    };

    setIsSubmitting(true);
    
    try {
      if (editing) {
        await blogService.updatePost(editing.id, payload);
      } else {
        await blogService.createPost(payload);
      }
      setOpen(false);
      await load();
    } catch (err) {
      console.error(err);
      alert('No se pudo guardar. Revisa la consola.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (post: BlogPost) => {
    if (!confirm(`¿Eliminar "${post.title}"?`)) return;
    
    try {
      await blogService.deletePost(post.id);
      await load();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar');
    }
  };

  const togglePublished = async (post: BlogPost) => {
    try {
      await blogService.updatePost(post.id, { 
        published: !post.published 
      });
      await load();
    } catch (err) {
      console.error(err);
      alert('No se pudo actualizar el estado');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
        <div>
          <h2 className="text-2xl font-bold">Posts del Blog</h2>
          <p className="text-sm text-muted-foreground">
            Gestiona el contenido, estado y metadatos de los artículos
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => { 
                setPage(1); 
                setQ(e.target.value); 
              }}
              placeholder="Buscar por título..."
              className="pl-8 w-64"
            />
          </div>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => { 
              setPage(1); 
              setStatus(e.target.value as any); 
            }}
            className="h-9 rounded-md border bg-background px-2 text-sm"
            aria-label="Filtro de estado"
          >
            <option value="all">Todos</option>
            <option value="published">Publicados</option>
            <option value="draft">Borradores</option>
          </select>

          {/* New Post Button */}
          <Button onClick={openNew} className="inline-flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nuevo post
          </Button>
        </div>
      </header>

      {/* Stats Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium">Total Posts</span>
            </div>
            <p className="text-2xl font-bold">{data.total}</p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-green-500" />
              <span className="text-sm font-medium">Publicados</span>
            </div>
            <p className="text-2xl font-bold">
              {data.data?.filter((p: BlogPost) => p.published).length || 0}
            </p>
          </div>
          
          <div className="bg-card p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <EyeOff className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium">Borradores</span>
            </div>
            <p className="text-2xl font-bold">
              {data.data?.filter((p: BlogPost) => !p.published).length || 0}
            </p>
          </div>
        </div>
      )}

      {/* Table */}
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

        {!error && (
          <div className="overflow-x-auto border rounded-lg">
            <table className="min-w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="text-left px-4 py-2 font-medium">Título</th>
                  <th className="text-left px-4 py-2 font-medium">Estado</th>
                  <th className="text-left px-4 py-2 font-medium">Categoría</th>
                  <th className="text-left px-4 py-2 font-medium">Autor</th>
                  <th className="text-left px-4 py-2 font-medium">Tags</th>
                  <th className="text-left px-4 py-2 font-medium">Publicado</th>
                  <th className="text-right px-4 py-2 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {(data?.data ?? []).map((post: BlogPost) => (
                  <tr key={post.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <Link 
                          to={`/blog/${post.slug}`} 
                          className="font-medium hover:underline hover:text-primary transition-colors"
                        >
                          {post.title}
                        </Link>
                        {post.excerpt && (
                          <p className="text-muted-foreground text-xs mt-1 line-clamp-1">
                            {post.excerpt}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => togglePublished(post)}
                        className="cursor-pointer"
                      >
                        {post.published ? (
                          <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
                            <Eye className="w-3 h-3 mr-1" />
                            Publicado
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="hover:bg-muted">
                            <EyeOff className="w-3 h-3 mr-1" />
                            Borrador
                          </Badge>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline">{post.category || 'General'}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <User className="w-3 h-3 text-muted-foreground" />
                        <span className="text-sm">{post.author || 'Anónimo'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {(post.tags ?? []).slice(0, 3).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                        {(post.tags?.length ?? 0) > 3 && (
                          <span className="text-xs text-muted-foreground">
                            +{post.tags!.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        {post.published_at 
                          ? new Date(post.published_at).toLocaleDateString() 
                          : '—'
                        }
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-primary/10 hover:text-primary" 
                          onClick={() => openEdit(post)} 
                          aria-label={`Editar ${post.title}`}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button 
                          size="icon" 
                          variant="ghost" 
                          className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive" 
                          onClick={() => handleDelete(post)} 
                          aria-label={`Eliminar ${post.title}`}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}

                {data && data.data?.length === 0 && !loading && (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No hay posts que coincidan con los filtros</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data && totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground" aria-live="polite">
            {data.total} post{data.total !== 1 ? 's' : ''}
          </p>
          
          <div className="flex items-center gap-1" role="navigation" aria-label="Paginación">
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === 1} 
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Anterior
            </Button>
            
            {visiblePages(totalPages, page).map((n) => (
              <Button 
                key={n} 
                variant={n === page ? 'default' : 'outline'} 
                size="sm" 
                onClick={() => setPage(n)} 
                aria-current={n === page ? 'page' : undefined} 
                className="w-10"
              >
                {n}
              </Button>
            ))}
            
            <Button 
              variant="outline" 
              size="sm" 
              disabled={page === totalPages} 
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}

      {/* Create/Edit Modal */}
      <AdminModal 
        open={open} 
        title={editing ? `Editar: ${editing.title}` : 'Nuevo post'} 
        onClose={() => !isSubmitting && closeModal()}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Field label="Título *">
              <Input 
                value={form.title} 
                onChange={(e) => setForm(f => ({ ...f, title: e.target.value }))} 
                required 
                autoFocus
              />
            </Field>
            
            <Field label="Slug (URL)">
              <Input 
                value={form.slug} 
                onChange={(e) => setForm(f => ({ ...f, slug: e.target.value }))} 
                placeholder="se-genera-automaticamente"
              />
            </Field>
          </div>

          <Field label="Extracto (máx 200 caracteres)">
            <Input 
              value={form.excerpt} 
              onChange={(e) => setForm(f => ({ ...f, excerpt: e.target.value.slice(0, 200) }))}
              placeholder="Resumen breve del artículo..."
            />
            <span className="text-xs text-muted-foreground">
              {form.excerpt.length}/200
            </span>
          </Field>

          <Field label="Contenido (Markdown)">
            <textarea
              value={form.content}
              onChange={(e) => setForm(f => ({ ...f, content: e.target.value }))}
              className="w-full rounded-md border bg-background p-3 text-sm font-mono resize-y"
              rows={10}
              placeholder="# Título&#10;&#10;Contenido del artículo...&#10;&#10;## Subtítulo&#10;&#10;- Lista 1&#10;- Lista 2"
            />
          </Field>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Field label="Autor">
              <Input 
                value={form.author} 
                onChange={(e) => setForm(f => ({ ...f, author: e.target.value }))} 
                placeholder="Equipo DeFi México"
              />
            </Field>
            
            <Field label="Categoría">
              <select
                value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                className="w-full rounded-md border bg-background p-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                <option value="Noticias">Noticias</option>
                <option value="Educación">Educación</option>
                <option value="Tutoriales">Tutoriales</option>
                <option value="Análisis">Análisis</option>
                <option value="Eventos">Eventos</option>
                <option value="General">General</option>
              </select>
            </Field>
            
            <Field label="Tags (separados por coma)">
              <Input 
                value={form.tags} 
                onChange={(e) => setForm(f => ({ ...f, tags: e.target.value }))} 
                placeholder="defi, blockchain, ethereum"
              />
            </Field>
          </div>

          <Field label="Imagen destacada (URL)">
            <Input 
              value={form.image_url} 
              onChange={(e) => setForm(f => ({ ...f, image_url: e.target.value }))} 
              placeholder="https://example.com/imagen.jpg" 
              inputMode="url"
            />
            {form.image_url && (
              <img 
                src={normalizeUrl(form.image_url)} 
                alt="Preview" 
                className="mt-2 w-full h-32 object-cover rounded-md"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
          </Field>

          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={form.published} 
              onChange={(e) => setForm(f => ({ ...f, published: e.target.checked }))}
              className="rounded"
            />
            <span className="text-sm font-medium">
              Publicar inmediatamente
            </span>
          </label>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={closeModal} 
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : (
                editing ? 'Guardar cambios' : 'Crear post'
              )}
            </Button>
          </div>
        </form>
      </AdminModal>
    </div>
  );
}