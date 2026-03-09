-- Migration: 025_add_audio_storage_path.sql
-- Agrega columna para la ruta del audio en Supabase Storage
-- El frontend ahora sube el audio directamente a Storage (evita límite 4.5MB de Vercel)

ALTER TABLE public.content_machine_jobs
  ADD COLUMN IF NOT EXISTS audio_storage_path TEXT;

-- Crear bucket para audios del Content Machine
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'content-machine-audio',
  'content-machine-audio',
  false,
  52428800, -- 50MB
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/m4a', 'audio/wav', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO NOTHING;

-- RLS para el bucket: solo admins pueden subir y leer
CREATE POLICY "Admins can upload audio"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'content-machine-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can read audio"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'content-machine-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );

CREATE POLICY "Admins can delete audio"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'content-machine-audio'
    AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'super_admin')
  );
