-- Arreglar políticas RLS para permitir acceso completo a la tabla courses
-- ⚠️ IMPORTANTE: Ejecutar este SQL en Supabase SQL Editor

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "Permitir lectura de todos los cursos" ON courses;
DROP POLICY IF EXISTS "Permitir inserción de cursos" ON courses;
DROP POLICY IF EXISTS "Permitir actualización de cursos" ON courses;
DROP POLICY IF EXISTS "Permitir eliminación de cursos" ON courses;
DROP POLICY IF EXISTS "Cursos publicados son visibles para todos" ON courses;
DROP POLICY IF EXISTS "Administradores tienen acceso completo a cursos" ON courses;

-- OPCIÓN 1: Deshabilitar RLS temporalmente para testing
-- (Descomenta esta línea si quieres deshabilitar RLS completamente)
-- ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- OPCIÓN 2: Políticas permisivas para desarrollo
-- Permitir lectura completa sin restricciones
CREATE POLICY "Permitir lectura completa de cursos" ON courses
  FOR SELECT
  TO public
  USING (true);

-- Permitir inserción sin restricciones
CREATE POLICY "Permitir inserción completa de cursos" ON courses
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Permitir actualización sin restricciones
CREATE POLICY "Permitir actualización completa de cursos" ON courses
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Permitir eliminación sin restricciones
CREATE POLICY "Permitir eliminación completa de cursos" ON courses
  FOR DELETE
  TO public
  USING (true);

-- Verificar que las políticas se aplicaron
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
WHERE tablename = 'courses'
ORDER BY policyname;

-- Test básico para verificar que funciona
SELECT COUNT(*) as total_cursos FROM courses;