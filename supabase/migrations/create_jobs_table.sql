-- =============================================
-- Tabla: jobs (Trabajos Web3 México)
-- =============================================

-- Crear la tabla de trabajos
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Información básica
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  company_logo TEXT,
  location TEXT NOT NULL DEFAULT 'México',

  -- Tipo y categoría
  job_type TEXT NOT NULL DEFAULT 'remote' CHECK (job_type IN ('remote', 'hybrid', 'onsite')),
  category TEXT NOT NULL DEFAULT 'Engineering',

  -- Salario
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',

  -- Experiencia
  experience_level TEXT NOT NULL DEFAULT 'Mid (2-4 años)',

  -- Tags/tecnologías
  tags TEXT[] DEFAULT '{}',

  -- Descripción
  description TEXT NOT NULL DEFAULT '',
  requirements TEXT,
  benefits TEXT,

  -- Aplicación
  apply_url TEXT NOT NULL,
  apply_email TEXT,

  -- Estado y opciones
  is_featured BOOLEAN DEFAULT false,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'expired')),
  expires_at TIMESTAMPTZ,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_jobs_status ON public.jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_job_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_is_featured ON public.jobs(is_featured);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON public.jobs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_company ON public.jobs(company);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_jobs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON public.jobs;
CREATE TRIGGER trigger_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_jobs_updated_at();

-- Políticas RLS (Row Level Security)
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Política: Todos pueden ver trabajos publicados
CREATE POLICY "Public can view published jobs"
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published');

-- Política: Admins pueden ver todos los trabajos
CREATE POLICY "Admins can view all jobs"
  ON public.jobs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden insertar trabajos
CREATE POLICY "Admins can insert jobs"
  ON public.jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden actualizar trabajos
CREATE POLICY "Admins can update jobs"
  ON public.jobs
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Política: Admins pueden eliminar trabajos
CREATE POLICY "Admins can delete jobs"
  ON public.jobs
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = TRUE
    )
  );

-- Comentarios de documentación
COMMENT ON TABLE public.jobs IS 'Ofertas de trabajo Web3 en México';
COMMENT ON COLUMN public.jobs.job_type IS 'Tipo de trabajo: remote, hybrid, onsite';
COMMENT ON COLUMN public.jobs.status IS 'Estado: draft, published, closed, expired';
COMMENT ON COLUMN public.jobs.tags IS 'Array de tecnologías y habilidades requeridas';
COMMENT ON COLUMN public.jobs.is_featured IS 'Trabajo destacado que aparece primero';

-- =============================================
-- Datos de ejemplo (opcional - comentar en producción)
-- =============================================

-- INSERT INTO public.jobs (title, company, location, job_type, category, salary_min, salary_max, salary_currency, experience_level, tags, description, apply_url, is_featured, status) VALUES
-- ('Senior Solidity Developer', 'Bitso', 'Ciudad de México', 'hybrid', 'Engineering', 80000, 120000, 'USD', 'Senior (5+ años)', ARRAY['Solidity', 'Ethereum', 'DeFi', 'Smart Contracts'], 'Buscamos un desarrollador Solidity con experiencia en protocolos DeFi.', 'https://bitso.com/careers', true, 'published'),
-- ('Web3 Frontend Developer', 'Trubit', 'Remoto México', 'remote', 'Engineering', 50000, 80000, 'USD', 'Mid (2-4 años)', ARRAY['React', 'TypeScript', 'Web3.js', 'Ethers.js'], 'Desarrolla interfaces de usuario para aplicaciones DeFi.', 'https://trubit.com/careers', false, 'published'),
-- ('Blockchain Product Manager', 'Volabit', 'Guadalajara', 'onsite', 'Product', 60000, 90000, 'USD', 'Mid-Senior (3-5 años)', ARRAY['Product Management', 'Crypto', 'Agile'], 'Lidera el desarrollo de nuevos productos blockchain.', 'https://volabit.com/careers', false, 'published');
