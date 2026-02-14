-- Migration: Create defi_chart_cache table for caching DeFi Llama Pro API data
-- Used by the DeFi Charts Service to render interactive, branded charts in blog articles

CREATE TABLE IF NOT EXISTS defi_chart_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chart_type TEXT NOT NULL,
  identifier TEXT NOT NULL,
  data JSONB NOT NULL DEFAULT '[]'::jsonb,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (chart_type, identifier)
);

-- Index for fast lookups
CREATE INDEX idx_defi_chart_cache_lookup ON defi_chart_cache (chart_type, identifier);

-- RLS
ALTER TABLE defi_chart_cache ENABLE ROW LEVEL SECURITY;

-- Anyone can read cached chart data
CREATE POLICY "anon_select_defi_chart_cache" ON defi_chart_cache
  FOR SELECT USING (true);

-- Only service_role can insert/update (edge functions)
CREATE POLICY "service_insert_defi_chart_cache" ON defi_chart_cache
  FOR INSERT WITH CHECK (true);

CREATE POLICY "service_update_defi_chart_cache" ON defi_chart_cache
  FOR UPDATE USING (true);
