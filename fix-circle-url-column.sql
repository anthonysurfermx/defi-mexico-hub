-- Script para verificar y agregar la columna circle_url
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar qué columnas existen actualmente
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'courses'
ORDER BY ordinal_position;

-- 2. Si circle_url no existe, agregarla
ALTER TABLE courses 
ADD COLUMN IF NOT EXISTS circle_url VARCHAR(500) NOT NULL DEFAULT 'https://circle.so/default';

-- 3. Si ya existe pero tiene otro tipo o restricciones, modificarla
-- (Solo ejecutar si necesitas cambiar el tipo)
-- ALTER TABLE courses 
-- ALTER COLUMN circle_url TYPE VARCHAR(500),
-- ALTER COLUMN circle_url SET NOT NULL;

-- 4. Actualizar cursos existentes si tienen circle_url vacío
UPDATE courses 
SET circle_url = 'https://circle.so/course-' || id
WHERE circle_url IS NULL OR circle_url = '' OR circle_url = 'https://circle.so/default';

-- 5. Verificar que la columna se agregó correctamente
SELECT id, title, circle_url 
FROM courses 
LIMIT 5;

-- 6. Refrescar el cache de esquema de Supabase
-- Esto es importante para que la API reconozca la nueva columna
NOTIFY pgrst, 'reload schema';