-- =============================================
-- Migración: 019_create_proposals_table.sql
-- Descripción: Crea la tabla proposals con políticas RLS
--              para el sistema de propuestas de contenido
-- =============================================

-- Crear la tabla proposals si no existe
CREATE TABLE IF NOT EXISTS public.proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Tipo de contenido (usa el enum content_type existente)
  content_type content_type NOT NULL,

  -- Estado de la propuesta (usa el enum proposal_status existente)
  status proposal_status NOT NULL DEFAULT 'pending',

  -- Usuario que propuso (nullable para permitir propuestas del sistema)
  proposed_by UUID REFERENCES auth.users(id),

  -- Revisor (admin que aprobó/rechazó)
  reviewed_by UUID REFERENCES auth.users(id),

  -- Datos del contenido (JSON flexible)
  content_data JSONB NOT NULL DEFAULT '{}',

  -- Notas de revisión
  review_notes TEXT,

  -- Timestamps
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);
CREATE INDEX IF NOT EXISTS idx_proposals_content_type ON public.proposals(content_type);
CREATE INDEX IF NOT EXISTS idx_proposals_proposed_by ON public.proposals(proposed_by);
CREATE INDEX IF NOT EXISTS idx_proposals_created_at ON public.proposals(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_proposals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_proposals_updated_at ON public.proposals;
CREATE TRIGGER trigger_proposals_updated_at
  BEFORE UPDATE ON public.proposals
  FOR EACH ROW
  EXECUTE FUNCTION update_proposals_updated_at();

-- =============================================
-- Políticas RLS (Row Level Security)
-- =============================================
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;

-- Eliminar políticas existentes si las hay (tanto las nuevas como las antiguas)
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can create proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can view all proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Admins can delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "users_view_own_proposals" ON public.proposals;
DROP POLICY IF EXISTS "authenticated_users_create_proposals" ON public.proposals;
DROP POLICY IF EXISTS "admins_editors_view_all_proposals" ON public.proposals;
DROP POLICY IF EXISTS "admins_approve_reject_proposals" ON public.proposals;
DROP POLICY IF EXISTS "users_update_own_pending_proposals" ON public.proposals;
DROP POLICY IF EXISTS "delete_own_pending_or_admin" ON public.proposals;
DROP POLICY IF EXISTS "allow_authenticated_select_proposals" ON public.proposals;

-- Política: Usuarios autenticados pueden ver sus propias propuestas
CREATE POLICY "Users can view own proposals"
  ON public.proposals
  FOR SELECT
  TO authenticated
  USING (proposed_by = auth.uid());

-- Política: Usuarios autenticados pueden crear propuestas
-- Permite que proposed_by sea null para propuestas del sistema
CREATE POLICY "Users can create proposals"
  ON public.proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    proposed_by IS NULL OR proposed_by = auth.uid()
  );

-- Política: Admins pueden ver TODAS las propuestas
CREATE POLICY "Admins can view all proposals"
  ON public.proposals
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

-- Política: Admins pueden actualizar propuestas (aprobar/rechazar)
CREATE POLICY "Admins can update proposals"
  ON public.proposals
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

-- Política: Admins pueden eliminar propuestas
CREATE POLICY "Admins can delete proposals"
  ON public.proposals
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
-- Verificación
-- =============================================
DO $$
DECLARE
  policy_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO policy_count
  FROM pg_policies
  WHERE tablename = 'proposals';

  RAISE NOTICE '✅ Políticas RLS en proposals: %', policy_count;
END $$;

-- Comentarios de documentación
COMMENT ON TABLE public.proposals IS 'Propuestas de contenido enviadas por usuarios para revisión';
COMMENT ON COLUMN public.proposals.content_type IS 'Tipo de contenido: startup, event, community, referent, blog, course, job';
COMMENT ON COLUMN public.proposals.status IS 'Estado: pending, approved, rejected, draft';
COMMENT ON COLUMN public.proposals.content_data IS 'Datos del contenido propuesto en formato JSON';
