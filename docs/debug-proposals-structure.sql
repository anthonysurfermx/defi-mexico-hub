-- Script para verificar la estructura de la tabla proposals
-- Ejecutar en Supabase SQL Editor

-- 1. Ver la estructura de la tabla proposals
SELECT
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'proposals'
ORDER BY ordinal_position;

-- 2. Ver las foreign keys de la tabla proposals
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'proposals';

-- 3. Intentar hacer la consulta directamente con SQL
SELECT
  p.*,
  pb.id as proposed_by_id,
  pb.email as proposed_by_email,
  pb.role as proposed_by_role
FROM proposals p
LEFT JOIN profiles pb ON p.proposed_by = pb.id
WHERE p.content_type = 'community'
  AND p.status = 'pending'
ORDER BY p.created_at DESC;
