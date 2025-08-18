-- =====================================================
-- Supabase Auth Schema Diagnostic Script
-- =====================================================
-- This script checks if the auth schema and required tables exist
-- Run this in Supabase SQL Editor to diagnose auth issues

-- 1. Check if auth schema exists
SELECT 
    'auth' as schema_name,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.schemata 
            WHERE schema_name = 'auth'
        ) THEN '✅ EXISTS' 
        ELSE '❌ MISSING' 
    END as status;

-- 2. List all schemas (for reference)
SELECT 
    schema_name,
    CASE 
        WHEN schema_name = 'auth' THEN '← AUTH SCHEMA'
        WHEN schema_name = 'public' THEN '← PUBLIC SCHEMA'
        WHEN schema_name = 'storage' THEN '← STORAGE SCHEMA'
        ELSE ''
    END as notes
FROM information_schema.schemata 
WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
ORDER BY schema_name;

-- 3. Check auth tables (if auth schema exists)
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name = 'users' THEN '← Main user table'
        WHEN table_name = 'sessions' THEN '← User sessions'
        WHEN table_name = 'refresh_tokens' THEN '← Refresh tokens'
        WHEN table_name = 'audit_log_entries' THEN '← Audit log'
        WHEN table_name = 'instances' THEN '← Auth instances'
        WHEN table_name = 'schema_migrations' THEN '← Schema versions'
        ELSE ''
    END as notes
FROM information_schema.tables 
WHERE table_schema = 'auth'
ORDER BY table_name;

-- 4. Check if there are any users in auth.users
SELECT 
    'auth.users' as table_name,
    COUNT(*) as user_count,
    COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
    COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- 5. Check for your specific user
SELECT 
    id,
    email,
    email_confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    CASE 
        WHEN email_confirmed_at IS NOT NULL THEN 'Confirmed'
        ELSE 'Not confirmed'
    END as email_status
FROM auth.users 
WHERE email = 'anthochavez.ra@gmail.com';

-- 6. Check auth schema permissions
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.schema_privileges 
WHERE schema_name = 'auth'
ORDER BY grantee, privilege_type;

-- 7. Check if auth functions exist
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'auth'
ORDER BY routine_name;

-- 8. Check auth triggers
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_timing
FROM information_schema.triggers 
WHERE trigger_schema = 'auth'
ORDER BY event_object_table, trigger_name;

-- 9. Check for any auth-related errors in pg_stat_statements (if available)
-- This might not work on all Supabase instances
SELECT 
    query,
    calls,
    mean_exec_time,
    rows
FROM pg_stat_statements 
WHERE query LIKE '%auth%' 
AND calls > 0
ORDER BY mean_exec_time DESC
LIMIT 10;

-- 10. Final summary
SELECT 
    'DIAGNOSIS SUMMARY' as section,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
        THEN '✅ Auth schema appears healthy'
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')
        AND NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
        THEN '⚠️ Auth schema exists but missing tables'
        WHEN NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth')
        THEN '❌ Auth schema completely missing'
        ELSE '❓ Unknown state'
    END as diagnosis;

-- If you see "Auth schema completely missing" or "missing tables", 
-- run the next migration script: 01_fix_auth_schema.sql