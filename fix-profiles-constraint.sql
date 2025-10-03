-- ============================================
-- SOLUCIÓN: ACTUALIZAR CONSTRAINT DE ROLES EN PROFILES
-- ============================================
-- Este script actualiza la restricción valid_role para incluir
-- todos los roles necesarios del sistema

-- 1. VERIFICAR CONSTRAINT ACTUAL
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

-- 2. VER ROLES EXISTENTES EN LA TABLA
SELECT DISTINCT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- 3. ACTUALIZAR EL CONSTRAINT PARA INCLUIR TODOS LOS ROLES NECESARIOS
BEGIN;

-- Eliminar el constraint existente
ALTER TABLE public.profiles DROP CONSTRAINT valid_role;

-- Crear el nuevo constraint con todos los roles necesarios
ALTER TABLE public.profiles
  ADD CONSTRAINT valid_role CHECK (
    role = ANY (
      ARRAY[
        'admin'::text,
        'editor'::text,
        'moderator'::text,
        'user'::text,
        'startup'::text,
        'startup_owner'::text,
        'investor'::text
      ]
    )
  );

COMMIT;

-- 4. VERIFICAR QUE EL NUEVO CONSTRAINT SE APLICÓ CORRECTAMENTE
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.profiles'::regclass
  AND contype = 'c';

-- 5. AHORA PODEMOS ASIGNAR ROLES DE EDITOR A LOS USUARIOS
-- Buscar los usuarios por email para obtener sus IDs
SELECT id, email, role
FROM auth.users
WHERE email IN ('anthonysurfermx@gmail.com', 'danielcervantes2k4@gmail.com');

-- 6. CREAR O ACTUALIZAR PERFILES PARA LOS EDITORES
-- Nota: Reemplaza los UUIDs con los obtenidos en el paso anterior

-- Para anthonysurfermx@gmail.com
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'anthonysurfermx@gmail.com'),
  'anthonysurfermx@gmail.com',
  'Anthony Surfermx',
  'editor',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'editor',
  updated_at = now();

-- Para danielcervantes2k4@gmail.com
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'danielcervantes2k4@gmail.com'),
  'danielcervantes2k4@gmail.com',
  'Daniel Cervantes',
  'editor',
  now(),
  now()
) ON CONFLICT (id) DO UPDATE SET
  role = 'editor',
  updated_at = now();

-- 7. VERIFICAR QUE LOS PERFILES SE CREARON/ACTUALIZARON CORRECTAMENTE
SELECT
  p.id,
  p.email,
  p.full_name,
  p.role,
  p.created_at
FROM public.profiles p
WHERE p.email IN ('anthonysurfermx@gmail.com', 'danielcervantes2k4@gmail.com');

-- 8. VERIFICAR QUE NO HAY PROBLEMAS CON OTROS ROLES EXISTENTES
SELECT role, COUNT(*) as count
FROM public.profiles
GROUP BY role
ORDER BY role;

-- ============================================
-- OPCIONAL: POLÍTICA RLS PARA PROFILES
-- ============================================
-- Si la tabla profiles tiene RLS habilitado, asegúrate de que
-- los usuarios puedan leer sus propios perfiles

-- Ver si RLS está habilitado
SELECT
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'profiles';

-- Si RLS está habilitado y necesitas políticas:
/*
-- Política para que usuarios puedan ver su propio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

-- Política para que usuarios puedan actualizar su propio perfil
CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);
*/

-- ============================================
-- NOTAS IMPORTANTES
-- ============================================
-- 1. Este script sincroniza los roles entre la DB y el frontend
-- 2. Los roles incluidos son: admin, editor, moderator, user, startup, startup_owner, investor
-- 3. Si tu sistema usa diferentes roles, ajusta el ARRAY en el paso 3
-- 4. Los usuarios ahora tendrán perfiles con rol 'editor' en la tabla profiles
-- 5. El sistema de autenticación debería reconocer estos roles correctamente