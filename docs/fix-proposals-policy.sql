-- Fix proposals policies to allow OAuth users to create proposals
-- Run this in Supabase SQL Editor

-- Drop existing policy
DROP POLICY IF EXISTS "verified_users_create_proposals" ON proposals;

-- Create new policy that allows authenticated users to create proposals
-- OAuth users have their email verified by the provider (Google, GitHub, etc.)
CREATE POLICY "authenticated_users_create_proposals" ON proposals
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = proposed_by
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND is_active = true
    )
  );

-- Also, let's make sure OAuth users have email_verified set to true
-- This updates all users who logged in with OAuth providers
UPDATE profiles
SET email_verified = true
WHERE id IN (
  SELECT id FROM auth.users
  WHERE email_confirmed_at IS NOT NULL
  OR confirmed_at IS NOT NULL
)
AND email_verified = false;

-- Verify the changes
SELECT
  id,
  email,
  email_verified,
  is_active,
  role,
  created_at
FROM profiles
WHERE email_verified = false;
