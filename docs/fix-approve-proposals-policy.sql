-- Fix para permitir que admins aprueben/rechacen propuestas
-- Ejecutar en Supabase SQL Editor

-- 1. Eliminar la política restrictiva de UPDATE para usuarios regulares
DROP POLICY IF EXISTS "users_update_own_pending_proposals" ON proposals;

-- 2. Recrear la política para que los usuarios SOLO puedan actualizar sus propias propuestas pendientes
-- y NO puedan cambiar el status, reviewed_by, o reviewed_at
CREATE POLICY "users_update_own_pending_proposals" ON proposals
  FOR UPDATE
  TO authenticated
  USING (
    proposed_by = auth.uid()
    AND status = 'pending'
  )
  WITH CHECK (
    proposed_by = auth.uid()
    AND status = 'pending'
    AND reviewed_by IS NULL
    AND reviewed_at IS NULL
  );

-- 3. Verificar que la política de admins existe y funciona correctamente
DROP POLICY IF EXISTS "admins_approve_reject_proposals" ON proposals;

CREATE POLICY "admins_approve_reject_proposals" ON proposals
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('admin', 'editor')
      AND is_active = true
    )
  );

-- 4. Verificar las políticas actualizadas
SELECT
  policyname,
  cmd,
  permissive,
  roles,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'proposals'
  AND cmd = 'UPDATE'
ORDER BY policyname;
