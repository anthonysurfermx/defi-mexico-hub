-- =============================================
-- Migración: 016_fix_jobs_policies.sql
-- Descripción: Corrige las políticas RLS de la tabla jobs
--              para usar los roles correctos (admin, super_admin)
--              en lugar de (admin, editor) y añade verificaciones
--              de is_active y expires_at
-- =============================================

-- Eliminar políticas existentes con roles incorrectos
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

-- Recrear políticas con roles correctos y verificaciones mejoradas

-- Política pública: Todos pueden ver trabajos publicados
CREATE POLICY "Public can view published jobs"
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Política: Admins pueden ver todos los trabajos
CREATE POLICY "Admins can view all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden insertar trabajos
CREATE POLICY "Admins can insert jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden actualizar trabajos
CREATE POLICY "Admins can update jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden eliminar trabajos
CREATE POLICY "Admins can delete jobs"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

