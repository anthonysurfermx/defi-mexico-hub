-- ============================================
-- POLÍTICAS DE SEGURIDAD FINALES (CORRECTAS)
-- Adaptado a las columnas reales de cada tabla
-- ============================================

-- ============================================
-- 1. STARTUPS
-- Tiene: status, verification_status, is_featured
-- ============================================

DROP POLICY IF EXISTS "Todos pueden ver startups activas" ON startups;
DROP POLICY IF EXISTS "Admins tienen acceso total a startups" ON startups;
DROP POLICY IF EXISTS "public_view_active_startups" ON startups;
DROP POLICY IF EXISTS "public_view_approved_startups" ON startups;
DROP POLICY IF EXISTS "admins_editors_view_all_startups" ON startups;
DROP POLICY IF EXISTS "admins_manage_startups" ON startups;

-- Público: ver startups aprobadas y verificadas
CREATE POLICY "public_view_verified_startups" ON startups
  FOR SELECT
  USING (
    status = 'approved'
    AND verification_status = 'verified'
  );

-- Admins/editores ven TODAS
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

-- Solo admins pueden gestionar
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
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role = 'admin'
        AND is_active = true
    )
  );

-- ============================================
-- 2. EVENTS
-- Tiene: status, is_featured
-- ============================================

DROP POLICY IF EXISTS "Todos pueden ver eventos activos" ON events;
DROP POLICY IF EXISTS "Admins tienen acceso total a events" ON events;
DROP POLICY IF EXISTS "public_view_active_events" ON events;
DROP POLICY IF EXISTS "public_view_approved_events" ON events;
DROP POLICY IF EXISTS "admins_editors_view_all_events" ON events;
DROP POLICY IF EXISTS "admins_manage_events" ON events;

-- Público: ver eventos aprobados
CREATE POLICY "public_view_approved_events" ON events
  FOR SELECT
  USING (status = 'approved');

-- Admins/editores ven todos
CREATE POLICY "admins_editors_view_all_events" ON events
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

-- Solo admins gestionan
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

-- ============================================
-- 3. COMMUNITIES
-- Tiene: is_verified, is_featured (NO tiene status)
-- ============================================

DROP POLICY IF EXISTS "Todos pueden ver comunidades activas" ON communities;
DROP POLICY IF EXISTS "public_view_active_communities" ON communities;
DROP POLICY IF EXISTS "public_view_approved_communities" ON communities;
DROP POLICY IF EXISTS "admins_editors_view_all_communities" ON communities;
DROP POLICY IF EXISTS "admins_manage_communities" ON communities;

-- Público: ver comunidades verificadas
CREATE POLICY "public_view_verified_communities" ON communities
  FOR SELECT
  USING (is_verified = true);

-- Admins/editores ven todas
CREATE POLICY "admins_editors_view_all_communities" ON communities
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

-- Solo admins gestionan
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

-- ============================================
-- 4. COURSES
-- Tiene: status, featured
-- ============================================

DROP POLICY IF EXISTS "public_view_active_courses" ON courses;
DROP POLICY IF EXISTS "admins_editors_view_all_courses" ON courses;
DROP POLICY IF EXISTS "admins_manage_courses" ON courses;

-- Público: ver cursos aprobados
CREATE POLICY "public_view_approved_courses" ON courses
  FOR SELECT
  USING (status = 'approved');

-- Admins/editores ven todos
CREATE POLICY "admins_editors_view_all_courses" ON courses
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

-- Solo admins gestionan
CREATE POLICY "admins_manage_courses" ON courses
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
-- 5. BLOG_POSTS
-- Tiene: status, is_featured
-- ============================================

DROP POLICY IF EXISTS "public_view_published_posts" ON blog_posts;
DROP POLICY IF EXISTS "admins_editors_view_all_posts" ON blog_posts;
DROP POLICY IF EXISTS "admins_editors_manage_posts" ON blog_posts;

-- Público: ver posts publicados
CREATE POLICY "public_view_published_posts" ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- Admins/editores ven todos
CREATE POLICY "admins_editors_view_all_posts" ON blog_posts
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

-- Admins/editores pueden gestionar posts
CREATE POLICY "admins_editors_manage_posts" ON blog_posts
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND role IN ('admin', 'editor')
        AND is_active = true
    )
  );

-- ============================================
-- 6. DEFI_ADVOCATES
-- Tiene: is_active, is_featured
-- ============================================

DROP POLICY IF EXISTS "public_view_active_advocates" ON defi_advocates;
DROP POLICY IF EXISTS "admins_editors_view_all_advocates" ON defi_advocates;
DROP POLICY IF EXISTS "admins_manage_advocates" ON defi_advocates;

-- Público: ver advocates activos
CREATE POLICY "public_view_active_advocates" ON defi_advocates
  FOR SELECT
  USING (is_active = true);

-- Admins/editores ven todos
CREATE POLICY "admins_editors_view_all_advocates" ON defi_advocates
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

-- Solo admins gestionan
CREATE POLICY "admins_manage_advocates" ON defi_advocates
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
-- 7. REFERENTS
-- Tiene: is_active
-- ============================================

DROP POLICY IF EXISTS "Todos pueden ver referentes activos" ON referents;
DROP POLICY IF EXISTS "Admins tienen acceso total a referents" ON referents;
DROP POLICY IF EXISTS "public_view_active_referents" ON referents;
DROP POLICY IF EXISTS "admins_editors_view_all_referents" ON referents;
DROP POLICY IF EXISTS "admins_manage_referents" ON referents;

-- Público: ver referentes activos
CREATE POLICY "public_view_active_referents" ON referents
  FOR SELECT
  USING (is_active = true);

-- Admins/editores ven todos
CREATE POLICY "admins_editors_view_all_referents" ON referents
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

-- Solo admins gestionan
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
-- ✅ VERIFICACIÓN
-- ============================================

-- Ver políticas creadas
SELECT
  tablename,
  COUNT(*) as num_policies,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'startups', 'events', 'communities', 'courses',
    'blog_posts', 'defi_advocates', 'referents'
  )
GROUP BY tablename
ORDER BY tablename;

-- Verificar RLS habilitado
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'startups', 'events', 'communities', 'courses',
    'blog_posts', 'defi_advocates', 'referents'
  )
ORDER BY tablename;
