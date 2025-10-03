-- ============================================
-- PRUEBA DE PERMISOS PARA EDITOR
-- Usuario: anthonysurfermx@gmail.com
-- ============================================

-- 1. VERIFICAR SI EL USUARIO EXISTE EN AUTH.USERS
SELECT
    id,
    email,
    raw_user_meta_data->>'role' as role,
    created_at
FROM auth.users
WHERE email = 'anthonysurfermx@gmail.com';

-- 2. VER EL ID DEL USUARIO (necesario para las políticas)
-- Guarda este ID para usarlo en las siguientes consultas
SELECT id FROM auth.users WHERE email = 'anthonysurfermx@gmail.com';

-- 3. ASIGNAR ROL DE EDITOR AL USUARIO (si no lo tiene)
-- IMPORTANTE: Reemplaza 'USER_ID_AQUI' con el ID obtenido en el paso 2
UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "editor"}'::jsonb
WHERE email = 'anthonysurfermx@gmail.com';

-- 4. VERIFICAR QUE EL ROL SE ASIGNÓ CORRECTAMENTE
SELECT
    email,
    raw_user_meta_data->>'role' as role
FROM auth.users
WHERE email = 'anthonysurfermx@gmail.com';

-- ============================================
-- 5. CONFIGURAR POLÍTICAS RLS SIMPLES PARA PRUEBA
-- ============================================

-- Primero, deshabilitar RLS temporalmente para configurar
ALTER TABLE blog_posts DISABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes
DROP POLICY IF EXISTS "Anyone can view published posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can view all posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can create posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can update posts" ON blog_posts;
DROP POLICY IF EXISTS "Authenticated can delete posts" ON blog_posts;

-- Habilitar RLS
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS SIMPLES PARA PRUEBA
-- Permite que TODOS los usuarios autenticados hagan TODO

-- Ver todos los posts
CREATE POLICY "Authenticated users can view all posts"
ON blog_posts
FOR SELECT
TO authenticated
USING (true);

-- Crear posts
CREATE POLICY "Authenticated users can create posts"
ON blog_posts
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Actualizar posts
CREATE POLICY "Authenticated users can update posts"
ON blog_posts
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Eliminar posts
CREATE POLICY "Authenticated users can delete posts"
ON blog_posts
FOR DELETE
TO authenticated
USING (true);

-- Política pública para ver posts publicados
CREATE POLICY "Public can view published posts"
ON blog_posts
FOR SELECT
TO anon
USING (status = 'published');

-- ============================================
-- 6. CREAR UN POST DE PRUEBA PARA EL EDITOR
-- ============================================
INSERT INTO blog_posts (
    id,
    title,
    slug,
    content,
    excerpt,
    status,
    author,
    author_id,
    category,
    tags,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'Post de Prueba - Editor Anthony',
    'post-prueba-editor-anthony',
    'Este es un post de prueba creado para verificar los permisos del editor.',
    'Post de prueba para verificar permisos',
    'draft',
    'anthonysurfermx@gmail.com',
    (SELECT id FROM auth.users WHERE email = 'anthonysurfermx@gmail.com'),
    'tecnologia',
    ARRAY['prueba', 'editor'],
    NOW(),
    NOW()
)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- 7. VERIFICAR QUE TODO FUNCIONA
-- ============================================

-- Ver posts del editor
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
WHERE author = 'anthonysurfermx@gmail.com'
ORDER BY created_at DESC;

-- Ver todos los posts (para verificar que el editor puede verlos)
SELECT
    id,
    title,
    status,
    author
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;

-- Contar posts por estado
SELECT
    status,
    COUNT(*) as total
FROM blog_posts
GROUP BY status
ORDER BY status;

-- ============================================
-- 8. VERIFICAR POLÍTICAS APLICADAS
-- ============================================
SELECT
    polname as policy_name,
    CASE polcmd
        WHEN 'r' THEN 'SELECT'
        WHEN 'a' THEN 'INSERT'
        WHEN 'w' THEN 'UPDATE'
        WHEN 'd' THEN 'DELETE'
        ELSE polcmd::text
    END as operation
FROM pg_policy pol
JOIN pg_class pc ON pol.polrelid = pc.oid
WHERE pc.relname = 'blog_posts'
ORDER BY polcmd;

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script configura permisos muy abiertos para pruebas
-- 2. Cualquier usuario autenticado puede crear/editar/eliminar posts
-- 3. El usuario anthonysurfermx@gmail.com debería poder:
--    - Crear nuevos posts
--    - Editar cualquier post
--    - Cambiar el estado a 'review' para enviar a revisión
-- 4. Si algo falla, revisa la consola del navegador para ver errores