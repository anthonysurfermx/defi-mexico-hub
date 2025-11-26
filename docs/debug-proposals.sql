-- Debug: Verificar propuestas de comunidades
SELECT
  id,
  content_type,
  status,
  content_data->>'name' as nombre,
  proposed_by,
  created_at,
  reviewed_at,
  reviewed_by
FROM proposals
WHERE content_type = 'community'
ORDER BY created_at DESC;

-- Verificar políticas RLS activas para proposals
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
WHERE tablename = 'proposals'
ORDER BY cmd, policyname;

-- Verificar si el usuario actual puede ver las propuestas
-- (Ejecutar como el usuario admin que está intentando ver)
SELECT
  auth.uid() as current_user_id,
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) as is_admin;
