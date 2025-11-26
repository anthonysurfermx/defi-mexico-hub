-- ============================================
-- SINCRONIZAR ROL DE PROFILES A AUTH.USERS
-- ============================================

-- Función para sincronizar el rol de profiles a auth.users.raw_user_meta_data
CREATE OR REPLACE FUNCTION sync_role_to_auth()
RETURNS TRIGGER AS $$
BEGIN
  -- Actualizar user_metadata en auth.users cuando cambia el rol en profiles
  UPDATE auth.users
  SET raw_user_meta_data =
    COALESCE(raw_user_meta_data, '{}'::jsonb) ||
    jsonb_build_object('role', NEW.role)
  WHERE id = NEW.id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para sincronizar cuando se actualiza el rol
DROP TRIGGER IF EXISTS sync_role_to_auth_trigger ON profiles;
CREATE TRIGGER sync_role_to_auth_trigger
  AFTER INSERT OR UPDATE OF role ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_role_to_auth();

-- ============================================
-- FUNCIÓN PARA ASIGNAR ROL DESDE ADMIN PANEL
-- ============================================

CREATE OR REPLACE FUNCTION assign_user_role(
  target_user_id UUID,
  new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
  current_user_role TEXT;
BEGIN
  -- Verificar que el usuario actual es admin
  SELECT role INTO current_user_role
  FROM profiles
  WHERE id = auth.uid();

  IF current_user_role != 'admin' THEN
    RAISE EXCEPTION 'Solo administradores pueden asignar roles';
  END IF;

  -- Validar que el rol es válido
  IF new_role NOT IN ('admin', 'editor', 'user') THEN
    RAISE EXCEPTION 'Rol inválido: %', new_role;
  END IF;

  -- Actualizar el rol en profiles (el trigger sincronizará a auth.users)
  UPDATE profiles
  SET
    role = new_role::user_role,
    updated_at = NOW()
  WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'user_id', target_user_id,
    'new_role', new_role
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INICIALIZAR ROLES DE USUARIOS EXISTENTES
-- ============================================

-- Asignar roles a los usuarios admin/editor existentes
DO $$
BEGIN
  -- Admin
  UPDATE profiles
  SET role = 'admin'
  WHERE email = 'anthochavez.ra@gmail.com';

  -- Editores
  UPDATE profiles
  SET role = 'editor'
  WHERE email IN (
    'guillermos22@gmail.com',
    'fabiancepeda102@gmail.com',
    'cruzcervantesdanieladrianelias@gmail.com',
    'anthonysurfermx@gmail.com',
    'danielcervantes2k4@gmail.com'
  );

  -- Sincronizar a auth.users para todos
  PERFORM sync_role_to_auth()
  FROM profiles
  WHERE role IN ('admin', 'editor');
END $$;

-- ============================================
-- VERIFICAR SINCRONIZACIÓN
-- ============================================

-- Ver roles en profiles y auth.users
SELECT
  p.email,
  p.role as profile_role,
  u.raw_user_meta_data->>'role' as auth_role,
  CASE
    WHEN p.role::text = u.raw_user_meta_data->>'role' THEN '✅ Sincronizado'
    ELSE '❌ Desincronizado'
  END as status
FROM profiles p
JOIN auth.users u ON p.id = u.id
WHERE p.role IN ('admin', 'editor')
ORDER BY p.role, p.email;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Permitir que la función sea ejecutada por usuarios autenticados
GRANT EXECUTE ON FUNCTION assign_user_role(UUID, TEXT) TO authenticated;
