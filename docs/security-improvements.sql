-- ============================================
-- MEJORAS DE SEGURIDAD - DeFi Mexico Hub
-- ============================================

-- ============================================
-- 1. POLÍTICAS RLS MEJORADAS PARA PROPOSALS
-- ============================================

-- Eliminar políticas antiguas y crear nuevas más seguras
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias propuestas" ON proposals;
DROP POLICY IF EXISTS "Admins y editores pueden ver todas las propuestas" ON proposals;
DROP POLICY IF EXISTS "Usuarios autenticados pueden crear propuestas" ON proposals;
DROP POLICY IF EXISTS "Solo admins pueden aprobar/rechazar propuestas" ON proposals;
DROP POLICY IF EXISTS "Usuarios pueden actualizar sus propuestas pendientes" ON proposals;

-- POLICY 1: Ver propias propuestas (usuarios autenticados)
CREATE POLICY "users_view_own_proposals" ON proposals
  FOR SELECT
  TO authenticated
  USING (proposed_by = auth.uid());

-- POLICY 2: Admins/editores ven TODAS las propuestas
CREATE POLICY "admins_editors_view_all_proposals" ON proposals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

-- POLICY 3: Crear propuestas (solo usuarios verificados)
CREATE POLICY "verified_users_create_proposals" ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = proposed_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND is_active = true
        AND email_verified = true
    )
  );

-- POLICY 4: Actualizar propias propuestas (solo si están pendientes)
CREATE POLICY "users_update_own_pending_proposals" ON proposals
  FOR UPDATE
  TO authenticated
  USING (
    proposed_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    proposed_by = auth.uid()
    AND status = 'pending'
  );

-- POLICY 5: Solo ADMINS pueden aprobar/rechazar
CREATE POLICY "admins_approve_reject_proposals" ON proposals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- POLICY 6: Eliminar propuestas (solo el creador si está pendiente, o admin)
CREATE POLICY "delete_own_pending_or_admin" ON proposals
  FOR DELETE
  TO authenticated
  USING (
    (proposed_by = auth.uid() AND status = 'pending')
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- 2. POLÍTICAS RLS PARA STARTUPS
-- ============================================

DROP POLICY IF EXISTS "Todos pueden ver startups activas" ON startups;
DROP POLICY IF EXISTS "Admins tienen acceso total a startups" ON startups;

-- Ver startups activas (público)
CREATE POLICY "public_view_active_startups" ON startups
  FOR SELECT
  USING (is_active = true AND status = 'approved');

-- Admins/editores ven TODAS (incluidas inactivas)
CREATE POLICY "admins_editors_view_all_startups" ON startups
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

-- Solo admins pueden crear/actualizar/eliminar
CREATE POLICY "admins_manage_startups" ON startups
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- 3. POLÍTICAS SIMILARES PARA EVENTS, COMMUNITIES, etc.
-- ============================================

-- EVENTS
DROP POLICY IF EXISTS "Todos pueden ver eventos activos" ON events;
DROP POLICY IF EXISTS "Admins tienen acceso total a events" ON events;

CREATE POLICY "public_view_active_events" ON events
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "admins_manage_events" ON events
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- COMMUNITIES
DROP POLICY IF EXISTS "Todos pueden ver comunidades activas" ON communities;

CREATE POLICY "public_view_active_communities" ON communities
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "admins_manage_communities" ON communities
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- REFERENTS
-- Ya tienen políticas, solo mejorarlas
DROP POLICY IF EXISTS "Todos pueden ver referentes activos" ON referents;
DROP POLICY IF EXISTS "Admins tienen acceso total a referents" ON referents;

CREATE POLICY "public_view_active_referents" ON referents
  FOR SELECT
  USING (is_active = true);

CREATE POLICY "admins_manage_referents" ON referents
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- 4. POLÍTICAS PARA NOTIFICATIONS
-- ============================================

DROP POLICY IF EXISTS "Usuarios solo ven sus propias notificaciones" ON notifications;
DROP POLICY IF EXISTS "Sistema puede crear notificaciones" ON notifications;
DROP POLICY IF EXISTS "Usuarios pueden marcar sus notificaciones como leídas" ON notifications;

-- Ver solo propias notificaciones
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Actualizar solo propias notificaciones (marcar como leídas)
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_read = true  -- Solo pueden marcar como leídas
    AND read_at IS NOT NULL
  );

