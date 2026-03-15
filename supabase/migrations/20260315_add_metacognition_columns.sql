-- Migration: Add metacognition columns to agent_cycles
-- Purpose: Enable Safe Mode win-rate tracking, Adaptive Mood, and Dynamic Conviction logging
-- Run this in Supabase SQL Editor when the project is active

ALTER TABLE agent_cycles
  ADD COLUMN IF NOT EXISTS trades_successful integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS mood text DEFAULT 'confident',
  ADD COLUMN IF NOT EXISTS dynamic_conviction numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS safe_mode_active boolean DEFAULT false;

COMMENT ON COLUMN agent_cycles.trades_successful IS 'Number of profitable trades in this cycle (for win rate / Safe Mode)';
COMMENT ON COLUMN agent_cycles.mood IS 'Agent mood: confident (>70% win), cautious (50-70%), defensive (<50%)';
COMMENT ON COLUMN agent_cycles.dynamic_conviction IS 'Average dynamic conviction score for this cycle';
COMMENT ON COLUMN agent_cycles.safe_mode_active IS 'Whether Safe Mode was active during this cycle';

-- Key-value config table for agent state persistence (optimized prompts, etc.)
CREATE TABLE IF NOT EXISTS agent_config (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE agent_config IS 'Key-value store for persistent agent state (self-optimized prompts, feature flags, etc.)';

-- User interest tracking: what assets the user is watching
-- Bobby saves these automatically when the user asks about an asset
-- The Watchdog compares market signals against these interests every 15 min
CREATE TABLE IF NOT EXISTS user_interests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  asset text NOT NULL,
  context text,
  target_threshold numeric DEFAULT 0.75,
  last_conviction numeric DEFAULT 0,
  last_notified_at timestamptz,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_interests_asset ON user_interests(asset);
CREATE INDEX IF NOT EXISTS idx_user_interests_wallet ON user_interests(wallet_address);

COMMENT ON TABLE user_interests IS 'Assets the user is actively watching — Bobby auto-saves when you ask about a token, Watchdog checks every 15min';
