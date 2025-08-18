-- Create user_roles table for role-based access control
-- Migration: 003_create_user_roles_table.sql

-- Create user roles enum
CREATE TYPE user_role AS ENUM ('user', 'moderator', 'admin', 'super_admin');

-- Create the user_roles table
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL DEFAULT 'user',
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS user_roles_user_id_idx ON user_roles(user_id);
CREATE INDEX IF NOT EXISTS user_roles_role_idx ON user_roles(role);
CREATE INDEX IF NOT EXISTS user_roles_is_active_idx ON user_roles(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS user_roles_expires_at_idx ON user_roles(expires_at) WHERE expires_at IS NOT NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_user_roles_updated_at 
  BEFORE UPDATE ON user_roles 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own roles
CREATE POLICY "Users can view own roles" ON user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view all roles
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role IN ('admin', 'super_admin') 
        AND ur.is_active = TRUE
    )
  );

-- Only super_admins can modify roles
CREATE POLICY "Super admins can manage roles" ON user_roles
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'super_admin' 
        AND ur.is_active = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
        AND ur.role = 'super_admin' 
        AND ur.is_active = TRUE
    )
  );

-- Create function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_uuid UUID DEFAULT auth.uid())
RETURNS user_role
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role
  FROM user_roles
  WHERE user_id = user_uuid
    AND is_active = TRUE
    AND (expires_at IS NULL OR expires_at > NOW())
  ORDER BY 
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      WHEN 'user' THEN 4
    END
  LIMIT 1;
$$;

-- Create function to check if user has role
CREATE OR REPLACE FUNCTION user_has_role(required_role user_role, user_uuid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = user_uuid
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        role = required_role
        OR (required_role = 'user' AND role IN ('moderator', 'admin', 'super_admin'))
        OR (required_role = 'moderator' AND role IN ('admin', 'super_admin'))
        OR (required_role = 'admin' AND role = 'super_admin')
      )
  );
$$;

-- Create function to check permissions
CREATE OR REPLACE FUNCTION user_has_permission(permission_name TEXT, user_uuid UUID DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_roles
    WHERE user_id = user_uuid
      AND is_active = TRUE
      AND (expires_at IS NULL OR expires_at > NOW())
      AND (
        role IN ('admin', 'super_admin')
        OR permissions ? permission_name
        OR permissions ->> permission_name = 'true'
      )
  );
$$;

-- Create function to assign role
CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  new_role user_role,
  assigned_by_user_id UUID DEFAULT auth.uid(),
  expires_at_param TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  permissions_param JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id UUID;
BEGIN
  -- Check if assigner has permission
  IF NOT user_has_role('admin', assigned_by_user_id) THEN
    RAISE EXCEPTION 'Insufficient permissions to assign roles';
  END IF;

  -- Insert or update role
  INSERT INTO user_roles (
    user_id, 
    role, 
    assigned_by, 
    expires_at, 
    permissions
  ) VALUES (
    target_user_id, 
    new_role, 
    assigned_by_user_id, 
    expires_at_param, 
    permissions_param
  )
  ON CONFLICT (user_id, role) DO UPDATE SET
    assigned_by = EXCLUDED.assigned_by,
    assigned_at = NOW(),
    expires_at = EXCLUDED.expires_at,
    permissions = EXCLUDED.permissions,
    is_active = TRUE,
    updated_at = NOW()
  RETURNING id INTO result_id;

  RETURN result_id;
END;
$$;

-- Create view for active user roles with user info
CREATE OR REPLACE VIEW active_user_roles AS
SELECT 
  ur.id,
  ur.user_id,
  u.email,
  u.raw_user_meta_data ->> 'name' as user_name,
  ur.role,
  ur.assigned_by,
  assigner.email as assigned_by_email,
  ur.assigned_at,
  ur.expires_at,
  ur.permissions,
  ur.metadata,
  ur.created_at,
  ur.updated_at
FROM user_roles ur
JOIN auth.users u ON ur.user_id = u.id
LEFT JOIN auth.users assigner ON ur.assigned_by = assigner.id
WHERE ur.is_active = TRUE
  AND (ur.expires_at IS NULL OR ur.expires_at > NOW());

-- Insert default admin role if needed (replace with actual admin user ID)
-- This should be done after creating your first admin user
-- INSERT INTO user_roles (user_id, role, assigned_by) 
-- VALUES ('your-admin-user-id', 'super_admin', 'your-admin-user-id')
-- ON CONFLICT (user_id, role) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE user_roles IS 'User roles and permissions for access control';
COMMENT ON TYPE user_role IS 'Available user roles: user (default), moderator, admin, super_admin';
COMMENT ON COLUMN user_roles.permissions IS 'JSON object with specific permissions for granular access control';
COMMENT ON COLUMN user_roles.expires_at IS 'Optional expiration date for temporary roles';
COMMENT ON FUNCTION get_user_role(UUID) IS 'Get the highest role for a user';
COMMENT ON FUNCTION user_has_role(user_role, UUID) IS 'Check if user has a specific role or higher';
COMMENT ON FUNCTION assign_user_role(UUID, user_role, UUID, TIMESTAMP WITH TIME ZONE, JSONB) IS 'Assign a role to a user';