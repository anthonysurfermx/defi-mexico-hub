-- ============================================================
-- User Digests: Bobby's autonomous analysis summaries
-- "Mientras dormías..." — works for ALL users (with or without positions)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_digests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES public.agent_cycles(id),
  thread_id uuid,
  wallet_address text,  -- NULL = global digest (for anonymous users)
  summary text NOT NULL,
  highlights jsonb DEFAULT '[]'::jsonb,  -- [{symbol, direction, conviction, verdict}]
  positions_snapshot jsonb,  -- Current OKX positions at time of digest (NULL if none)
  market_snapshot jsonb,  -- {regime, fgi, dxy, btcPrice, ethPrice}
  language text DEFAULT 'en',
  kind text DEFAULT 'scheduled' CHECK (kind IN ('scheduled', 'morning', 'alert', 'manual')),
  delivered_at timestamptz,
  viewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Fast queries for frontend
CREATE INDEX IF NOT EXISTS idx_user_digests_wallet ON public.user_digests(wallet_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_digests_global ON public.user_digests(created_at DESC) WHERE wallet_address IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_digests_cycle ON public.user_digests(cycle_id);

-- RLS: anyone can read, only service can write
ALTER TABLE public.user_digests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read digests" ON public.user_digests FOR SELECT USING (true);
CREATE POLICY "Service write digests" ON public.user_digests FOR INSERT WITH CHECK (true);
CREATE POLICY "Service update digests" ON public.user_digests FOR UPDATE USING (true);

-- Add cycle_id and kind to forum_threads (link debates to cycles)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_threads' AND column_name = 'cycle_id') THEN
    ALTER TABLE public.forum_threads ADD COLUMN cycle_id uuid REFERENCES public.agent_cycles(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'forum_threads' AND column_name = 'kind') THEN
    ALTER TABLE public.forum_threads ADD COLUMN kind text DEFAULT 'scheduled';
  END IF;
END $$;
