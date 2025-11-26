-- ============================================
-- VERIFICAR Y CORREGIR CONSTRAINT DE ROLE
-- ============================================

-- 1. Ver el constraint actual
SELECT
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname LIKE '%role%';

-- 2. Ver el tipo de dato de la columna role
SELECT
  column_name,
  data_type,
  udt_name
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role';

-- 3. Si role es tipo TEXT con constraint, eliminarlo y convertir a ENUM
DO $$
BEGIN
  -- Eliminar constraint si existe
  ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_role;

  -- Si role es TEXT, convertir a user_role ENUM
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'profiles'
      AND column_name = 'role'
      AND data_type = 'text'
  ) THEN
    -- Crear columna temporal
    ALTER TABLE profiles ADD COLUMN role_new user_role;

    -- Copiar valores (mapear a enum)
    UPDATE profiles
    SET role_new = CASE
      WHEN role = 'admin' THEN 'admin'::user_role
      WHEN role = 'editor' THEN 'editor'::user_role
      ELSE 'user'::user_role
    END;

    -- Eliminar columna vieja
    ALTER TABLE profiles DROP COLUMN role;

    -- Renombrar nueva columna
    ALTER TABLE profiles RENAME COLUMN role_new TO role;

    -- Establecer default y NOT NULL
    ALTER TABLE profiles ALTER COLUMN role SET DEFAULT 'user'::user_role;
    ALTER TABLE profiles ALTER COLUMN role SET NOT NULL;
  END IF;
END $$;

-- 4. Verificar que ahora funciona
SELECT
  column_name,
  data_type,
  udt_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
  AND column_name = 'role';
