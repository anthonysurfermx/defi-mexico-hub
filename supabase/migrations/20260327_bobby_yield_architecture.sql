-- ============================================================
-- Bobby Yield-While-You-Wait
-- Debate + logging schema for idle capital parking
-- Phase 1 stores recommendations and lifecycle intent only.
-- Future execution upgrades the same rows to deployed/withdrawn.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.agent_yield_positions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES public.agent_cycles(id) ON DELETE SET NULL,
  thread_id uuid,
  status text NOT NULL DEFAULT 'recommended'
    CHECK (status IN ('recommended', 'deployed', 'withdrawing', 'withdrawn', 'cancelled', 'failed')),
  venue_type text NOT NULL DEFAULT 'defi_onchain'
    CHECK (venue_type IN ('defi_onchain', 'okx_earn')),
  funding_source text NOT NULL DEFAULT 'okx_cex'
    CHECK (funding_source IN ('okx_cex', 'okx_onchain_wallet', 'mixed')),
  wallet_address text,
  investment_id text,
  platform text NOT NULL,
  chain text NOT NULL,
  token text NOT NULL,
  product_group text,
  principal_token_amount numeric(24,12),
  principal_usd numeric(12,2) NOT NULL DEFAULT 0,
  cash_buffer_usd numeric(12,2) NOT NULL DEFAULT 0,
  target_apy numeric(8,4),
  risk_score numeric(5,2),
  max_exit_seconds integer,
  selection_rationale text,
  verdict_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  deposited_at timestamptz,
  withdrawn_at timestamptz,
  yield_earned_usd numeric(12,2) NOT NULL DEFAULT 0,
  exit_reason text,
  last_synced_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_yield_positions IS 'Lifecycle record for Bobby idle-cash yield allocations. Status=recommended means debated and approved but not yet funded.';
COMMENT ON COLUMN public.agent_yield_positions.verdict_json IS 'Structured CIO yield verdict captured at recommendation time.';

CREATE INDEX IF NOT EXISTS idx_agent_yield_positions_status
  ON public.agent_yield_positions(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_yield_positions_cycle
  ON public.agent_yield_positions(cycle_id);
CREATE INDEX IF NOT EXISTS idx_agent_yield_positions_active
  ON public.agent_yield_positions(created_at DESC)
  WHERE status IN ('recommended', 'deployed', 'withdrawing');

CREATE TABLE IF NOT EXISTS public.agent_yield_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cycle_id uuid REFERENCES public.agent_cycles(id) ON DELETE SET NULL,
  position_id uuid REFERENCES public.agent_yield_positions(id) ON DELETE SET NULL,
  thread_id uuid,
  event_type text NOT NULL
    CHECK (event_type IN (
      'debate_started',
      'recommended',
      'deposit_requested',
      'deposit_confirmed',
      'withdraw_requested',
      'withdraw_confirmed',
      'skipped',
      'cancelled',
      'sync',
      'error'
    )),
  actor text NOT NULL DEFAULT 'system'
    CHECK (actor IN ('alpha', 'redteam', 'cio', 'system', 'executor')),
  status text NOT NULL DEFAULT 'logged'
    CHECK (status IN ('pending', 'logged', 'completed', 'failed')),
  amount_usd numeric(12,2),
  token_amount numeric(24,12),
  apy numeric(8,4),
  reason text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.agent_yield_events IS 'Append-only audit log for yield debates, recommendations, deposits, withdrawals, and sync/errors.';

CREATE INDEX IF NOT EXISTS idx_agent_yield_events_cycle
  ON public.agent_yield_events(cycle_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_yield_events_position
  ON public.agent_yield_events(position_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_yield_events_type
  ON public.agent_yield_events(event_type, created_at DESC);

ALTER TABLE public.agent_cycles
  ADD COLUMN IF NOT EXISTS idle_cash_usd numeric(12,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS yield_debate_triggered boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS yield_recommendation_status text DEFAULT 'none'
    CHECK (yield_recommendation_status IN ('none', 'recommended', 'active', 'skipped')),
  ADD COLUMN IF NOT EXISTS yield_position_id uuid;

COMMENT ON COLUMN public.agent_cycles.idle_cash_usd IS 'Cash available for yield parking after the trade decision.';
COMMENT ON COLUMN public.agent_cycles.yield_debate_triggered IS 'Whether the cycle spawned a secondary yield debate after rejecting a trade.';
COMMENT ON COLUMN public.agent_cycles.yield_recommendation_status IS 'Snapshot status for the cycle: none, recommended, active, or skipped.';
COMMENT ON COLUMN public.agent_cycles.yield_position_id IS 'Latest linked agent_yield_positions row for this cycle.';

ALTER TABLE public.agent_yield_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_yield_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_yield_positions"
  ON public.agent_yield_positions FOR SELECT USING (true);
CREATE POLICY "Public read agent_yield_events"
  ON public.agent_yield_events FOR SELECT USING (true);

CREATE POLICY "Service write agent_yield_positions"
  ON public.agent_yield_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write agent_yield_events"
  ON public.agent_yield_events FOR ALL USING (true) WITH CHECK (true);
