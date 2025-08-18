-- =====================================================
-- Supabase Auth Schema Recovery Script
-- =====================================================
-- This script attempts to recreate the auth schema if it's missing or corrupted
-- ⚠️ WARNING: Only run this if 00_check_auth_schema.sql shows missing auth schema/tables
-- ⚠️ This might not work on all Supabase instances due to security restrictions

-- First, let's try to create the auth schema if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        CREATE SCHEMA auth;
        RAISE NOTICE 'Created auth schema';
    ELSE
        RAISE NOTICE 'Auth schema already exists';
    END IF;
END $$;

-- Create basic auth tables if they don't exist
-- Note: These are simplified versions - Supabase normally manages these

-- 1. Create users table
CREATE TABLE IF NOT EXISTS auth.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    encrypted_password VARCHAR(255),
    email_confirmed_at TIMESTAMPTZ,
    invited_at TIMESTAMPTZ,
    confirmation_token VARCHAR(255),
    confirmation_sent_at TIMESTAMPTZ,
    recovery_token VARCHAR(255),
    recovery_sent_at TIMESTAMPTZ,
    email_change_token_new VARCHAR(255),
    email_change VARCHAR(255),
    email_change_sent_at TIMESTAMPTZ,
    last_sign_in_at TIMESTAMPTZ,
    raw_app_meta_data JSONB DEFAULT '{}',
    raw_user_meta_data JSONB DEFAULT '{}',
    is_super_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    phone VARCHAR(15),
    phone_confirmed_at TIMESTAMPTZ,
    phone_change VARCHAR(15),
    phone_change_token VARCHAR(255),
    phone_change_sent_at TIMESTAMPTZ,
    confirmed_at TIMESTAMPTZ GENERATED ALWAYS AS (LEAST(email_confirmed_at, phone_confirmed_at)) STORED,
    email_change_token_current VARCHAR(255) DEFAULT '',
    email_change_confirm_status SMALLINT DEFAULT 0,
    banned_until TIMESTAMPTZ,
    reauthentication_token VARCHAR(255),
    reauthentication_sent_at TIMESTAMPTZ,
    is_sso_user BOOLEAN DEFAULT FALSE NOT NULL,
    deleted_at TIMESTAMPTZ
);

-- 2. Create sessions table
CREATE TABLE IF NOT EXISTS auth.sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    factor_id UUID,
    aal VARCHAR(10) DEFAULT 'aal1',
    not_after TIMESTAMPTZ,
    refreshed_at TIMESTAMPTZ,
    user_agent TEXT,
    ip INET,
    tag VARCHAR(255)
);

-- 3. Create refresh_tokens table
CREATE TABLE IF NOT EXISTS auth.refresh_tokens (
    id SERIAL PRIMARY KEY,
    token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    parent VARCHAR(255),
    session_id UUID REFERENCES auth.sessions(id) ON DELETE CASCADE
);

-- 4. Create instances table
CREATE TABLE IF NOT EXISTS auth.instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    uuid UUID,
    raw_base_config TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create audit_log_entries table
CREATE TABLE IF NOT EXISTS auth.audit_log_entries (
    instance_id UUID,
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payload JSON,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address VARCHAR(64) DEFAULT ''
);

-- 6. Create schema_migrations table
CREATE TABLE IF NOT EXISTS auth.schema_migrations (
    version VARCHAR(255) PRIMARY KEY
);

-- Insert basic schema migration records
INSERT INTO auth.schema_migrations (version) VALUES 
    ('20171026211738'),
    ('20171026211808'),
    ('20171026211834'),
    ('20180103212743'),
    ('20180108183307'),
    ('20180119214651'),
    ('20180125194653')
ON CONFLICT (version) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS users_email_idx ON auth.users (email);
CREATE INDEX IF NOT EXISTS users_instance_id_idx ON auth.users (instance_id);
CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON auth.sessions (user_id);
CREATE INDEX IF NOT EXISTS refresh_tokens_token_idx ON auth.refresh_tokens (token);
CREATE INDEX IF NOT EXISTS refresh_tokens_user_id_idx ON auth.refresh_tokens (user_id);

-- Create basic RLS policies (if RLS is enabled)
DO $$ 
BEGIN
    -- Enable RLS on auth tables
    ALTER TABLE auth.users ENABLE ROW LEVEL SECURITY;
    ALTER TABLE auth.sessions ENABLE ROW LEVEL SECURITY;
    ALTER TABLE auth.refresh_tokens ENABLE ROW LEVEL SECURITY;
    
    -- Create basic policies (very restrictive)
    CREATE POLICY "Users can view own record" ON auth.users
        FOR SELECT USING (auth.uid() = id);
        
    CREATE POLICY "Users can update own record" ON auth.users
        FOR UPDATE USING (auth.uid() = id);
        
    RAISE NOTICE 'RLS policies created';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'RLS policies might already exist or not supported: %', SQLERRM;
END $$;

-- Try to manually insert the test user (if it doesn't exist)
-- This is normally done by Supabase Auth, but we'll try manually
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'anthochavez.ra@gmail.com') THEN
        INSERT INTO auth.users (
            email,
            encrypted_password,
            email_confirmed_at,
            confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            'anthochavez.ra@gmail.com',
            crypt('Admin2025!', gen_salt('bf')), -- This might not work without pgcrypto
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"name": "Anthony Chavez"}',
            NOW(),
            NOW()
        );
        RAISE NOTICE 'User created manually';
    ELSE
        RAISE NOTICE 'User already exists';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not create user manually: %', SQLERRM;
        RAISE NOTICE 'User will need to be created through Supabase Auth API';
END $$;

-- Grant necessary permissions
DO $$
BEGIN
    -- Grant usage on auth schema
    GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
    
    -- Grant permissions on tables
    GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
    GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated;
    
    -- Grant permissions on sequences
    GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, service_role;
    
    RAISE NOTICE 'Permissions granted';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not grant all permissions: %', SQLERRM;
END $$;

-- Final check
SELECT 
    'AUTH SCHEMA RECOVERY COMPLETE' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'auth';

-- Instructions for next steps
SELECT 
    'NEXT STEPS' as section,
    'Run 00_check_auth_schema.sql again to verify the fix' as instruction
UNION ALL
SELECT 
    'NEXT STEPS' as section,
    'If this script fails, contact Supabase support' as instruction
UNION ALL
SELECT 
    'NEXT STEPS' as section,
    'Test login again after running this script' as instruction;