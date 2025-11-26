-- ============================================
-- MIGRACIÓN FINAL - DeFi Mexico Hub
-- Completar el sistema de propuestas
-- ============================================

-- ============================================
-- 1. AGREGAR proposal_id A TABLAS EXISTENTES
-- ============================================

-- Startups
ALTER TABLE public.startups
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_startups_proposal_id ON startups(proposal_id);

-- Events
ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_events_proposal_id ON events(proposal_id);

-- Communities
ALTER TABLE public.communities
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_communities_proposal_id ON communities(proposal_id);

-- Courses
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_courses_proposal_id ON courses(proposal_id);

-- Blog Posts
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_blog_posts_proposal_id ON blog_posts(proposal_id);

-- DeFi Advocates (ahora será compatible con el sistema de propuestas)
ALTER TABLE public.defi_advocates
  ADD COLUMN IF NOT EXISTS proposal_id UUID REFERENCES proposals(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_defi_advocates_proposal_id ON defi_advocates(proposal_id);

-- ============================================
-- 2. CREAR TABLA REFERENTS
-- ============================================

CREATE TABLE IF NOT EXISTS public.referents (
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
CREATE INDEX IF NOT EXISTS idx_referents_slug ON referents(slug);
CREATE INDEX IF NOT EXISTS idx_referents_category ON referents(category);
CREATE INDEX IF NOT EXISTS idx_referents_is_active ON referents(is_active);
CREATE INDEX IF NOT EXISTS idx_referents_proposal_id ON referents(proposal_id);
CREATE INDEX IF NOT EXISTS idx_referents_created_by ON referents(created_by);

-- ============================================
-- 3. CREAR TABLA ACTIVITY_LOG
-- ============================================

CREATE TABLE IF NOT EXISTS public.activity_log (
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
CREATE INDEX IF NOT EXISTS idx_activity_log_user_id ON activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_entity_type ON activity_log(entity_type);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON activity_log(action);

-- ============================================
-- 4. TRIGGERS Y FUNCIONES
-- ============================================

-- 4.1 Función para actualizar updated_at (si no existe)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4.2 Aplicar trigger a tablas que lo necesiten
-- Proposals
DROP TRIGGER IF EXISTS update_proposals_updated_at ON proposals;
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Startups
DROP TRIGGER IF EXISTS update_startups_updated_at ON startups;
CREATE TRIGGER update_startups_updated_at BEFORE UPDATE ON startups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Events
DROP TRIGGER IF EXISTS update_events_updated_at ON events;
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Communities
DROP TRIGGER IF EXISTS update_communities_updated_at ON communities;
CREATE TRIGGER update_communities_updated_at BEFORE UPDATE ON communities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Referents
DROP TRIGGER IF EXISTS update_referents_updated_at ON referents;
CREATE TRIGGER update_referents_updated_at BEFORE UPDATE ON referents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Courses
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Blog Posts
DROP TRIGGER IF EXISTS update_blog_posts_updated_at ON blog_posts;
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Profiles
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 4.3 Función para notificaciones automáticas al aprobar/rechazar
CREATE OR REPLACE FUNCTION notify_proposal_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO notifications (user_id, title, message, type, related_type, related_id)
    VALUES (
      NEW.proposed_by,
      CASE
        WHEN NEW.status = 'approved' THEN 'Propuesta Aprobada ✅'
        ELSE 'Propuesta Rechazada ❌'
      END,
      CASE
        WHEN NEW.status = 'approved' THEN 'Tu propuesta ha sido aprobada y publicada'
        ELSE 'Tu propuesta ha sido rechazada. ' || COALESCE(NEW.review_notes, 'Sin comentarios adicionales.')
      END,
      'proposal_' || NEW.status,
      NEW.content_type,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS notify_on_proposal_decision ON proposals;
CREATE TRIGGER notify_on_proposal_decision AFTER UPDATE ON proposals
  FOR EACH ROW EXECUTE FUNCTION notify_proposal_decision();

-- ============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================

-- Habilitar RLS en tablas nuevas
ALTER TABLE referents ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- Asegurarse de que proposals tenga RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 5.1 Policies para PROPOSALS (actualizar si es necesario)

-- Usuarios ven sus propias propuestas
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias propuestas" ON proposals;
CREATE POLICY "Usuarios pueden ver sus propias propuestas"
  ON proposals FOR SELECT
  USING (proposed_by = auth.uid());

-- Admins y editores ven todas las propuestas
DROP POLICY IF EXISTS "Admins y editores pueden ver todas las propuestas" ON proposals;
CREATE POLICY "Admins y editores pueden ver todas las propuestas"
  ON proposals FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role IN ('admin', 'editor')
    )
  );

-- Usuarios autenticados pueden crear propuestas
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear propuestas" ON proposals;
CREATE POLICY "Usuarios autenticados pueden crear propuestas"
  ON proposals FOR INSERT
  WITH CHECK (auth.uid() = proposed_by);

-- Solo admins pueden aprobar/rechazar
DROP POLICY IF EXISTS "Solo admins pueden aprobar/rechazar propuestas" ON proposals;
CREATE POLICY "Solo admins pueden aprobar/rechazar propuestas"
  ON proposals FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Usuarios pueden actualizar sus propias propuestas pendientes
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propuestas pendientes" ON proposals;
CREATE POLICY "Usuarios pueden actualizar sus propuestas pendientes"
  ON proposals FOR UPDATE
  USING (proposed_by = auth.uid() AND status = 'pending');

-- 5.2 Policies para REFERENTS

-- Todos pueden ver referentes activos
DROP POLICY IF EXISTS "Todos pueden ver referentes activos" ON referents;
CREATE POLICY "Todos pueden ver referentes activos"
  ON referents FOR SELECT
  USING (is_active = true);

-- Admins tienen acceso total
DROP POLICY IF EXISTS "Admins tienen acceso total a referents" ON referents;
CREATE POLICY "Admins tienen acceso total a referents"
  ON referents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 5.3 Policies para ACTIVITY_LOG

-- Solo admins pueden ver el log
DROP POLICY IF EXISTS "Solo admins pueden ver el log de actividad" ON activity_log;
CREATE POLICY "Solo admins pueden ver el log de actividad"
  ON activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Sistema puede insertar
DROP POLICY IF EXISTS "Sistema puede insertar en activity_log" ON activity_log;
CREATE POLICY "Sistema puede insertar en activity_log"
  ON activity_log FOR INSERT
  WITH CHECK (true);

-- ============================================
-- 6. VERIFICACIÓN FINAL
-- ============================================

-- Ver todas las tablas con proposal_id
SELECT
  t.table_name,
  CASE WHEN c.column_name IS NOT NULL THEN '✅' ELSE '❌' END as has_proposal_id
FROM information_schema.tables t
LEFT JOIN information_schema.columns c
  ON c.table_schema = t.table_schema
  AND c.table_name = t.table_name
  AND c.column_name = 'proposal_id'
WHERE t.table_schema = 'public'
  AND t.table_type = 'BASE TABLE'
  AND t.table_name IN (
    'startups', 'events', 'communities', 'courses',
    'blog_posts', 'defi_advocates', 'referents'
  )
ORDER BY t.table_name;

-- Ver conteo de registros
SELECT
  'proposals' as table_name, COUNT(*) as count FROM proposals
UNION ALL
SELECT 'startups', COUNT(*) FROM startups
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL
SELECT 'communities', COUNT(*) FROM communities
UNION ALL
SELECT 'referents', COUNT(*) FROM referents
UNION ALL
SELECT 'courses', COUNT(*) FROM courses
UNION ALL
SELECT 'blog_posts', COUNT(*) FROM blog_posts
UNION ALL
SELECT 'notifications', COUNT(*) FROM notifications
UNION ALL
SELECT 'activity_log', COUNT(*) FROM activity_log;

-- ============================================
-- ✅ MIGRACIÓN COMPLETADA
-- ============================================

-- Ahora puedes usar el sistema de propuestas:
-- 1. useProposals() para gestionar propuestas
-- 2. usePermissions() para verificar permisos
-- 3. Las notificaciones se crean automáticamente
-- 4. Todo el flujo está conectado
