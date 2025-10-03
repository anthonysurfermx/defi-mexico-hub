-- ============================================
-- FIX RÁPIDO: Deshabilitar RLS en blog_posts
-- ============================================
-- Este script deshabilita temporalmente RLS para que
-- puedas ver todos los posts sin restricciones mientras
-- configuras las políticas correctamente

-- Deshabilitar RLS en la tabla blog_posts
ALTER TABLE public.blog_posts DISABLE ROW LEVEL SECURITY;

-- Verificar que RLS está deshabilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'blog_posts';

-- Verificar posts con estado 'review'
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM public.blog_posts
WHERE status = 'review'
ORDER BY created_at DESC;

-- ============================================
-- ALTERNATIVA: Política simple sin restricciones
-- ============================================
-- Si prefieres mantener RLS habilitado pero con acceso completo:

-- ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
--
-- DROP POLICY IF EXISTS "Allow all access to blog_posts" ON public.blog_posts;
--
-- CREATE POLICY "Allow all access to blog_posts" ON public.blog_posts
--     FOR ALL
--     TO public
--     USING (true)
--     WITH CHECK (true);