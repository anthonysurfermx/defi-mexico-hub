-- ============================================
-- AUDITORÍA DE SEGURIDAD - DeFi Mexico Hub
-- ============================================

-- ============================================
-- 1. VERIFICAR RLS HABILITADO EN TODAS LAS TABLAS
-- ============================================

SELECT
  schemaname,
  tablename,
  CASE WHEN rowsecurity THEN '✅ Habilitado' ELSE '❌ DESHABILITADO' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles', 'proposals', 'startups', 'events', 'communities',
    'referents', 'courses', 'blog_posts', 'defi_advocates',
    'notifications', 'activity_log'
  )
ORDER BY tablename;

-- ============================================
-- 2. LISTAR TODAS LAS POLICIES ACTIVAS
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================
-- 3. VERIFICAR POLÍTICAS CRÍTICAS DE PROPUESTAS
-- ============================================

-- Debe haber políticas para:
-- - Ver propias propuestas
-- - Admins/editores ven todas
-- - Crear propuestas
-- - Aprobar/rechazar (solo admin)

SELECT
  policyname,
  cmd as command,
  CASE
    WHEN policyname LIKE '%propias%' THEN 'Usuarios ven sus propuestas'
    WHEN policyname LIKE '%admins%editor%' THEN 'Admins/editores acceso total'
    WHEN policyname LIKE '%crear%' THEN 'Crear propuestas'
    WHEN policyname LIKE '%aprobar%' THEN 'Aprobar/rechazar (solo admin)'
    ELSE 'Otra'
  END as purpose
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'proposals'
ORDER BY policyname;

-- ============================================
-- 4. VERIFICAR FUNCIONES Y TRIGGERS DE SEGURIDAD
-- ============================================

-- Ver triggers de notificación
SELECT
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%notify%'
ORDER BY event_object_table;

-- Ver funciones relacionadas con seguridad
SELECT
  routine_name,
  routine_type,
  security_type,
  is_deterministic
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%notify%'
    OR routine_name LIKE '%update%'
    OR routine_name LIKE '%security%'
  )
ORDER BY routine_name;
