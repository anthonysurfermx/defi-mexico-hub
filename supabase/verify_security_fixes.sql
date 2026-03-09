-- =============================================================================
-- VERIFICATION QUERIES - Security Fixes
-- =============================================================================
-- Run these queries after executing security_fixes.sql to verify everything worked
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Verify RLS is enabled on all tables
-- -----------------------------------------------------------------------------
SELECT 
  schemaname, 
  tablename, 
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Enabled'
    ELSE '❌ RLS NOT Enabled'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds', 
  'user_roles', 
  'newsletter_subscribers',
  'analytics_events', 
  'comments', 
  'likes', 
  'follows', 
  'system_config'
)
ORDER BY tablename;

-- Expected: All should show rls_enabled = true

-- -----------------------------------------------------------------------------
-- 2. Verify policies exist for each table
-- -----------------------------------------------------------------------------
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN cmd = 'SELECT' THEN '🔍 Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    WHEN cmd = 'ALL' THEN '🔐 All Operations'
    ELSE cmd
  END as operation_type
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds',
  'user_roles',
  'newsletter_subscribers',
  'analytics_events',
  'comments',
  'likes',
  'follows',
  'system_config'
)
ORDER BY tablename, cmd, policyname;

-- Expected: Should see multiple policies per table

-- -----------------------------------------------------------------------------
-- 3. Verify functions have search_path set
-- -----------------------------------------------------------------------------
SELECT 
  proname as function_name,
  prosecdef as security_definer,
  CASE 
    WHEN proconfig IS NULL THEN '❌ No search_path set'
    WHEN proconfig::text LIKE '%search_path%' THEN '✅ search_path configured'
    ELSE '⚠️ Other config'
  END as search_path_status,
  proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname IN (
  'enroll_student_in_course',
  'exec_sql',
  'get_blog_stats',
  'get_dashboard_stats',
  'global_search',
  'handle_new_user',
  'increment_counter',
  'is_admin_or_role'
)
ORDER BY proname;

-- Expected: All should show "✅ search_path configured"

-- -----------------------------------------------------------------------------
-- 4. Verify helper function is_admin_or_role exists and is accessible
-- -----------------------------------------------------------------------------
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as arguments,
  prosecdef as security_definer,
  proconfig
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proname = 'is_admin_or_role';

-- Expected: Should return 1 row with security_definer = true

-- -----------------------------------------------------------------------------
-- 5. Verify grants on is_admin_or_role function
-- -----------------------------------------------------------------------------
SELECT 
  p.proname as function_name,
  r.rolname as role_name,
  CASE 
    WHEN r.rolname = 'anon' THEN '🌐 Anonymous'
    WHEN r.rolname = 'authenticated' THEN '🔐 Authenticated'
    ELSE r.rolname
  END as role_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_proc_acl acl ON p.oid = acl.oid
JOIN pg_roles r ON acl.grantee = r.oid
WHERE n.nspname = 'public'
AND p.proname = 'is_admin_or_role';

-- Expected: Should see both 'anon' and 'authenticated' roles

-- -----------------------------------------------------------------------------
-- 6. Verify game_leaderboard view exists and has correct security
-- -----------------------------------------------------------------------------
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public'
AND viewname = 'game_leaderboard';

-- Expected: Should return 1 row

-- -----------------------------------------------------------------------------
-- 7. Count total policies created
-- -----------------------------------------------------------------------------
SELECT 
  COUNT(*) as total_policies,
  COUNT(DISTINCT tablename) as tables_with_policies
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds',
  'user_roles',
  'newsletter_subscribers',
  'analytics_events',
  'comments',
  'likes',
  'follows',
  'system_config',
  'jobs',
  'defi_advocates'
);

-- Expected: Should show multiple policies across multiple tables

-- -----------------------------------------------------------------------------
-- 8. Summary Report
-- -----------------------------------------------------------------------------
SELECT 
  'RLS Enabled Tables' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) = 8 THEN '✅ All 8 tables have RLS enabled'
    ELSE '⚠️ Some tables missing RLS'
  END as status
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true
AND tablename IN (
  'fintech_funds', 
  'user_roles', 
  'newsletter_subscribers',
  'analytics_events', 
  'comments', 
  'likes', 
  'follows', 
  'system_config'
)

UNION ALL

SELECT 
  'Security Policies' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 20 THEN '✅ Sufficient policies created'
    ELSE '⚠️ May need more policies'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN (
  'fintech_funds',
  'user_roles',
  'newsletter_subscribers',
  'analytics_events',
  'comments',
  'likes',
  'follows',
  'system_config',
  'jobs',
  'defi_advocates'
)

UNION ALL

SELECT 
  'Functions with search_path' as check_type,
  COUNT(*) as count,
  CASE 
    WHEN COUNT(*) >= 15 THEN '✅ Most functions secured'
    ELSE '⚠️ Some functions may need fixing'
  END as status
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND proconfig IS NOT NULL
AND proconfig::text LIKE '%search_path%';

-- Expected: All should show ✅ status





