-- Check current RLS policies on communities table
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
WHERE tablename = 'communities'
ORDER BY cmd, policyname;

-- Enable RLS if not already enabled
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- Drop existing INSERT policy if it exists (to recreate it properly)
DROP POLICY IF EXISTS "allow_authenticated_insert_communities" ON communities;
DROP POLICY IF EXISTS "users_insert_communities" ON communities;
DROP POLICY IF EXISTS "admins_insert_communities" ON communities;

-- Create policy to allow authenticated users (especially admins) to INSERT communities
-- This will be used when migrating approved proposals
CREATE POLICY "allow_authenticated_insert_communities"
ON communities
FOR INSERT
TO authenticated
WITH CHECK (true);

-- Verify the policy was created
SELECT
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'communities' AND cmd = 'INSERT';
