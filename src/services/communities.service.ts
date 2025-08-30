import { supabase, handleSupabaseError, queryWrapper } from '../lib/supabase';
import type { 
  Community, 
  CommunityInsert, 
  CommunityUpdate,
  CommunityFilters,
  ServiceResponse 
} from '../types';
import { platformService } from './platform.service';

export const communitiesService = {
  // Obtener todas las comunidades con filtros
  async getAll(filters?: CommunityFilters): Promise<ServiceResponse<Community[]>> {
    return queryWrapper(() => {
      let query = supabase
        .from('communities')
        .select('*', { count: 'exact' });

      // Aplicar filtros
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }
      if (filters?.minMembers) {
        query = query.gte('member_count', filters.minMembers);
      }
      if (filters?.searchTerm) {
        query = query.or(`name.ilike.%${filters.searchTerm}%,description.ilike.%${filters.searchTerm}%`);
      }

      // Aplicar ordenamiento
      const orderBy = filters?.orderBy || 'member_count';
      const order = filters?.order || 'desc';
      query = query.order(orderBy, { ascending: order === 'asc' });

      // Aplicar paginación
      if (filters?.page && filters?.limit) {
        const from = (filters.page - 1) * filters.limit;
        const to = from + filters.limit - 1;
        query = query.range(from, to);
      }

      return query;
    });
  },

  // Obtener una comunidad por ID
  async getById(id: string): Promise<ServiceResponse<Community>> {
    return queryWrapper(() => 
      supabase
        .from('communities')
        .select('*')
        .eq('id', id)
        .single()
    );
  },

  // Crear nueva comunidad
  async create(community: CommunityInsert): Promise<ServiceResponse<Community>> {
    const result = await queryWrapper(() =>
      supabase
        .from('communities')
        .insert(community)
        .select()
        .single()
    );
    
    if (result.data) {
      // Actualizar estadísticas de la plataforma
      await platformService.updateStats();
    }
    
    return result;
  },

  // Actualizar comunidad
  async update(id: string, updates: CommunityUpdate): Promise<ServiceResponse<Community>> {
    return queryWrapper(() =>
      supabase
        .from('communities')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
    );
  },

  // Eliminar comunidad (soft delete)
  async delete(id: string): Promise<ServiceResponse<boolean>> {
    try {
      const { error } = await supabase
        .from('communities')
        .update({ is_active: false })
        .eq('id', id);
      
      if (error) throw error;
      
      // Actualizar estadísticas
      await platformService.updateStats();
      
      return { data: true, error: null };
    } catch (error) {
      return { data: false, error: handleSupabaseError(error) };
    }
  },

  // Búsqueda con full-text
  async search(query: string): Promise<ServiceResponse<Community[]>> {
    return queryWrapper(() =>
      supabase
        .from('communities')
        .select('*')
        .textSearch('search_vector', query, {
          config: 'spanish'
        })
        .order('member_count', { ascending: false })
    );
  }
};