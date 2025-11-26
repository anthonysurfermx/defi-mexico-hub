-- Script para verificar y arreglar visibilidad de propuestas para admins
-- Ejecutar en Supabase SQL Editor

-- 1. Verificar si existen propuestas de comunidades
SELECT
  id,
  content_type,
  status,
  content_data->>'name' as community_name,
  proposed_by,
  created_at
FROM proposals
WHERE content_type = 'community'
ORDER BY created_at DESC;

-- 2. Verificar las políticas de SELECT en proposals
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'proposals';

-- 3. Si no existe política para que admins/editores vean TODAS las propuestas,
-- necesitamos crearla o verificarla
-- Esta política debería permitir a admins/editores ver todas las propuestas

-- Verificar si la política existe
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'proposals'
    AND policyname = 'admins_editors_view_all_proposals'
  ) THEN
    RAISE NOTICE 'La política admins_editors_view_all_proposals NO existe. Necesitas crearla.';
  ELSE
    RAISE NOTICE 'La política admins_editors_view_all_proposals existe.';
  END IF;
END $$;

-- 4. Verificar tu rol actual
SELECT
  u.id,
  u.email,
  p.role,
  p.is_active
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = current_setting('request.jwt.claims', true)::json->>'email';
