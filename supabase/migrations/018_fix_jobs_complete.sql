-- =============================================
-- Migración: 018_fix_jobs_complete.sql
-- Descripción: Script completo para corregir
--              el enum content_type y las políticas RLS de jobs
-- =============================================

-- =============================================
-- PARTE 1: Agregar 'job' al enum content_type
-- =============================================

-- Agregar 'job' al enum content_type
-- Nota: Si 'job' ya existe, esto fallará con un error que podemos ignorar
DO $$
BEGIN
  -- Verificar si 'job' ya existe en el enum
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_enum 
    WHERE enumtypid = 'content_type'::regtype 
    AND enumlabel = 'job'
  ) THEN
    -- Agregar 'job' al enum
    ALTER TYPE content_type ADD VALUE 'job';
    RAISE NOTICE '✅ Valor ''job'' agregado al enum content_type';
  ELSE
    RAISE NOTICE 'ℹ️  El valor ''job'' ya existe en el enum content_type';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Si hay algún error, intentamos de todas formas
    RAISE WARNING 'Error al agregar ''job'' al enum: %', SQLERRM;
    -- Intentamos agregar de todas formas (puede que funcione)
    BEGIN
      ALTER TYPE content_type ADD VALUE 'job';
    EXCEPTION
      WHEN duplicate_object THEN
        RAISE NOTICE 'El valor ''job'' ya existe (verificado por excepción)';
    END;
END $$;

-- =============================================
-- PARTE 2: Corregir políticas RLS de jobs
-- =============================================

-- Eliminar todas las políticas existentes de jobs
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
DROP POLICY IF EXISTS "Public can view published jobs" ON public.jobs;

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
  )
  WITH CHECK (
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

-- =============================================
-- Verificación final
-- =============================================

-- Verificar que el enum tiene 'job'
DO $$
DECLARE
  enum_values TEXT[];
BEGIN
  SELECT array_agg(enumlabel::text ORDER BY enumsortorder)
  INTO enum_values
  FROM pg_enum
  WHERE enumtypid = 'content_type'::regtype;
  
  IF 'job' = ANY(enum_values) THEN
    RAISE NOTICE '✅ El enum content_type incluye ''job''';
  ELSE
    RAISE WARNING '❌ El enum content_type NO incluye ''job''';
  END IF;
END $$;

-- Verificar que las políticas existen
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'jobs';
  
  RAISE NOTICE '✅ Políticas RLS en jobs: %', policy_count;
  
  IF policy_count < 5 THEN
    RAISE WARNING '❌ Se esperaban al menos 5 políticas, pero solo hay %', policy_count;
  END IF;
END $$;

