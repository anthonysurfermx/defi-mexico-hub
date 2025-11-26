-- ============================================
-- AUTO-CREATE PROFILE FOR NEW USERS
-- Trigger para crear perfil automáticamente
-- cuando un usuario se registra (email o OAuth)
-- ============================================

-- Función para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Insertar nuevo perfil con rol 'user' por defecto
  INSERT INTO public.profiles (id, email, role, is_active, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'user'), -- Usar rol de metadata si existe, sino 'user'
    true,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Si ya existe, no hacer nada

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger en auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- CREAR PERFILES PARA USUARIOS EXISTENTES
-- (Si hay usuarios sin perfil)
-- ============================================

-- Insertar perfiles para usuarios que no tienen uno
INSERT INTO public.profiles (id, email, role, is_active, created_at, updated_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'user'),
  true,
  au.created_at,
  NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL;

-- Verificar
SELECT
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profile,
  COUNT(*) - COUNT(p.id) as users_without_profile
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id;

-- ============================================
-- ✅ COMPLETADO
-- ============================================
-- Ahora todos los usuarios nuevos (email/OAuth)
-- tendrán un perfil creado automáticamente
