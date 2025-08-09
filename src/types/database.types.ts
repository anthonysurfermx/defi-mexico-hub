/**
 * Supabase-generated types + domain helpers for DeFi México
 * - Mantén este archivo libre de dependencias de runtime.
 * - NO cambies las formas de Row/Insert/Update sin actualizar la BD.
 * - Agrega tipos "Domain" por encima para una DX más estricta.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

// ────────────────────────────────────────────────────────────────────────────
// Base Supabase schema (mantén esto alineado a tu BD real)
// ────────────────────────────────────────────────────────────────────────────
export interface Database {
  public: {
    Tables: {
      startups: {
        Row: {
          id: string
          name: string
          description: string
          logo_url: string | null
          website: string | null
          category: string | null
          founded_year: number | null
          is_featured: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          logo_url?: string | null
          website?: string | null
          category?: string | null
          founded_year?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          logo_url?: string | null
          website?: string | null
          category?: string | null
          founded_year?: number | null
          is_featured?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      founders: {
        Row: {
          id: string
          startup_id: string
          name: string
          role: string
          bio: string | null
          image_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          startup_id: string
          name: string
          role: string
          bio?: string | null
          image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          startup_id?: string
          name?: string
          role?: string
          bio?: string | null
          image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      blog_posts: {
        Row: {
          id: string
          title: string
          slug: string
          excerpt: string
          content: string
          author: string
          category: string
          tags: string[] | null
          image_url: string | null
          published: boolean
          published_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          slug: string
          excerpt: string
          content: string
          author: string
          category: string
          tags?: string[] | null
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          slug?: string
          excerpt?: string
          content?: string
          author?: string
          category?: string
          tags?: string[] | null
          image_url?: string | null
          published?: boolean
          published_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      events: {
        Row: {
          id: string
          title: string
          description: string
          type: string
          location: string
          date: string
          time: string
          registration_url: string | null
          image_url: string | null
          is_upcoming: boolean
          max_attendees: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          type: string
          location: string
          date: string
          time: string
          registration_url?: string | null
          image_url?: string | null
          is_upcoming?: boolean
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          type?: string
          location?: string
          date?: string
          time?: string
          registration_url?: string | null
          image_url?: string | null
          is_upcoming?: boolean
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      event_speakers: {
        Row: {
          id: string
          event_id: string
          name: string
          bio: string | null
          company: string | null
          role: string | null
          image_url: string | null
          linkedin_url: string | null
          twitter_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          event_id: string
          name: string
          bio?: string | null
          company?: string | null
          role?: string | null
          image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          event_id?: string
          name?: string
          bio?: string | null
          company?: string | null
          role?: string | null
          image_url?: string | null
          linkedin_url?: string | null
          twitter_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers y utilidades de tipos (DX)
// ────────────────────────────────────────────────────────────────────────────

// Alias semánticos (no cambian el runtime, pero mejoran legibilidad)
export type UUID = string
export type ISODateTime = string // "2025-08-09T19:00:00.000Z"
export type URLString = string
export type Slug = string

// Enums de dominio (frontend) — mapea strings libres de la BD a valores controlados
export type StartupStatus = 'active' | 'inactive' | 'draft'
export type PostStatus = 'draft' | 'published' | 'scheduled'
export type EventStatus = 'upcoming' | 'ongoing' | 'completed'
export type EventType = 'meetup' | 'workshop' | 'spaces' | 'conference' | 'hackathon' | 'other'

// Generics para obtener tipos de tablas
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']
export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// Tipos específicos (Row/Insert/Update) — siguen el esquema actual de la BD
export type Startup = Database['public']['Tables']['startups']['Row']
export type StartupInsert = Database['public']['Tables']['startups']['Insert']
export type StartupUpdate = Database['public']['Tables']['startups']['Update']

export type Founder = Database['public']['Tables']['founders']['Row']
export type FounderInsert = Database['public']['Tables']['founders']['Insert']
export type FounderUpdate = Database['public']['Tables']['founders']['Update']

export type BlogPost = Database['public']['Tables']['blog_posts']['Row']
export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert']
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update']

export type Event = Database['public']['Tables']['events']['Row']
export type EventInsert = Database['public']['Tables']['events']['Insert']
export type EventUpdate = Database['public']['Tables']['events']['Update']

export type EventSpeaker = Database['public']['Tables']['event_speakers']['Row']
export type EventSpeakerInsert = Database['public']['Tables']['event_speakers']['Insert']
export type EventSpeakerUpdate = Database['public']['Tables']['event_speakers']['Update']

// Relaciones convenientes para el front
export interface StartupWithFounders extends Startup {
  founders?: Founder[]
}
export interface EventWithSpeakers extends Event {
  speakers?: EventSpeaker[]
}
export interface BlogPostWithAuthor extends BlogPost {
  author_details?: {
    name: string
    avatar_url?: string
    bio?: string
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Tipos de "Domain" (más estrictos para UI/formularios)
// No alteran la BD; sirven para validación y normalización en el front.
// ────────────────────────────────────────────────────────────────────────────

export interface DomainStartup {
  id: UUID
  name: string
  slug: Slug // recomendable añadir en BD en el futuro
  description: string
  logo_url?: URLString | null
  website?: URLString | null
  categories?: string[] // en BD hoy es 'category' string — sugerido migrar a TEXT[]
  founded_year?: number | null
  is_featured: boolean
  status?: StartupStatus // sugerido agregar en BD
  created_at: ISODateTime
  updated_at: ISODateTime
  founders?: Array<{
    id: UUID
    name: string
    role: string
    linkedin_url?: URLString | null
    twitter_url?: URLString | null
    image_url?: URLString | null
  }>
}

export interface DomainEvent {
  id: UUID
  title: string
  slug: Slug // sugerido en BD
  description: string
  type: EventType // mapea desde events.type
  location: string
  start_at: ISODateTime // sugerencia: unificar date+time a ISO
  end_at?: ISODateTime | null
  registration_url?: URLString | null
  image_url?: URLString | null
  status: EventStatus // mapea desde is_upcoming + fechas
  max_attendees?: number | null
  created_at: ISODateTime
  updated_at: ISODateTime
  speakers?: Array<{
    id: UUID
    name: string
    company?: string | null
    role?: string | null
    linkedin_url?: URLString | null
    twitter_url?: URLString | null
    image_url?: URLString | null
  }>
}

export interface DomainPost {
  id: UUID
  title: string
  slug: Slug
  excerpt: string
  content: string // Markdown/MDX
  author: string
  categories?: string[] // mapea desde category
  tags?: string[]
  image_url?: URLString | null
  status: PostStatus // derivado de published
  published_at?: ISODateTime | null
  created_at: ISODateTime
  updated_at: ISODateTime
}

// Tipos de Input para formularios (lo que el usuario puede enviar)
export type StartupInput = Omit<
  DomainStartup,
  'id' | 'created_at' | 'updated_at' | 'founders' | 'status'
> & { status?: StartupStatus }

export type EventInput = Omit<
  DomainEvent,
  'id' | 'created_at' | 'updated_at' | 'speakers' | 'status'
> & { status?: EventStatus }

export type BlogPostInput = Omit<
  DomainPost,
  'id' | 'created_at' | 'updated_at' | 'status'
> & { status?: PostStatus }

// ────────────────────────────────────────────────────────────────────────────
/**
 * Paginación y filtros reutilizables
 */
export interface Page<T> {
  items: T[]
  total: number
  page: number // 1-based
  pageSize: number
}
export interface ListParams {
  page?: number
  pageSize?: number
  q?: string
  categories?: string[]
  status?: string
  orderBy?: string // e.g. "created_at.desc"
}