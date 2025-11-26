-- ============================================
-- VERIFICAR COLUMNAS DE CONTROL EN CADA TABLA
-- ============================================

-- Ver columnas de STARTUPS
SELECT 'STARTUPS' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'startups'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver columnas de EVENTS
SELECT 'EVENTS' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'events'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver columnas de COMMUNITIES
SELECT 'COMMUNITIES' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'communities'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver columnas de COURSES
SELECT 'COURSES' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'courses'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver columnas de BLOG_POSTS
SELECT 'BLOG_POSTS' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'blog_posts'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver columnas de DEFI_ADVOCATES
SELECT 'DEFI_ADVOCATES' as table_name, column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'defi_advocates'
  AND column_name IN ('status', 'is_active', 'is_featured', 'verification_status', 'suspension_reason')
ORDER BY column_name;

-- Ver TODAS las columnas de cada tabla
SELECT
  table_name,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('startups', 'events', 'communities', 'courses', 'blog_posts', 'defi_advocates')
ORDER BY table_name, ordinal_position;
