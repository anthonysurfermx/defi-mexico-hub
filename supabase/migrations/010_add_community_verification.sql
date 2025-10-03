-- Migration: 010_add_community_verification.sql
-- Agregar sistema de verificación/aprobación para comunidades

-- Agregar columna is_verified a la tabla communities
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Agregar columna para tracking del creador
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Agregar columna para tracking del aprobador
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES auth.users(id);

-- Agregar columna para fecha de verificación
ALTER TABLE communities
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;

-- Actualizar todas las comunidades existentes como verificadas
UPDATE communities
SET is_verified = TRUE,
    verified_at = NOW()
WHERE is_verified IS NULL;

-- Crear índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS communities_is_verified_idx ON communities(is_verified);
CREATE INDEX IF NOT EXISTS communities_created_by_idx ON communities(created_by);

-- Actualizar RLS policies
DROP POLICY IF EXISTS "Allow public read access to active communities" ON communities;
DROP POLICY IF EXISTS "Allow authenticated read access to all communities" ON communities;
DROP POLICY IF EXISTS "Allow admin full access" ON communities;

-- Política: Público solo puede ver comunidades verificadas y activas
CREATE POLICY "Public can read verified active communities" ON communities
  FOR SELECT TO anon
  USING (is_verified = true AND is_active = true);

-- Política: Usuarios autenticados pueden ver todas las comunidades verificadas
CREATE POLICY "Authenticated users can read verified communities" ON communities
  FOR SELECT TO authenticated
  USING (is_verified = true);

-- Política: Editores pueden ver sus propias comunidades (verificadas o no)
CREATE POLICY "Editors can view own communities" ON communities
  FOR SELECT TO authenticated
  USING (
    auth.uid() = created_by
  );

-- Política: Editores pueden crear comunidades (pero no verificadas)
CREATE POLICY "Editors can create communities" ON communities
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('editor', 'moderator', 'admin')
    )
    AND auth.uid() = created_by
    AND is_verified = false  -- Las nuevas comunidades inician sin verificar
  );

-- Política: Editores pueden actualizar sus propias comunidades no verificadas
CREATE POLICY "Editors can update own unverified communities" ON communities
  FOR UPDATE TO authenticated
  USING (
    auth.uid() = created_by
    AND is_verified = false
  )
  WITH CHECK (
    auth.uid() = created_by
    AND is_verified = false  -- No pueden auto-verificarse
  );

-- Política: Moderadores pueden ver todas las comunidades
CREATE POLICY "Moderators can view all communities" ON communities
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('moderator', 'admin')
    )
  );

-- Política: Solo admins pueden verificar comunidades
CREATE POLICY "Only admins can verify communities" ON communities
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Política: Admins tienen acceso completo
CREATE POLICY "Admins have full access to communities" ON communities
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Función para verificar una comunidad
CREATE OR REPLACE FUNCTION verify_community(community_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo admins pueden verificar
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can verify communities';
  END IF;

  -- Verificar la comunidad
  UPDATE communities
  SET
    is_verified = true,
    verified_by = auth.uid(),
    verified_at = NOW(),
    updated_at = NOW()
  WHERE id = community_id;
END;
$$;

-- Función para rechazar una comunidad
CREATE OR REPLACE FUNCTION reject_community(community_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Solo admins pueden rechazar
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can reject communities';
  END IF;

  -- Marcar como no verificada
  UPDATE communities
  SET
    is_verified = false,
    verified_by = NULL,
    verified_at = NULL,
    updated_at = NOW()
  WHERE id = community_id;
END;
$$;

-- Función para obtener estadísticas con comunidades pendientes
CREATE OR REPLACE FUNCTION get_community_stats_with_pending()
RETURNS TABLE(
  total_communities INTEGER,
  verified_communities INTEGER,
  pending_communities INTEGER,
  active_communities INTEGER,
  featured_communities INTEGER,
  total_members BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::INTEGER as total_communities,
    COUNT(*) FILTER (WHERE is_verified = true)::INTEGER as verified_communities,
    COUNT(*) FILTER (WHERE is_verified = false)::INTEGER as pending_communities,
    COUNT(*) FILTER (WHERE is_active = true AND is_verified = true)::INTEGER as active_communities,
    COUNT(*) FILTER (WHERE is_featured = true AND is_verified = true)::INTEGER as featured_communities,
    COALESCE(SUM(member_count), 0)::BIGINT as total_members
  FROM communities;
END;
$$;

-- Comentarios para documentación
COMMENT ON COLUMN communities.is_verified IS 'Indica si la comunidad ha sido aprobada por un administrador';
COMMENT ON COLUMN communities.created_by IS 'Usuario que creó la comunidad';
COMMENT ON COLUMN communities.verified_by IS 'Administrador que verificó la comunidad';
COMMENT ON COLUMN communities.verified_at IS 'Fecha y hora de verificación';