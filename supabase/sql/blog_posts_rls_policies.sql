-- ============================================
-- POLÍTICAS RLS PARA BLOG POSTS
-- ============================================
-- Este archivo configura las políticas de seguridad a nivel de fila (RLS)
-- para la tabla blog_posts, permitiendo diferentes niveles de acceso según el rol

-- Primero, deshabilitamos temporalmente RLS para aplicar cambios
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- Eliminamos políticas existentes si las hay
DROP POLICY IF EXISTS "Public can view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authenticated users can view published posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can view all posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Moderators can view draft and review posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can view their own posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can insert posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can update any post" ON public.blog_posts;
DROP POLICY IF EXISTS "Moderators can update posts" ON public.blog_posts;
DROP POLICY IF EXISTS "Authors can update their own drafts" ON public.blog_posts;
DROP POLICY IF EXISTS "Admins can delete posts" ON public.blog_posts;

-- Habilitamos RLS en la tabla
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- ============================================
-- POLÍTICAS DE LECTURA (SELECT)
-- ============================================

-- 1. PÚBLICO: Puede ver solo posts publicados
CREATE POLICY "Public can view published posts" ON public.blog_posts
    FOR SELECT
    TO public
    USING (status = 'published');

-- 2. USUARIOS AUTENTICADOS: Pueden ver posts publicados (redundante pero explícito)
CREATE POLICY "Authenticated users can view published posts" ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (status = 'published');

-- 3. ADMINISTRADORES: Pueden ver TODOS los posts (draft, review, published, etc.)
CREATE POLICY "Admins can view all posts" ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND (
                raw_user_meta_data ->> 'role' = 'admin' OR
                raw_user_meta_data ->> 'role' = 'super_admin'
            )
        )
    );

-- 4. MODERADORES/EDITORES: Pueden ver posts en draft, review y published
CREATE POLICY "Moderators can view draft and review posts" ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (
        status IN ('published', 'draft', 'review') AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('moderator', 'editor')
        )
    );

-- 5. AUTORES: Pueden ver sus propios posts (cualquier estado)
CREATE POLICY "Authors can view their own posts" ON public.blog_posts
    FOR SELECT
    TO authenticated
    USING (
        author_id = auth.uid() OR
        author = (SELECT email FROM auth.users WHERE id = auth.uid())
    );

-- ============================================
-- POLÍTICAS DE INSERCIÓN (INSERT)
-- ============================================

-- 6. ADMINISTRADORES: Pueden crear posts
CREATE POLICY "Admins can insert posts" ON public.blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- 7. MODERADORES/EDITORES: Pueden crear posts (pero solo como draft o review)
CREATE POLICY "Moderators can insert draft posts" ON public.blog_posts
    FOR INSERT
    TO authenticated
    WITH CHECK (
        status IN ('draft', 'review') AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('moderator', 'editor')
        )
    );

-- ============================================
-- POLÍTICAS DE ACTUALIZACIÓN (UPDATE)
-- ============================================

-- 8. ADMINISTRADORES: Pueden actualizar cualquier post
CREATE POLICY "Admins can update any post" ON public.blog_posts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- 9. MODERADORES/EDITORES: Pueden actualizar posts pero no publicar directamente
CREATE POLICY "Moderators can update posts" ON public.blog_posts
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('moderator', 'editor')
        )
    )
    WITH CHECK (
        -- No pueden cambiar a published directamente, solo a review
        (status != 'published' OR status IS NULL) AND
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('moderator', 'editor')
        )
    );

-- 10. AUTORES: Pueden actualizar sus propios posts en draft
CREATE POLICY "Authors can update their own drafts" ON public.blog_posts
    FOR UPDATE
    TO authenticated
    USING (
        status = 'draft' AND
        (author_id = auth.uid() OR author = (SELECT email FROM auth.users WHERE id = auth.uid()))
    )
    WITH CHECK (
        status = 'draft' AND
        (author_id = auth.uid() OR author = (SELECT email FROM auth.users WHERE id = auth.uid()))
    );

-- ============================================
-- POLÍTICAS DE ELIMINACIÓN (DELETE)
-- ============================================

-- 11. SOLO ADMINISTRADORES pueden eliminar posts
CREATE POLICY "Admins can delete posts" ON public.blog_posts
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.uid() = id
            AND raw_user_meta_data ->> 'role' IN ('admin', 'super_admin')
        )
    );

-- ============================================
-- POLÍTICAS ESPECIALES PARA BYPASS TOTAL
-- ============================================

-- POLÍTICA DE BYPASS: Para service_role (bypass completo del RLS)
-- El service_role ya tiene bypass automático de RLS, pero lo documentamos aquí
-- NOTA: service_role bypasses RLS by default in Supabase

-- ============================================
-- VERIFICACIÓN Y DEBUGGING
-- ============================================

-- Query para verificar las políticas aplicadas:
-- SELECT * FROM pg_policies WHERE tablename = 'blog_posts';

-- Query para verificar el estado de RLS:
-- SELECT relname, relrowsecurity FROM pg_class WHERE relname = 'blog_posts';

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Los roles deben estar definidos en user_meta_data de Supabase Auth
-- 2. El campo 'status' debe contener: 'draft', 'review', 'published', etc.
-- 3. Para que un editor envíe a revisión, debe cambiar status a 'review'
-- 4. Solo admins pueden cambiar status de 'review' a 'published'
-- 5. Si no hay políticas que apliquen, el acceso será DENEGADO por defecto