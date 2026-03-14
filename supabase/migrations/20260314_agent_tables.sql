-- ============================================================
-- Agent Radar Autonomous — Supabase Schema
-- Tracks: cycles, trades, positions, raw signals
-- Run this in Supabase SQL Editor or via CLI
-- ============================================================

-- Agent execution cycles (every 8 hours)
CREATE TABLE agent_cycles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  started_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ,
  signals_found INT DEFAULT 0,
  signals_filtered INT DEFAULT 0,
  llm_decisions INT DEFAULT 0,
  trades_executed INT DEFAULT 0,
  trades_blocked INT DEFAULT 0,
  total_usd_deployed NUMERIC(12,2) DEFAULT 0,
  latency_ms INT,
  llm_model TEXT,
  llm_reasoning TEXT,
  error TEXT,
  status TEXT DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed'))
);

-- Individual trade executions
CREATE TABLE agent_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES agent_cycles(id) ON DELETE CASCADE,
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('BUY', 'SELL')),
  amount_usd NUMERIC(12,2) NOT NULL,
  entry_price NUMERIC(24,12),
  tx_hash TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed', 'simulated')),
  llm_reasoning TEXT,
  confidence NUMERIC(3,2),
  signal_sources TEXT[],
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Live position tracking
CREATE TABLE agent_positions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  chain TEXT NOT NULL,
  token_address TEXT NOT NULL,
  token_symbol TEXT NOT NULL,
  entry_price NUMERIC(24,12) NOT NULL,
  amount NUMERIC(24,12) NOT NULL,
  amount_usd NUMERIC(12,2) NOT NULL,
  current_price NUMERIC(24,12),
  unrealized_pnl NUMERIC(12,2),
  stop_loss_pct NUMERIC(5,2) DEFAULT 15,
  take_profit_pct NUMERIC(5,2) DEFAULT 50,
  opened_at TIMESTAMPTZ DEFAULT now(),
  closed_at TIMESTAMPTZ,
  close_reason TEXT
);

-- Raw signal archive (for backtesting and dashboard)
CREATE TABLE agent_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cycle_id UUID REFERENCES agent_cycles(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('okx_dex_signal', 'polymarket', 'okx_trenches', 'okx_cex')),
  chain TEXT,
  token_symbol TEXT,
  token_address TEXT,
  signal_type TEXT,
  amount_usd NUMERIC(12,2),
  sold_ratio_pct NUMERIC(5,2),
  confidence NUMERIC(3,2),
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_agent_cycles_status ON agent_cycles(status);
CREATE INDEX idx_agent_cycles_started ON agent_cycles(started_at DESC);
CREATE INDEX idx_agent_trades_cycle ON agent_trades(cycle_id);
CREATE INDEX idx_agent_trades_created ON agent_trades(created_at DESC);
CREATE INDEX idx_agent_positions_open ON agent_positions(closed_at) WHERE closed_at IS NULL;
CREATE INDEX idx_agent_signals_cycle ON agent_signals(cycle_id);
CREATE INDEX idx_agent_signals_created ON agent_signals(created_at DESC);

-- RLS: public read, service write
ALTER TABLE agent_cycles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_positions ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read agent_cycles" ON agent_cycles FOR SELECT USING (true);
CREATE POLICY "Public read agent_trades" ON agent_trades FOR SELECT USING (true);
CREATE POLICY "Public read agent_positions" ON agent_positions FOR SELECT USING (true);
CREATE POLICY "Public read agent_signals" ON agent_signals FOR SELECT USING (true);

CREATE POLICY "Service write agent_cycles" ON agent_cycles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write agent_trades" ON agent_trades FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write agent_positions" ON agent_positions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service write agent_signals" ON agent_signals FOR ALL USING (true) WITH CHECK (true);
