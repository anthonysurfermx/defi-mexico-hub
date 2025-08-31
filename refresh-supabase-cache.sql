-- Script para refrescar el cache de esquema de Supabase
-- Ejecutar en Supabase SQL Editor

-- 1. Forzar actualización del esquema
NOTIFY pgrst, 'reload schema';

-- 2. Verificar que la columna existe y es accesible
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'courses' 
AND column_name = 'circle_url';

-- 3. Test de inserción para verificar que funciona
INSERT INTO courses (
  title, 
  description, 
  duration, 
  level, 
  category, 
  instructor, 
  students, 
  rating, 
  topics, 
  circle_url, 
  status, 
  featured
) VALUES (
  'Test Course - ' || NOW()::text,
  'Curso de prueba para verificar circle_url',
  '1h',
  'Principiante',
  'defi',
  'Test Instructor',
  0,
  4.0,
  ARRAY['test'],
  'https://circle.so/test-course',
  'draft',
  false
) RETURNING id, title, circle_url;

-- 4. Verificar que se insertó correctamente
SELECT id, title, circle_url 
FROM courses 
WHERE title LIKE 'Test Course%'
ORDER BY created_at DESC
LIMIT 1;

-- 5. Limpiar curso de prueba (opcional)
DELETE FROM courses 
WHERE title LIKE 'Test Course%';

-- 6. Verificar políticas RLS
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd
FROM pg_policies 
WHERE tablename = 'courses';

-- 7. Si las políticas están bloqueando, deshabilitar RLS temporalmente
-- ALTER TABLE courses DISABLE ROW LEVEL SECURITY;