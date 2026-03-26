-- ============================================================
-- Universal indicator cache for Bobby Signals asset search
-- Stores OKX indicator payloads + computed technical composite
-- ============================================================

CREATE TABLE IF NOT EXISTS public.indicator_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inst_id text NOT NULL,
  timeframe text NOT NULL DEFAULT '1H',
  inst_type text,
  asset_class text,
  base_symbol text,
  quote_symbol text,
  display_symbol text,
  current_price numeric,
  regime text,
  composite_score numeric,
  conviction numeric,
  agreement numeric,
  signal text,
  direction text,
  indicators jsonb NOT NULL DEFAULT '{}'::jsonb,
  technical jsonb,
  trade_plan jsonb,
  instrument_meta jsonb,
  source text,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (inst_id, timeframe)
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'inst_type') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN inst_type text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'asset_class') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN asset_class text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'base_symbol') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN base_symbol text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'quote_symbol') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN quote_symbol text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'display_symbol') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN display_symbol text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'current_price') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN current_price numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'regime') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN regime text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'composite_score') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN composite_score numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'conviction') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN conviction numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'agreement') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN agreement numeric;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'signal') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN signal text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'direction') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN direction text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'technical') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN technical jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'trade_plan') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN trade_plan jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'instrument_meta') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN instrument_meta jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'source') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN source text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'fetched_at') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN fetched_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'created_at') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN created_at timestamptz NOT NULL DEFAULT now();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'indicator_cache' AND column_name = 'updated_at') THEN
    ALTER TABLE public.indicator_cache ADD COLUMN updated_at timestamptz NOT NULL DEFAULT now();
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_indicator_cache_lookup ON public.indicator_cache (inst_id, timeframe);
CREATE INDEX IF NOT EXISTS idx_indicator_cache_fetched_at ON public.indicator_cache (fetched_at DESC);

ALTER TABLE public.indicator_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read indicator_cache" ON public.indicator_cache;
CREATE POLICY "Public read indicator_cache"
  ON public.indicator_cache
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Service insert indicator_cache" ON public.indicator_cache;
CREATE POLICY "Service insert indicator_cache"
  ON public.indicator_cache
  FOR INSERT
  WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service update indicator_cache" ON public.indicator_cache;
CREATE POLICY "Service update indicator_cache"
  ON public.indicator_cache
  FOR UPDATE
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
