-- Migration: Create DeFi Advocates table
-- Description: Tabla para almacenar los referentes del ecosistema DeFi en México

-- Drop existing table if exists
DROP TABLE IF EXISTS public.defi_advocates CASCADE;

-- Create enum for advocate track/role
CREATE TYPE advocate_track AS ENUM (
  'developer_expert',
  'community_advocate',
  'researcher',
  'educator',
  'influencer'
);

-- Create DeFi Advocates table
CREATE TABLE public.defi_advocates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- Basic Information
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  email VARCHAR(255),

  -- Profile Details
  bio TEXT,
  avatar_url TEXT,
  location VARCHAR(255), -- e.g., "Ciudad de México, México"
  expertise VARCHAR(255), -- e.g., "Smart Contracts, DeFi Protocols"
  track advocate_track DEFAULT 'community_advocate',

  -- Social Links
  twitter_url TEXT,
  linkedin_url TEXT,
  github_url TEXT,
  website TEXT,

  -- Metadata
  is_featured BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0, -- Para ordenar en la página

  -- Additional Info
  achievements TEXT[], -- Array de logros
  specializations TEXT[], -- e.g., ["Solidity", "Security Audits", "DeFi"]

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create indexes for better performance
CREATE INDEX idx_defi_advocates_slug ON public.defi_advocates(slug);
CREATE INDEX idx_defi_advocates_track ON public.defi_advocates(track);
CREATE INDEX idx_defi_advocates_is_active ON public.defi_advocates(is_active);
CREATE INDEX idx_defi_advocates_is_featured ON public.defi_advocates(is_featured);

-- Enable Row Level Security
ALTER TABLE public.defi_advocates ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Public can read active advocates
CREATE POLICY "Public can view active advocates"
  ON public.defi_advocates
  FOR SELECT
  USING (is_active = true);

-- Admins and editors can do everything
CREATE POLICY "Admins and editors can manage advocates"
  ON public.defi_advocates
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'editor', 'super_admin')
      AND is_active = true
    )
  );

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_defi_advocates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER defi_advocates_updated_at
  BEFORE UPDATE ON public.defi_advocates
  FOR EACH ROW
  EXECUTE FUNCTION update_defi_advocates_updated_at();

-- Insert sample data (opcional - descomentar si quieres datos de ejemplo)
/*
INSERT INTO public.defi_advocates (name, slug, bio, location, expertise, track, twitter_url, github_url, is_featured, specializations)
VALUES
  (
    'Juan Pérez',
    'juan-perez',
    'Desarrollador blockchain con 5 años de experiencia en DeFi y smart contracts.',
    'Ciudad de México, México',
    'Smart Contracts, DeFi Protocols',
    'developer_expert',
    'https://twitter.com/juanperez',
    'https://github.com/juanperez',
    true,
    ARRAY['Solidity', 'Rust', 'DeFi', 'Security']
  ),
  (
    'María González',
    'maria-gonzalez',
    'Educadora y creadora de contenido sobre Web3 y DeFi en América Latina.',
    'Guadalajara, México',
    'Educación Web3, Community Building',
    'educator',
    'https://twitter.com/mariagonzalez',
    null,
    true,
    ARRAY['Education', 'Content Creation', 'Community']
  );
*/

-- Comments for documentation
COMMENT ON TABLE public.defi_advocates IS 'Referentes y advocates del ecosistema DeFi en México';
COMMENT ON COLUMN public.defi_advocates.track IS 'Tipo de advocate: developer_expert, community_advocate, researcher, educator, influencer';
COMMENT ON COLUMN public.defi_advocates.display_order IS 'Orden de visualización en la página (menor = primero)';
