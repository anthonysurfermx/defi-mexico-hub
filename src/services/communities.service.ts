// src/services/communities.service.ts
import { supabase } from '@/lib/supabase';
import { Database } from '@/types/database.types';

// Tipos basados en tu esquema real de Supabase
export type Community = Database['public']['Tables']['communities']['Row'];
export type CommunityInsert = Database['public']['Tables']['communities']['Insert'];
export type CommunityUpdate = Database['public']['Tables']['communities']['Update'];

// Interfaz para filtros
export interface CommunityFilters {
  category?: string;
  searchTerm?: string;
  isActive?: boolean;
  isFeatured?: boolean;
  tags?: string[];
  location?: string;
  limit?: number;
  offset?: number;
}

// Response types para manejar errores
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
}

class CommunitiesService {
  // Obtener todas las comunidades con filtros
  async getAll(filters?: CommunityFilters): Promise<ServiceResponse<Community[]>> {
    try {
      let query = supabase
        .from('communities')
        .select('*');

      // Solo mostrar comunidades verificadas por defecto  
      if (filters?.isActive !== false) {
        query = query.eq('is_verified', true);
      }

      // Aplicar filtros
      if (filters?.category && filters.category !== 'all') {
        query = query.eq('category', filters.category);
      }

      if (filters?.isFeatured) {
        query = query.eq('is_featured', true);
      }

      if (filters?.location) {
        query = query.ilike('location', `%${filters.location}%`);
      }

      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Ordenar por featured primero, luego por miembros
      query = query
        .order('is_featured', { ascending: false })
        .order('member_count', { ascending: false });

      // Aplicar límite
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching communities:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error in getAll:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Búsqueda simple
  async searchSimple(searchTerm: string, limit: number = 50): Promise<ServiceResponse<Community[]>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
        .eq('is_active', true)
        .order('member_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error searching communities:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error in searchSimple:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Obtener estadísticas
  async getStats(): Promise<ServiceResponse<{
    total: number;
    verified: number;
    featured: number;
    totalMembers: number;
    categories: Record<string, number>;
  }>> {
    try {
      // Obtener todas las comunidades verificadas para calcular stats
      const { data: communities, error } = await supabase
        .from('communities')
        .select('category, member_count, is_featured, is_verified')
        .eq('is_verified', true);

      if (error) {
        console.error('Error fetching stats:', error);
        return { data: null, error: error.message };
      }

      if (!communities) {
        return {
          data: {
            total: 0,
            verified: 0,
            featured: 0,
            totalMembers: 0,
            categories: {}
          },
          error: null
        };
      }

      // Calcular estadísticas
      const stats = {
        total: communities.length,
        verified: communities.filter(c => c.is_verified).length,
        featured: communities.filter(c => c.is_featured).length,
        totalMembers: communities.reduce((sum, c) => sum + (c.member_count || 0), 0),
        categories: communities.reduce((acc, c) => {
          if (c.category) {
            acc[c.category] = (acc[c.category] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      };

      return { data: stats, error: null };
    } catch (err) {
      console.error('Error in getStats:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Obtener comunidad por ID
  async getById(id: string): Promise<ServiceResponse<Community>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Comunidad no encontrada' };
        }
        console.error('Error fetching community:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in getById:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Obtener comunidad por slug
  async getBySlug(slug: string): Promise<ServiceResponse<Community>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { data: null, error: 'Comunidad no encontrada' };
        }
        console.error('Error fetching community by slug:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in getBySlug:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Obtener comunidades destacadas
  async getFeatured(limit: number = 6): Promise<ServiceResponse<Community[]>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('is_featured', true)
        .eq('is_verified', true)
        .order('member_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching featured communities:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error in getFeatured:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Obtener comunidades relacionadas
  async getRelated(communityId: string, limit: number = 4): Promise<ServiceResponse<Community[]>> {
    try {
      // Primero obtenemos la comunidad actual
      const { data: current } = await this.getById(communityId);
      if (!current) {
        return { data: [], error: null };
      }

      // Buscamos comunidades de la misma categoría
      const { data, error } = await supabase
        .from('communities')
        .select('*')
        .eq('category', current.category)
        .neq('id', communityId)
        .eq('is_verified', true)
        .order('member_count', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching related communities:', error);
        return { data: null, error: error.message };
      }

      return { data: data || [], error: null };
    } catch (err) {
      console.error('Error in getRelated:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Crear comunidad
  async create(community: CommunityInsert): Promise<ServiceResponse<Community>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .insert(community)
        .select()
        .single();

      if (error) {
        console.error('Error creating community:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in create:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Actualizar comunidad
  async update(id: string, updates: CommunityUpdate): Promise<ServiceResponse<Community>> {
    try {
      const { data, error } = await supabase
        .from('communities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating community:', error);
        return { data: null, error: error.message };
      }

      return { data, error: null };
    } catch (err) {
      console.error('Error in update:', err);
      return { 
        data: null, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }

  // Eliminar comunidad (soft delete)
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ 
          is_verified: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) {
        console.error('Error deleting community:', error);
        return { data: false, error: error.message };
      }

      return { data: true, error: null };
    } catch (err) {
      console.error('Error in delete:', err);
      return { 
        data: false, 
        error: err instanceof Error ? err.message : 'Error desconocido' 
      };
    }
  }
}

export const communitiesService = new CommunitiesService();