-- ============================================
-- BUSCAR EL POST PERDIDO
-- ============================================

-- 1. VER TODOS LOS POSTS (sin importar el estado)
SELECT
    id,
    title,
    status,
    author,
    author_id,
    created_at
FROM blog_posts
ORDER BY created_at DESC
LIMIT 20;

-- 2. BUSCAR POR CUALQUIER PALABRA CLAVE DEL TÍTULO
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
WHERE LOWER(title) LIKE '%ap2%'
   OR LOWER(title) LIKE '%protocolo%'
   OR LOWER(title) LIKE '%pagos%'
   OR LOWER(title) LIKE '%google%'
   OR LOWER(title) LIKE '%ai%'
   OR LOWER(title) LIKE '%transacciones%';

-- 3. VER ESPECÍFICAMENTE POSTS CON STATUS = 'review'
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
WHERE status = 'review';

-- 4. VER POSTS CREADOS HOY O RECIENTEMENTE
SELECT
    id,
    title,
    status,
    author,
    created_at
FROM blog_posts
WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY created_at DESC;

-- 5. BUSCAR POR AUTOR (con variaciones del email)
SELECT
    id,
    title,
    status,
    author,
    author_id,
    created_at
FROM blog_posts
WHERE author LIKE '%danielcervantes%'
   OR author LIKE '%daniel%'
   OR author = 'danielcervantes2k4@gmail.com';

-- 6. VER TODOS LOS VALORES ÚNICOS DE STATUS QUE EXISTEN
SELECT DISTINCT
    status,
    COUNT(*) as cantidad
FROM blog_posts
GROUP BY status
ORDER BY status;

-- 7. VERIFICAR SI HAY POSTS CON AUTHOR_ID ESPECÍFICO
-- (en caso de que se haya guardado por ID en lugar de email)
SELECT
    id,
    title,
    status,
    author,
    author_id
FROM blog_posts
WHERE author_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;