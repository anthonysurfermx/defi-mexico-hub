-- ============================================
-- VERIFICAR POSTS EN REVISIÓN EN SUPABASE
-- ============================================
-- Ejecuta estas consultas en el SQL Editor de Supabase
-- para verificar si existen posts con estado 'review'

-- 1. VER TODOS LOS POSTS Y SUS ESTADOS
SELECT
    id,
    title,
    status,
    author,
    created_at,
    updated_at
FROM blog_posts
ORDER BY created_at DESC;

-- 2. BUSCAR ESPECÍFICAMENTE POSTS EN REVISIÓN
SELECT
    id,
    title,
    status,
    author,
    excerpt,
    created_at
FROM blog_posts
WHERE status = 'review'
ORDER BY created_at DESC;

-- 3. BUSCAR EL POST ESPECÍFICO POR TÍTULO
SELECT
    id,
    title,
    status,
    author,
    created_at,
    updated_at
FROM blog_posts
WHERE title LIKE '%AP2%'
   OR title LIKE '%protocolo de pagos%'
   OR title LIKE '%google%';

-- 4. BUSCAR POR EMAIL DEL EDITOR
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
WHERE author = 'danielcervantes2k4@gmail.com'
ORDER BY created_at DESC;

-- 5. CONTAR POSTS POR ESTADO
SELECT
    status,
    COUNT(*) as total
FROM blog_posts
GROUP BY status
ORDER BY status;

-- 6. VER LOS ÚLTIMOS 10 POSTS CREADOS
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 10;

-- 7. VERIFICAR SI HAY POSTS SIN ESTADO DEFINIDO
SELECT
    id,
    title,
    status,
    author
FROM blog_posts
WHERE status IS NULL
   OR status = '';

-- 8. VER ESTRUCTURA DE LA TABLA Y VERIFICAR VALORES POSIBLES
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'blog_posts'
  AND column_name IN ('status', 'author', 'author_id');

-- ============================================
-- SI EL POST NO EXISTE, PUEDES CREARLO MANUALMENTE
-- ============================================
-- Descomentar y ejecutar si necesitas crear el post manualmente:

/*
INSERT INTO blog_posts (
    title,
    slug,
    content,
    excerpt,
    status,
    author,
    author_id,
    created_at,
    updated_at
) VALUES (
    'AP2: El nuevo protocolo de pagos de google que redefine las transacciones con AI',
    'ap2-nuevo-protocolo-pagos-google-ai',
    'Contenido del artículo aquí...',
    'Google presenta AP2, su nuevo protocolo de pagos impulsado por inteligencia artificial...',
    'review',
    'danielcervantes2k4@gmail.com',
    '00000000-0000-0000-0000-000000000000',
    NOW(),
    NOW()
);
*/