// src/services/blog.service.ts
import { supabase } from '../lib/supabase';

// Types simplificados (ajusta según tu database.types.ts)
export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  category: string | null;
  tags: string[];
  image_url: string | null;
  published: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DomainPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  author: string;
  categories: string[];
  tags: string[];
  image_url: string | null;
  status: 'published' | 'draft';
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Campos a seleccionar de la BD
 */
const SELECT_FIELDS = 
  'id,title,slug,excerpt,content,author,category,tags,image_url,published,published_at,created_at,updated_at';

const DEFAULT_PAGE_SIZE = 12;

/**
 * Helpers
 */
const sanitize = (s: unknown): string =>
  (typeof s === 'string' ? s : '')
    .replace(/,/g, ' ')
    .replace(/%/g, '')
    .trim()
    .slice(0, 200);

const toDomain = (row: BlogPost): DomainPost => ({
  id: row.id,
  title: row.title,
  slug: row.slug,
  excerpt: row.excerpt || '',
  content: row.content || '',
  author: row.author || 'Equipo DeFi México',
  categories: row.category ? [row.category] : [],
  tags: row.tags || [],
  image_url: row.image_url,
  status: row.published ? 'published' : 'draft',
  published_at: row.published_at,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

/**
 * Servicio de Blog con métodos completos y alias de compatibilidad
 */
class BlogService {
  /**
   * Obtener página de posts con filtros
   */
  async getPage(params: {
    page?: number;
    pageSize?: number;
    q?: string;
    status?: 'published' | 'draft' | 'all';
    category?: string;
    tag?: string;
  } = {}): Promise<Page<DomainPost>> {
    const page = Math.max(1, params.page || 1);
    const pageSize = Math.min(50, Math.max(1, params.pageSize || DEFAULT_PAGE_SIZE));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('blog_posts')
      .select(SELECT_FIELDS, { count: 'exact' })
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    // Aplicar filtros
    if (params.status === 'published') {
      query = query.eq('published', true);
    } else if (params.status === 'draft') {
      query = query.eq('published', false);
    }

    if (params.category) {
      query = query.eq('category', params.category);
    }

    if (params.tag) {
      query = query.contains('tags', [params.tag]);
    }

    if (params.q) {
      const q = sanitize(params.q);
      if (q) {
        query = query.or(
          `title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`
        );
      }
    }

    const { data, error, count } = await query.range(from, to);
    
    if (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }

    return {
      items: (data || []).map(toDomain),
      total: count || 0,
      page,
      pageSize,
    };
  }

  /**
   * ALIAS para AdminBlog.tsx - Método getPosts con formato esperado
   */
  async getPosts(
    page = 1,
    limit = DEFAULT_PAGE_SIZE,
    filters?: {
      search?: string;
      published?: boolean;
      status?: 'published' | 'draft' | 'all';
      category?: string;
      tag?: string;
    }
  ) {
    // Convertir el filtro 'published' booleano a 'status' string
    let status: 'published' | 'draft' | 'all' = 'all';
    if (filters?.status) {
      status = filters.status;
    } else if (filters?.published !== undefined) {
      status = filters.published ? 'published' : 'draft';
    }

    const res = await this.getPage({
      page,
      pageSize: limit,
      q: filters?.search,
      status,
      category: filters?.category,
      tag: filters?.tag,
    });

    // Retornar en el formato que espera AdminBlog.tsx
    return {
      data: res.items,
      total: res.total,
      totalPages: Math.ceil(res.total / res.pageSize),
      currentPage: res.page,
    };
  }

  /**
   * Obtener posts recientes publicados
   */
  async getRecent(limit = 3): Promise<DomainPost[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent posts:', error);
      throw error;
    }

    return (data || []).map(toDomain);
  }

  /**
   * Obtener post por slug
   */
  async getBySlug(slug: string): Promise<DomainPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = No rows found
      console.error('Error fetching post by slug:', error);
      throw error;
    }

    return data ? toDomain(data) : null;
  }

  /**
   * Obtener post por ID
   */
  async getById(id: string): Promise<DomainPost | null> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching post by id:', error);
      throw error;
    }

    return data ? toDomain(data) : null;
  }

  /**
   * Buscar posts
   */
  async search(query: string): Promise<DomainPost[]> {
    const q = sanitize(query);
    if (!q) return [];

    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .or(`title.ilike.%${q}%,excerpt.ilike.%${q}%,content.ilike.%${q}%`)
      .order('published_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error searching posts:', error);
      throw error;
    }

    return (data || []).map(toDomain);
  }

  /**
   * Obtener posts relacionados por tags
   */
  async getRelated(slug: string, tags: string[], limit = 3): Promise<DomainPost[]> {
    if (!tags?.length) return [];

    const { data, error } = await supabase
      .from('blog_posts')
      .select(SELECT_FIELDS)
      .neq('slug', slug)
      .overlaps('tags', tags)
      .eq('published', true)
      .order('published_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching related posts:', error);
      throw error;
    }

    return (data || []).map(toDomain);
  }

  /**
   * Crear un nuevo post
   */
  async create(post: Partial<BlogPost>): Promise<DomainPost> {
    // Preparar el payload
    const payload: any = {
      title: post.title,
      slug: post.slug || this.generateSlug(post.title || ''),
      excerpt: post.excerpt || '',
      content: post.content || '',
      author: post.author || 'Equipo DeFi México',
      category: post.category || null,
      tags: post.tags || [],
      image_url: post.image_url || null,
      published: post.published || false,
      published_at: post.published ? (post.published_at || new Date().toISOString()) : null,
    };

    const { data, error } = await supabase
      .from('blog_posts')
      .insert(payload)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      console.error('Error creating post:', error);
      throw error;
    }

    return toDomain(data);
  }

  /**
   * Actualizar un post existente
   */
  async update(id: string, updates: Partial<BlogPost>): Promise<DomainPost> {
    const payload: any = { ...updates };
    
    // Si se está publicando y no tiene fecha de publicación, asignarla
    if (updates.published === true && !updates.published_at) {
      payload.published_at = new Date().toISOString();
    }
    
    // Si se está despublicando, quitar la fecha
    if (updates.published === false) {
      payload.published_at = null;
    }

    const { data, error } = await supabase
      .from('blog_posts')
      .update(payload)
      .eq('id', id)
      .select(SELECT_FIELDS)
      .single();

    if (error) {
      console.error('Error updating post:', error);
      throw error;
    }

    return toDomain(data);
  }

  /**
   * Eliminar un post
   */
  async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('blog_posts')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting post:', error);
      throw error;
    }

    return true;
  }

  /**
   * ====================================
   * ALIAS DE COMPATIBILIDAD para AdminBlog.tsx
   * ====================================
   */

  /**
   * Alias de create() para compatibilidad
   */
  async createPost(post: Partial<BlogPost>): Promise<DomainPost> {
    return this.create(post);
  }

  /**
   * Alias de update() para compatibilidad
   */
  async updatePost(id: string, updates: Partial<BlogPost>): Promise<DomainPost> {
    return this.update(id, updates);
  }

  /**
   * Alias de delete() para compatibilidad
   */
  async deletePost(id: string): Promise<boolean> {
    return this.delete(id);
  }

  /**
   * ====================================
   * UTILIDADES
   * ====================================
   */

  /**
   * Generar slug a partir del título
   */
  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remover acentos
      .replace(/[^a-z0-9]+/g, '-')     // Reemplazar caracteres especiales
      .replace(/^-+|-+$/g, '');        // Remover guiones al inicio y final
  }

  /**
   * Obtener todas las categorías únicas
   */
  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('category')
      .not('category', 'is', null);

    if (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }

    const categories = [...new Set(data?.map(item => item.category).filter(Boolean))];
    return categories as string[];
  }

  /**
   * Obtener todos los tags únicos
   */
  async getTags(): Promise<string[]> {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('tags');

    if (error) {
      console.error('Error fetching tags:', error);
      throw error;
    }

    const allTags = data?.flatMap(item => item.tags || []) || [];
    return [...new Set(allTags)];
  }

  /**
   * Obtener estadísticas del blog
   */
  async getStats() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, published, created_at');

    if (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }

    return {
      total: data?.length || 0,
      published: data?.filter(p => p.published).length || 0,
      drafts: data?.filter(p => !p.published).length || 0,
    };
  }
}

// Exportar instancia del servicio
export const blogService = new BlogService();