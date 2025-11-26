-- ============================================
-- DEFI MEXICO HUB - DATABASE SCHEMA
-- Sistema de Propuestas y Gestión de Contenido
-- ============================================

-- ============================================
-- 1. EXTENSIONES Y CONFIGURACIÓN INICIAL
-- ============================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. ENUMS Y TIPOS
-- ============================================

-- Tipo de rol de usuario
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'user');

-- Estado de propuestas
CREATE TYPE proposal_status AS ENUM ('pending', 'approved', 'rejected', 'draft');

-- Tipo de contenido
CREATE TYPE content_type AS ENUM ('startup', 'event', 'community', 'referent', 'blog', 'course');

-- Categorías de referentes
CREATE TYPE referent_category AS ENUM (
  'programadores',
  'abogados',
  'financieros',
  'diseñadores',
  'marketers',
  'otros'
);

-- ============================================
-- 3. TABLA DE USUARIOS EXTENDIDA
-- ============================================

-- Tabla de perfiles de usuario (extiende auth.users de Supabase)
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  bio TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website_url TEXT,
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para profiles
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);

-- ============================================
-- 4. SISTEMA DE PROPUESTAS GENÉRICO
-- ============================================

-- Tabla principal de propuestas
CREATE TABLE public.proposals (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  content_type content_type NOT NULL,
  status proposal_status DEFAULT 'pending' NOT NULL,

  -- Relaciones
  proposed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,

  -- Datos del contenido (JSON flexible)
  content_data JSONB NOT NULL,

  -- Metadata
  review_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constrains
  CONSTRAINT valid_content_data CHECK (jsonb_typeof(content_data) = 'object')
);

-- Índices para proposals
CREATE INDEX idx_proposals_status ON proposals(status);
CREATE INDEX idx_proposals_content_type ON proposals(content_type);
CREATE INDEX idx_proposals_proposed_by ON proposals(proposed_by);
CREATE INDEX idx_proposals_created_at ON proposals(created_at DESC);

-- ============================================
-- 5. TABLAS DE CONTENIDO APROBADO
-- ============================================

