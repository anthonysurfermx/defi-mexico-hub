// src/services/startups.service.ts
import { supabase } from '../lib/supabase';

export const startupsService = {
  async getFeatured() {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('featured', true)  // Cambiado de is_featured a featured
      .order('created_at', { ascending: false })
      .limit(6);

    if (error) throw error;
    return data || [];
  },

  async getAll() {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getFiltered(filters: {
    category?: string;
    search?: string;
  }) {
    let query = supabase.from('startups').select('*');

    if (filters.category) {
      query = query.contains('categories', [filters.category]); // Usar categories array
    }
    
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query
      .order('featured', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async create(startup: any) {
    const { data, error } = await supabase
      .from('startups')
      .insert(startup)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, updates: any) {
    const { data, error } = await supabase
      .from('startups')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('startups')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
};