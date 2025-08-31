-- Script para solucionar políticas RLS de la tabla courses
-- Ejecutar este script en el SQL Editor de Supabase

-- Eliminar políticas existentes que pueden estar causando problemas
DROP POLICY IF EXISTS "Cursos publicados son visibles para todos" ON courses;
DROP POLICY IF EXISTS "Administradores tienen acceso completo a cursos" ON courses;

-- Política simple para lectura - permite ver todos los cursos
CREATE POLICY "Permitir lectura de todos los cursos" ON courses
  FOR SELECT
  USING (true);

-- Política para inserción - permite a cualquier usuario autenticado crear cursos
-- (En producción, esto debería ser más restrictivo)
CREATE POLICY "Permitir inserción de cursos" ON courses
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Política para actualización - permite a cualquier usuario autenticado actualizar
-- (En producción, esto debería ser más restrictivo)
CREATE POLICY "Permitir actualización de cursos" ON courses
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Política para eliminación - permite a cualquier usuario autenticado eliminar
-- (En producción, esto debería ser más restrictivo)
CREATE POLICY "Permitir eliminación de cursos" ON courses
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Verificar que las políticas se crearon correctamente
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE tablename = 'courses';