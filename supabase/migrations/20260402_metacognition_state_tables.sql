-- Market snapshots for funding velocity, OI velocity, taker imbalance
CREATE TABLE IF NOT EXISTS agent_market_snapshots (
  symbol text NOT NULL,
  venue text NOT NULL DEFAULT 'okx',
  ts timestamptz NOT NULL DEFAULT now(),
  price numeric,
  funding_rate numeric,
  next_funding_time timestamptz,
  open_interest numeric,
  oi_ccy numeric,
  top_trader_long_pct numeric,
  top_trader_short_pct numeric,
  taker_buy_volume numeric,
  taker_sell_volume numeric,
  regime text,
  source_quality jsonb,
  derived jsonb,
  PRIMARY KEY (symbol, venue, ts)
);

-- Macro events calendar (FOMC, CPI, PCE, GDP)
CREATE TABLE IF NOT EXISTS agent_macro_events (
  event_key text PRIMARY KEY,
  source text NOT NULL,
  event_type text NOT NULL,
  country text DEFAULT 'US',
  title text NOT NULL,
  scheduled_at timestamptz NOT NULL,
  severity smallint DEFAULT 3,
  risk_window_before_min int DEFAULT 120,
  risk_window_after_min int DEFAULT 60,
  state text DEFAULT 'upcoming',
  actual jsonb,
  consensus jsonb,
  previous jsonb,
  updated_at timestamptz DEFAULT now()
);

-- Source health tracking
CREATE TABLE IF NOT EXISTS agent_source_health (
  source text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  ok boolean NOT NULL DEFAULT true,
  latency_ms int,
  freshness_s int,
  records int,
  quality_score numeric,
  error text,
  payload jsonb,
  PRIMARY KEY (source, checked_at)
);

-- Position rechecks (5-min risk watcher audit log)
CREATE TABLE IF NOT EXISTS agent_position_rechecks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid REFERENCES forum_threads(id),
  symbol text NOT NULL,
  direction text NOT NULL,
  checked_at timestamptz DEFAULT now(),
  trigger_type text NOT NULL,
  hard_invalidated boolean DEFAULT false,
  action text DEFAULT 'hold',
  reason text,
  metrics jsonb
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_market_snapshots_symbol_ts ON agent_market_snapshots (symbol, ts DESC);
CREATE INDEX IF NOT EXISTS idx_macro_events_scheduled ON agent_macro_events (scheduled_at);
CREATE INDEX IF NOT EXISTS idx_source_health_source ON agent_source_health (source, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_position_rechecks_thread ON agent_position_rechecks (thread_id, checked_at DESC);