-- 5.1 STARTUPS
CREATE TABLE public.startups (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Información básica
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,

  -- Categorización
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',

  -- Ubicación
  country TEXT DEFAULT 'Mexico',
  city TEXT,

  -- Redes y enlaces
  website_url TEXT,
  twitter_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,

  -- Métricas
  funding_stage TEXT,
  total_funding DECIMAL(15,2),
  employee_count INTEGER,
  founded_year INTEGER,

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Control
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para startups
CREATE INDEX idx_startups_slug ON startups(slug);
CREATE INDEX idx_startups_category ON startups(category);
CREATE INDEX idx_startups_is_featured ON startups(is_featured);
CREATE INDEX idx_startups_is_active ON startups(is_active);

-- 5.2 EVENTOS
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Información básica
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,

  -- Detalles del evento
  event_type TEXT, -- 'conference', 'meetup', 'workshop', 'webinar'
  format TEXT, -- 'presencial', 'virtual', 'híbrido'

  -- Fechas y ubicación
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  timezone TEXT DEFAULT 'America/Mexico_City',
  location TEXT,
  venue_name TEXT,
  address TEXT,
  city TEXT,
  country TEXT DEFAULT 'Mexico',

  -- Enlaces
  registration_url TEXT,
  website_url TEXT,
  streaming_url TEXT,

  -- Organización
  organizer_name TEXT,
  organizer_logo_url TEXT,
  sponsors TEXT[] DEFAULT '{}',

  -- Capacidad y precio
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  is_free BOOLEAN DEFAULT true,
  price_info TEXT,

  -- Categorización
  tags TEXT[] DEFAULT '{}',
  topics TEXT[] DEFAULT '{}',

  -- Control
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para events
CREATE INDEX idx_events_slug ON events(slug);
CREATE INDEX idx_events_start_date ON events(start_date);
CREATE INDEX idx_events_is_featured ON events(is_featured);
CREATE INDEX idx_events_event_type ON events(event_type);

-- 5.3 COMUNIDADES
CREATE TABLE public.communities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Información básica
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  logo_url TEXT,
  cover_image_url TEXT,

  -- Tipo y categoría
  community_type TEXT, -- 'dao', 'telegram', 'discord', 'meetup', 'otros'
  focus_area TEXT, -- 'defi', 'nft', 'desarrollo', 'inversión', 'educación'

  -- Enlaces
  main_url TEXT,
  telegram_url TEXT,
  discord_url TEXT,
  twitter_url TEXT,
  github_url TEXT,

  -- Métricas
  member_count INTEGER,
  is_verified BOOLEAN DEFAULT false,

  -- Ubicación (si es presencial)
  city TEXT,
  country TEXT DEFAULT 'Mexico',

  -- Categorización
  tags TEXT[] DEFAULT '{}',

  -- Control
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para communities
CREATE INDEX idx_communities_slug ON communities(slug);
CREATE INDEX idx_communities_type ON communities(community_type);
CREATE INDEX idx_communities_is_featured ON communities(is_featured);

-- 5.4 REFERENTES
CREATE TABLE public.referents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL,

  -- Información personal
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  avatar_url TEXT,

  -- Categoría profesional
  category referent_category NOT NULL,

  -- Redes sociales y profesionales
  twitter_url TEXT,
  github_url TEXT,
  linkedin_url TEXT,
  website_url TEXT,

  -- Información adicional
  company TEXT,
  position TEXT,
  location TEXT,

  -- Áreas de expertise
  expertise_areas TEXT[] DEFAULT '{}',

  -- Control
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para referents
CREATE INDEX idx_referents_slug ON referents(slug);
CREATE INDEX idx_referents_category ON referents(category);
CREATE INDEX idx_referents_is_active ON referents(is_active);

-- 5.5 BLOG POSTS
CREATE TABLE public.blog_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Información básica
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,

  -- Autor
  author_id UUID REFERENCES profiles(id) NOT NULL,

  -- Categorización
  category TEXT,
  tags TEXT[] DEFAULT '{}',

  -- SEO
  meta_title TEXT,
  meta_description TEXT,

  -- Estado de publicación
  status proposal_status DEFAULT 'draft',
  published_at TIMESTAMPTZ,

  -- Métricas
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,

  -- Control
  is_featured BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para blog_posts
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_author ON blog_posts(author_id);
CREATE INDEX idx_blog_posts_status ON blog_posts(status);
CREATE INDEX idx_blog_posts_published_at ON blog_posts(published_at DESC);

-- 5.6 CURSOS (ACADEMIA)
CREATE TABLE public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,

  -- Información básica
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  cover_image_url TEXT,

  -- Contenido
  syllabus JSONB,
  learning_outcomes TEXT[] DEFAULT '{}',
  prerequisites TEXT[] DEFAULT '{}',

  -- Instructor
  instructor_id UUID REFERENCES profiles(id),
  instructor_name TEXT,

  -- Detalles del curso
  difficulty_level TEXT, -- 'principiante', 'intermedio', 'avanzado'
  duration_hours INTEGER,
  language TEXT DEFAULT 'es',

  -- Precio
  is_free BOOLEAN DEFAULT true,
  price DECIMAL(10,2),
  currency TEXT DEFAULT 'MXN',

  -- Enlaces
  enrollment_url TEXT,
  course_url TEXT,

  -- Categorización
  category TEXT,
  tags TEXT[] DEFAULT '{}',

  -- Métricas
  enrolled_count INTEGER DEFAULT 0,
  rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,

  -- Control
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  status proposal_status DEFAULT 'draft',

  -- Timestamps
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para courses
CREATE INDEX idx_courses_slug ON courses(slug);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_is_featured ON courses(is_featured);

-- ============================================
-- 6. TABLAS DE SOPORTE
-- ============================================

-- 6.1 Notificaciones
CREATE TABLE public.notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT, -- 'proposal_approved', 'proposal_rejected', 'new_proposal', etc.

  related_type content_type,
  related_id UUID,

  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);

-- 6.2 Actividad del sistema (Audit Log)
CREATE TABLE public.activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,

  action TEXT NOT NULL, -- 'create', 'update', 'delete', 'approve', 'reject'
  entity_type content_type,
  entity_id UUID,

  old_data JSONB,
  new_data JSONB,

  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para activity_log
CREATE INDEX idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX idx_activity_log_created_at ON activity_log(created_at DESC);

-- ============================================
-- 7. FUNCIONES Y TRIGGERS
-- ============================================

