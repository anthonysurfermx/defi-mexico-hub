-- =============================================================================
-- URGENT FIX: RLS CASCADING ISSUE ON JOBS AND DEFI_ADVOCATES
-- =============================================================================
-- Run this in Supabase Dashboard > SQL Editor
--
-- Problem: Policies on jobs/defi_advocates query user_roles table, but user_roles
-- now has RLS that blocks anonymous access, causing 500 errors for public pages.
--
-- Affected pages:
--   - /ecosistema/trabajos (jobs)
--   - /referentes (defi_advocates)
-- =============================================================================

-- Step 1: Create helper function with SECURITY DEFINER to check admin status
-- This function bypasses RLS on user_roles when called
CREATE OR REPLACE FUNCTION public.is_admin_or_role(required_roles text[] DEFAULT ARRAY['admin', 'super_admin'])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(required_roles)
    AND is_active = true
  );
$$;

-- Grant execute to all users (including anon for policy evaluation)
GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO anon;

-- Step 2: Update JOBS table policies to use helper function
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
CREATE POLICY "Admins can update jobs" ON public.jobs
  FOR UPDATE
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
CREATE POLICY "Admins can delete jobs" ON public.jobs
  FOR DELETE
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
CREATE POLICY "Admins can insert jobs" ON public.jobs
  FOR INSERT
  WITH CHECK (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

-- Step 3: Update DEFI_ADVOCATES table policies to use helper function
DROP POLICY IF EXISTS "Admins and editors can manage advocates" ON public.defi_advocates;
CREATE POLICY "Admins and editors can manage advocates" ON public.defi_advocates
  FOR ALL
  USING (public.is_admin_or_role(ARRAY['admin', 'editor', 'super_admin']));

-- =============================================================================
-- DONE! After running this, test:
--   1. Visit /ecosistema/trabajos - should show jobs
--   2. Visit /referentes - should show advocates
-- =============================================================================
