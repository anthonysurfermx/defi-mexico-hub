-- ============================================
-- SOLUCIÓN: PERMITIR AUTOGESTIÓN DE POSTS POR EDITORES
-- ============================================
-- Este script configura las políticas RLS para que los editores
-- puedan crear y gestionar posts de forma autónoma

-- PASO 1: VERIFICAR ESTADO ACTUAL DE RLS
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts';

-- PASO 2: VER POLÍTICAS ACTUALES
SELECT
    polname as policy_name,
    polcmd as command,
    roles.rolname as role_name,
    qual as using_clause,
    with_check
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
JOIN pg_roles roles ON pol.polroles @> ARRAY[roles.oid]
WHERE pc.relname = 'blog_posts';

-- ============================================
-- PASO 3: ELIMINAR POLÍTICAS CONFLICTIVAS (SI EXISTEN)
-- ============================================
DROP POLICY IF EXISTS "Public can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated users can update own posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can insert posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Users can view posts" ON blog_posts;

-- ============================================
-- PASO 4: HABILITAR RLS
-- ============================================
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PASO 5: CREAR POLÍTICAS NECESARIAS
-- ============================================

-- 1. LECTURA: Todos pueden ver posts publicados
CREATE POLICY "Anyone can view published posts"
ON blog_posts
FOR SELECT
USING (status = 'published');

-- 2. LECTURA: Usuarios autenticados pueden ver TODOS los posts (draft, review, published)
-- Esto permite que tanto admins como editores vean los posts en revisión
CREATE POLICY "Authenticated can view all posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (true);

-- 3. INSERCIÓN: Usuarios autenticados pueden crear posts
-- Los editores pueden crear posts con estado 'draft' o 'review'
CREATE POLICY "Authenticated can create posts"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() IS NOT NULL
    AND (
        status IN ('draft', 'review', 'published')
        OR status IS NULL
    )
);

-- 4. ACTUALIZACIÓN: Usuarios autenticados pueden actualizar cualquier post
-- Esto permite que editores y admins actualicen posts
CREATE POLICY "Authenticated can update posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- 5. ELIMINACIÓN: Usuarios autenticados pueden eliminar posts
CREATE POLICY "Authenticated can delete posts"
ON blog_posts
FOR DELETE
TO authenticated
USING (auth.uid() IS NOT NULL);

-- ============================================
-- PASO 6: VERIFICAR QUE LAS POLÍTICAS SE CREARON
-- ============================================
SELECT
    polname as policy_name,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
    END as operation
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'blog_posts'
ORDER BY polcmd;

-- ============================================
-- PASO 7: PRUEBA - Verificar que funciona
-- ============================================
-- Intenta ver todos los posts
SELECT id, title, status, author FROM blog_posts LIMIT 5;

-- ============================================
-- ALTERNATIVA SIMPLE: DESHABILITAR RLS COMPLETAMENTE
-- ============================================
-- Si prefieres una solución más simple sin restricciones:
-- ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Con estas políticas, cualquier usuario autenticado puede:
--    - Ver TODOS los posts (draft, review, published)
--    - Crear nuevos posts con cualquier estado
--    - Editar cualquier post
--    - Eliminar posts
--
-- 2. Los usuarios no autenticados solo pueden ver posts publicados
--
-- 3. Si necesitas más control granular por roles, necesitarás
--    implementar un sistema de roles más complejo usando user_metadata