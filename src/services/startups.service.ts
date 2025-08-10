// src/services/startups.service.ts
import { supabase } from '../lib/supabase';

export const startupsService = {
  async getFeatured() {
    const { data, error } = await supabase
      .from('startups')
      .select('*')
      .eq('is_featured', true)
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
    page?: number;
    pageSize?: number;
    category?: string;
    search?: string;
  }) {
    const page = Math.max(1, filters.page ?? 1);
    const pageSize = Math.min(50, Math.max(1, filters.pageSize ?? 12));
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('startups')
      .select('*', { count: 'exact' });

    if (filters.category) {
      // Soporta tanto 'categories' (array) como 'category' (string)
      query = query.or(`categories.cs.{${filters.category}},category.eq.${filters.category}`);
    }

    if (filters.search) {
      const q = (filters.search || '').trim().slice(0, 200);
      if (q) {
        query = query.or(`name.ilike.%${q}%,description.ilike.%${q}%`);
      }
    }

    const { data, error, count } = await query
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) throw error;

    const items = (data || []).map((row: any) => ({
      id: row.id,
      name: row.name,
      slug: row.slug ?? row.id,
      description: row.description || '',
      logo_url: row.logo_url ?? null,
      website: row.website ?? null,
      categories: row.categories ?? (row.category ? [row.category] : []),
      founded_year: row.founded_year ?? null,
      is_featured: row.is_featured ?? row.featured ?? false,
      status: row.status ?? 'active',
      created_at: row.created_at,
      updated_at: row.updated_at,
      founders: row.founders ?? [],
    }));

    return {
      items,
      total: count ?? items.length,
      page,
      pageSize,
    };
  },

  async getCategories(): Promise<string[]> {
    const { data, error } = await supabase
      .from('startups')
      .select('category');

    if (error) throw error;

    const categories = Array.from(new Set((data || []).map((r: any) => r.category).filter(Boolean)));
    return categories as string[];
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
