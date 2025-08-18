-- Create communities table with proper indexes and RLS
-- Migration: 001_create_communities_table.sql

-- Create the communities table
CREATE TABLE IF NOT EXISTS communities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  banner_url TEXT,
  website TEXT,
  location TEXT,
  category TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  member_count INTEGER DEFAULT 0 CHECK (member_count >= 0),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  founded_date DATE,
  social_links JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS communities_slug_idx ON communities(slug);
CREATE INDEX IF NOT EXISTS communities_category_idx ON communities(category);
CREATE INDEX IF NOT EXISTS communities_location_idx ON communities(location);
CREATE INDEX IF NOT EXISTS communities_is_featured_idx ON communities(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS communities_is_active_idx ON communities(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS communities_member_count_idx ON communities(member_count DESC);
CREATE INDEX IF NOT EXISTS communities_created_at_idx ON communities(created_at DESC);
CREATE INDEX IF NOT EXISTS communities_tags_gin_idx ON communities USING GIN(tags);

-- Create a text search index for name and description
CREATE INDEX IF NOT EXISTS communities_search_idx ON communities USING GIN(
  to_tsvector('spanish', name || ' ' || description || ' ' || COALESCE(location, ''))
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_communities_updated_at 
  BEFORE UPDATE ON communities 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE communities ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read active communities
CREATE POLICY "Allow public read access to active communities" ON communities
  FOR SELECT USING (is_active = true);

-- Allow authenticated users to read all communities
CREATE POLICY "Allow authenticated read access to all communities" ON communities
  FOR SELECT TO authenticated USING (true);

-- Allow admins to do everything
CREATE POLICY "Allow admin full access" ON communities
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Allow moderators to update (but not delete)
CREATE POLICY "Allow moderator update access" ON communities
  FOR UPDATE TO authenticated 
  USING (auth.jwt() ->> 'role' IN ('admin', 'moderator'))
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'moderator'));

-- Insert seed data
INSERT INTO communities (name, description, slug, category, location, tags, member_count, is_featured) VALUES
('DeFi México CDMX', 'Comunidad principal de DeFi en la Ciudad de México. Organizamos meetups, workshops y eventos educativos sobre finanzas descentralizadas.', 'defi-mexico-cdmx', 'DeFi', 'Ciudad de México', ARRAY['defi', 'blockchain', 'ethereum', 'meetup'], 450, true),
('Blockchain Guadalajara', 'Comunidad de desarrolladores y entusiastas de blockchain en Guadalajara. Enfocados en desarrollo y adopción de tecnología blockchain.', 'blockchain-guadalajara', 'Blockchain', 'Guadalajara', ARRAY['blockchain', 'desarrollo', 'smart-contracts'], 280, true),
('NFT Creators México', 'Espacio para artistas, creadores y coleccionistas de NFTs en México. Colaboraciones, educación y networking.', 'nft-creators-mexico', 'NFT', 'Nacional', ARRAY['nft', 'arte', 'metaverso', 'creators'], 320, true),
('Crypto Trading México', 'Comunidad de traders e inversores en criptomonedas. Análisis técnico, estrategias de inversión y educación financiera.', 'crypto-trading-mexico', 'Trading', 'Nacional', ARRAY['trading', 'inversión', 'análisis-técnico'], 180, false),
('Web3 Developers MX', 'Desarrolladores mexicanos construyendo el futuro de Web3. Talleres técnicos, hackathons y proyectos colaborativos.', 'web3-developers-mx', 'Desarrollo', 'Nacional', ARRAY['web3', 'desarrollo', 'dapps', 'solidity'], 150, true),
('DeFi Monterrey', 'Hub de DeFi en Monterrey. Conectando empresarios, desarrolladores e inversionistas en el ecosistema de finanzas descentralizadas.', 'defi-monterrey', 'DeFi', 'Monterrey', ARRAY['defi', 'fintech', 'startups'], 95, false)
ON CONFLICT (slug) DO NOTHING;

-- Add helpful comments
COMMENT ON TABLE communities IS 'Communities within the DeFi México ecosystem';
COMMENT ON COLUMN communities.slug IS 'URL-friendly identifier for the community';
COMMENT ON COLUMN communities.member_count IS 'Current number of active members';
COMMENT ON COLUMN communities.social_links IS 'JSON object containing social media links (telegram, discord, twitter, etc.)';
COMMENT ON COLUMN communities.tags IS 'Array of tags for categorization and search';
COMMENT ON COLUMN communities.founded_date IS 'Date when the community was founded';