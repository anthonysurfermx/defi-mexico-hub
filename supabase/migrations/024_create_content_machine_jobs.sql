-- Migration: 024_create_content_machine_jobs.sql
-- Content Machine: tabla para guardar jobs de procesamiento de audio/texto

CREATE TABLE IF NOT EXISTS public.content_machine_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Input
  source_type TEXT NOT NULL CHECK (source_type IN ('audio', 'text', 'both')),
  source_label TEXT, -- Ej: "Invest Like the Best - Ep 123"
  topic TEXT,        -- Tema central en una línea
  audience TEXT,     -- founders-latam | developers | instituciones
  raw_transcript TEXT,      -- Transcripción de Whisper (si viene de audio)
  input_text TEXT,          -- Texto adicional o el input principal si no hay audio
  audio_filename TEXT,      -- Nombre del archivo MP3 original

  -- Processing status
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'transcribing', 'generating', 'done', 'error')),
  error_message TEXT,

  -- Outputs generados por Claude
  output_linkedin_post TEXT,
  output_linkedin_article TEXT,
  output_twitter_thread TEXT,
  output_twitter_post TEXT,
  output_video_script TEXT,
  output_defimexico_article TEXT,

  -- Control de publicación (qué decidió publicar Anthony)
  published_blog_post_id UUID REFERENCES public.blog_posts(id),
  linkedin_published_at TIMESTAMPTZ,
  twitter_published_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  processing_started_at TIMESTAMPTZ,
  processing_finished_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_content_machine_jobs_status ON content_machine_jobs(status);
CREATE INDEX idx_content_machine_jobs_created_at ON content_machine_jobs(created_at DESC);
CREATE INDEX idx_content_machine_jobs_created_by ON content_machine_jobs(created_by);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_content_machine_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER content_machine_jobs_updated_at
  BEFORE UPDATE ON content_machine_jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_content_machine_jobs_updated_at();

-- RLS: solo admins pueden ver y crear jobs
ALTER TABLE public.content_machine_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage content machine jobs"
  ON public.content_machine_jobs
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role' = 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND (raw_user_meta_data->>'role' = 'admin')
    )
  );
