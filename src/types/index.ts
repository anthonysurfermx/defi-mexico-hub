// =====================================================
// 1. src/types/index.ts - Tipos de la aplicación
// =====================================================
import { Database } from './database.types';

// Tipos de las tablas
export type Community = Database['public']['Tables']['communities']['Row'];
export type ContactForm = Database['public']['Tables']['contact_forms']['Row'];
export type NewsletterSubscriber = Database['public']['Tables']['newsletter_subscribers']['Row'];
export type EventRegistration = Database['public']['Tables']['event_registrations']['Row'];
export type StartupApplication = Database['public']['Tables']['startup_applications']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type PlatformStats = Database['public']['Tables']['platform_stats']['Row'];
export type Log = Database['public']['Tables']['logs']['Row'];

// Tipos para inserts y updates
export type CommunityInsert = Database['public']['Tables']['communities']['Insert'];
export type CommunityUpdate = Database['public']['Tables']['communities']['Update'];
export type ContactFormInsert = Database['public']['Tables']['contact_forms']['Insert'];
export type NewsletterSubscriberInsert = Database['public']['Tables']['newsletter_subscribers']['Insert'];
export type EventRegistrationInsert = Database['public']['Tables']['event_registrations']['Insert'];
export type StartupApplicationInsert = Database['public']['Tables']['startup_applications']['Insert'];
export type UserRoleInsert = Database['public']['Tables']['user_roles']['Insert'];

// Enums
export type CommunityCategory = 'dao' | 'defi' | 'nft' | 'gaming' | 'infrastructure' | 'education' | 'other';
export type ContactPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ContactStatus = 'new' | 'in_progress' | 'resolved' | 'archived';
export type NewsletterStatus = 'active' | 'unsubscribed' | 'bounced' | 'complained';
export type RegistrationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'no_show';
export type ApplicationStatus = 'draft' | 'submitted' | 'under_review' | 'accepted' | 'rejected' | 'waitlisted';
export type LogLevel = 'debug' | 'info' | 'warning' | 'error' | 'critical';
export type LogCategory = 'auth' | 'database' | 'api' | 'frontend' | 'payment' | 'notification' | 'admin' | 'user_action' | 'system' | 'security';
export type UserRoleType = 'user' | 'moderator' | 'admin' | 'super_admin';
export type FundingStage = 'pre_seed' | 'seed' | 'series_a' | 'series_b' | 'series_c' | 'growth' | 'ipo';

// Tipos de respuesta de funciones RPC
export interface PlatformStatsWithDetails extends PlatformStats {
  recent_growth_percentage?: number;
  top_communities?: Community[];
  recent_contacts?: ContactForm[];
  active_events?: number;
  pending_applications?: number;
}

// Tipos de respuesta de servicios
export interface ServiceResponse<T> {
  data: T | null;
  error: string | null;
  metadata?: Record<string, any>;
}

// Tipos para filtros y paginación
export interface PaginationOptions {
  page?: number;
  limit?: number;
  orderBy?: string;
  order?: 'asc' | 'desc';
}

export interface CommunityFilters extends PaginationOptions {
  category?: CommunityCategory;
  searchTerm?: string;
  minMembers?: number;
  isActive?: boolean;
}

export interface ContactFormFilters extends PaginationOptions {
  status?: ContactStatus;
  priority?: ContactPriority;
  assignedTo?: string;
  dateFrom?: string;
  dateTo?: string;
}

// Re-export Database type
export type { Database };