-- 7.1 Función para actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7.2 Aplicar trigger a todas las tablas relevantes
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_referents_updated_at BEFORE UPDATE ON referents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7.3 Función para crear notificación al aprobar/rechazar propuesta
CREATE OR REPLACE FUNCTION notify_proposal_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
    VALUES (
      NEW.proposed_by,
      CASE
        WHEN NEW.status = 'approved' THEN 'Propuesta Aprobada'
        ELSE 'Propuesta Rechazada'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Tu propuesta ha sido aprobada y publicada'
        ELSE 'Tu propuesta ha sido rechazada. ' || COALESCE(NEW.review_notes, '')
      END,
      'proposal_' || NEW.status,
      NEW.content_type,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER notify_on_proposal_decision AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION notify_proposal_decision();

-- ============================================
-- 8. ROW LEVEL SECURITY (RLS)
-- ============================================

-- 8.1 Habilitar RLS en todas las tablas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE startups ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE referents ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- 8.2 Policies para PROFILES
CREATE POLICY "Usuarios pueden ver todos los perfiles"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Usuarios pueden actualizar su propio perfil"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- 8.3 Policies para PROPOSALS
CREATE POLICY "Usuarios pueden ver sus propias propuestas"
  ON proposals FOR SELECT
  USING (proposed_by = auth.uid());

CREATE POLICY "Admins y editores pueden ver todas las propuestas"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

CREATE POLICY "Usuarios autenticados pueden crear propuestas"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = proposed_by);

CREATE POLICY "Solo admins pueden aprobar/rechazar propuestas"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8.4 Policies para contenido aprobado (STARTUPS, EVENTS, etc.)
CREATE POLICY "Todos pueden ver startups activas"
  ON startups FOR SELECT
  USING (is_active = true);

CREATE POLICY "Todos pueden ver eventos activos"
  ON events FOR SELECT
  USING (is_active = true);

CREATE POLICY "Todos pueden ver comunidades activas"
  ON communities FOR SELECT
  USING (is_active = true);

CREATE POLICY "Todos pueden ver referentes activos"
  ON referents FOR SELECT
  USING (is_active = true);

CREATE POLICY "Todos pueden ver blog posts publicados"
  ON blog_posts FOR SELECT
  USING (status = 'approved');

CREATE POLICY "Todos pueden ver cursos activos"
  ON courses FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Admins tienen acceso total
CREATE POLICY "Admins tienen acceso total a startups"
  ON startups FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 8.5 Policies para NOTIFICATIONS
CREATE POLICY "Usuarios solo ven sus propias notificaciones"
  ON notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Sistema puede crear notificaciones"
  ON notifications FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Usuarios pueden marcar sus notificaciones como leídas"
  ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- 8.6 Policies para ACTIVITY_LOG
CREATE POLICY "Solo admins pueden ver el log de actividad"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ============================================
-- 9. VISTAS ÚTILES
-- ============================================

-- 9.1 Vista de propuestas pendientes con información del usuario
CREATE VIEW pending_proposals_with_user AS
SELECT
  p.*,
  prof.full_name as proposed_by_name,
  prof.email as proposed_by_email,
  prof.avatar_url as proposed_by_avatar
FROM proposals p
LEFT JOIN profiles prof ON p.proposed_by = prof.id
WHERE p.status = 'pending'
ORDER BY p.created_at DESC;

-- 9.2 Vista de estadísticas por usuario
CREATE VIEW user_statistics AS
SELECT
  p.id as user_id,
  p.full_name,
  p.role,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'pending') as pending_proposals,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'approved') as approved_proposals,
  COUNT(DISTINCT pr.id) FILTER (WHERE pr.status = 'rejected') as rejected_proposals,
  COUNT(DISTINCT bp.id) as blog_posts_count,
  p.created_at as member_since
FROM profiles p
LEFT JOIN proposals pr ON p.id = pr.proposed_by
LEFT JOIN blog_posts bp ON p.id = bp.author_id
GROUP BY p.id, p.full_name, p.role, p.created_at;

-- ============================================
-- 10. COMENTARIOS Y DOCUMENTACIÓN
-- ============================================

COMMENT ON TABLE proposals IS 'Sistema genérico de propuestas para todos los tipos de contenido';
COMMENT ON TABLE profiles IS 'Perfiles extendidos de usuarios con sistema de roles';
COMMENT ON TABLE activity_log IS 'Registro de auditoría de todas las acciones importantes';
COMMENT ON TYPE proposal_status IS 'Estados posibles de una propuesta: pending, approved, rejected, draft';
COMMENT ON TYPE content_type IS 'Tipos de contenido que pueden ser propuestos';