-- Las notificaciones se crean vía trigger, no directamente por usuarios
-- Solo el sistema (service_role) puede insertar
CREATE POLICY "system_insert_notifications" ON notifications
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 5. POLÍTICAS PARA ACTIVITY_LOG
-- ============================================

DROP POLICY IF EXISTS "Solo admins pueden ver el log de actividad" ON activity_log;
DROP POLICY IF EXISTS "Sistema puede insertar en activity_log" ON activity_log;

-- Solo admins ven el log
CREATE POLICY "admins_view_activity_log" ON activity_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- Solo sistema inserta en el log
CREATE POLICY "system_insert_activity_log" ON activity_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================
-- 6. POLÍTICAS PARA PROFILES
-- ============================================

DROP POLICY IF EXISTS "Usuarios pueden ver todos los perfiles" ON profiles;
DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON profiles;

-- Todos pueden ver perfiles activos (público)
CREATE POLICY "public_view_active_profiles" ON profiles
  FOR SELECT
  USING (is_active = true);

-- Usuarios pueden actualizar SOLO su perfil
CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (
    id = auth.uid()
    -- NO pueden cambiar su propio role
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
  );

-- Solo admins pueden cambiar roles
CREATE POLICY "admins_manage_user_roles" ON profiles
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- 7. FUNCIÓN DE VALIDACIÓN DE DATOS
-- ============================================

-- Función para validar content_data antes de insertar propuesta
CREATE OR REPLACE FUNCTION validate_proposal_content()
RETURNS TRIGGER AS $$
BEGIN
  -- Validar que content_data sea un objeto JSON válido
  IF jsonb_typeof(NEW.content_data) != 'object' THEN
    RAISE EXCEPTION 'content_data debe ser un objeto JSON válido';
  END IF;

  -- Validar campos requeridos según tipo de contenido
  CASE NEW.content_type
    WHEN 'startup' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN
        RAISE EXCEPTION 'Startup debe tener name y description';
      END IF;

    WHEN 'event' THEN
      IF NOT (NEW.content_data ? 'title' AND NEW.content_data ? 'start_date') THEN
        RAISE EXCEPTION 'Event debe tener title y start_date';
      END IF;

    WHEN 'community' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN
        RAISE EXCEPTION 'Community debe tener name y description';
      END IF;

    WHEN 'referent' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'category') THEN
        RAISE EXCEPTION 'Referent debe tener name y category';
      END IF;

    WHEN 'course' THEN
      IF NOT (NEW.content_data ? 'title' AND NEW.content_data ? 'description') THEN
        RAISE EXCEPTION 'Course debe tener title y description';
      END IF;

    ELSE
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger de validación
DROP TRIGGER IF EXISTS validate_proposal_content_trigger ON proposals;
CREATE TRIGGER validate_proposal_content_trigger
  BEFORE INSERT OR UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION validate_proposal_content();

-- ============================================
-- 8. PREVENIR ESCALACIÓN DE PRIVILEGIOS
-- ============================================

-- Función para prevenir que usuarios cambien su propio rol
CREATE OR REPLACE FUNCTION prevent_role_self_escalation()
RETURNS TRIGGER AS $$
BEGIN
  -- Si el usuario intenta cambiar su propio rol y no es admin
  IF NEW.id = auth.uid() AND NEW.role != OLD.role THEN
    -- Verificar si el usuario es admin
    IF NOT EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    ) THEN
      RAISE EXCEPTION 'No puedes cambiar tu propio rol';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS prevent_role_self_escalation_trigger ON profiles;
CREATE TRIGGER prevent_role_self_escalation_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION prevent_role_self_escalation();

-- ============================================
-- 9. LOGGING DE ACCIONES ADMINISTRATIVAS
-- ============================================

-- Función para registrar acciones de aprobación/rechazo
CREATE OR REPLACE FUNCTION log_proposal_decision()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO activity_log (
      user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      NEW.status,
      NEW.content_type,
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'reviewed_by', NEW.reviewed_by,
        'review_notes', NEW.review_notes
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS log_proposal_decision_trigger ON proposals;
CREATE TRIGGER log_proposal_decision_trigger
  AFTER UPDATE ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION log_proposal_decision();

-- ============================================
-- ✅ VERIFICACIÓN DE SEGURIDAD
-- ============================================

-- Verificar que todas las tablas tienen RLS habilitado
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅' ELSE '❌ FALTA RLS' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'proposals', 'startups', 'events',
    'communities', 'referents', 'courses', 'blog_posts',
    'notifications', 'activity_log'
  )
ORDER BY tablename;
