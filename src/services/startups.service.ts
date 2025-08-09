// src/services/startups.service.ts
import { supabase } from '../lib/supabase';
import type { Startup, StartupInsert, StartupUpdate } from '../types/database.types';

export const startupsService = {
  /**
   * Obtener todas las startups
   */
  async getAll() {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener startups destacadas
   */
  async getFeatured() {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('is_featured', true)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener una startup por ID
   */
  async getById(id: string) {
    const { data, error } = await supabase
      .from('startups')
      .select(`
        *,
        founders (*)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Buscar startups por nombre o descripción
   */
  async search(query: string) {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Filtrar startups por categoría
   */
  async getByCategory(category: string) {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener startups con filtros combinados
   */
  async getFiltered(filters: {
    category?: string;
    search?: string;
    founded_year?: number;
    is_featured?: boolean;
  }) {
    let query = supabase.from('startups').select('*');

    // Aplicar filtros dinámicamente
    if (filters.category) {
      query = query.eq('category', filters.category);
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }
    
    if (filters.founded_year) {
      query = query.eq('founded_year', filters.founded_year);
    }
    
    if (filters.is_featured !== undefined) {
      query = query.eq('is_featured', filters.is_featured);
    }

    // Ordenar por fecha de creación
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  },

  /**
   * Obtener categorías únicas
   */
  async getCategories() {
    const { data, error } = await supabase
      .from('startups')
      .select('category')
      .not('category', 'is', null);

    if (error) throw error;
    
    // Extraer categorías únicas
    const categories = [...new Set(data?.map(item => item.category))].filter(Boolean);
    return categories as string[];
  },

  /**
   * Crear una nueva startup (para admin)
   */
  async create(startup: StartupInsert) {
    const { data, error } = await supabase
      .from('startups')
      .insert(startup)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Actualizar una startup (para admin)
   */
  async update(id: string, updates: StartupUpdate) {
    const { data, error } = await supabase
      .from('startups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Eliminar una startup (para admin)
   */
  async delete(id: string) {
    const { error } = await supabase
      .from('startups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  },

  /**
   * Obtener estadísticas
   */
  async getStats() {
    const { data, error } = await supabase
      .from('startups')
      .select('*');

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      featured: data?.filter(s => s.is_featured).length || 0,
      categories: [...new Set(data?.map(s => s.category).filter(Boolean))] as string[],
      byYear: data?.reduce((acc, startup) => {
        if (startup.founded_year) {
          acc[startup.founded_year] = (acc[startup.founded_year] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>)
    };

    return stats;
  }
};