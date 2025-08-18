import { supabase } from '@/lib/supabase';

export class AdminService {
  // Estadísticas del dashboard
  async getDashboardStats() {
    const today = new Date().toISOString().split('T')[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const [users, startups, events, posts, weeklyUsers] = await Promise.all([
      supabase.from('profiles').select('count', { count: 'exact' }),
      supabase.from('startups').select('count', { count: 'exact' }).eq('status', 'approved'),
      supabase.from('events').select('count', { count: 'exact' }).gte('date', today),
      supabase.from('blog_posts').select('count', { count: 'exact' }).eq('status', 'published'),
      supabase.from('profiles').select('count', { count: 'exact' }).gte('created_at', lastWeek)
    ]);

    return {
      totalUsers: users.count || 0,
      totalStartups: startups.count || 0,
      upcomingEvents: events.count || 0,
      publishedPosts: posts.count || 0,
      weeklyNewUsers: weeklyUsers.count || 0,
      growthRate: this.calculateGrowthRate(users.count || 0, weeklyUsers.count || 0)
    };
  }

  // Gestión de Startups
  async getStartups(status?: string) {
    let query = supabase.from('startups').select('*').order('created_at', { ascending: false });
    
    if (status) {
      query = query.eq('status', status);
    }

    return await query;
  }

  async approveStartup(id: string) {
    return await supabase
      .from('startups')
      .update({ 
        status: 'approved', 
        approved_at: new Date().toISOString(),
        approved_by: (await supabase.auth.getUser()).data.user?.id
      })
      .eq('id', id);
  }

  async rejectStartup(id: string, reason: string) {
    return await supabase
      .from('startups')
      .update({ 
        status: 'rejected',
        rejection_reason: reason
      })
      .eq('id', id);
  }

  // Gestión de Eventos
  async getEvents(filter?: { status?: string; upcoming?: boolean }) {
    let query = supabase.from('events').select('*');
    
    if (filter?.status) {
      query = query.eq('status', filter.status);
    }
    
    if (filter?.upcoming) {
      query = query.gte('date', new Date().toISOString().split('T')[0]);
    }

    return await query.order('date', { ascending: true });
  }

  async createEvent(event: any) {
    return await supabase.from('events').insert({
      ...event,
      created_by: (await supabase.auth.getUser()).data.user?.id
    });
  }

  // Analytics
  async trackEvent(eventType: string, entityType: string, entityId: string, metadata?: any) {
    return await supabase.from('analytics').insert({
      event_type: eventType,
      entity_type: entityType,
      entity_id: entityId,
      metadata,
      user_id: (await supabase.auth.getUser()).data.user?.id
    });
  }

  async getAnalytics(dateRange: { from: string; to: string }) {
    return await supabase
      .from('analytics')
      .select('*')
      .gte('created_at', dateRange.from)
      .lte('created_at', dateRange.to);
  }

  // Helpers
  private calculateGrowthRate(total: number, weekly: number): number {
    if (total === 0) return 0;
    return Math.round((weekly / (total - weekly)) * 100 * 100) / 100;
  }
}

export const adminService = new AdminService();
