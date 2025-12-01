-- ===================================================================
-- Migration: Add daily XP tracking columns to game_progress
-- Adds UTC-based daily XP cap tracking for Mercado LP game
-- ===================================================================

-- Add daily XP tracking columns
ALTER TABLE public.game_progress
ADD COLUMN IF NOT EXISTS daily_xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_xp_date TEXT, -- ISO date string in UTC (YYYY-MM-DD)
ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '/player.png';

-- Create index for leaderboard queries that include daily activity
CREATE INDEX IF NOT EXISTS idx_game_progress_daily_xp_date
ON public.game_progress(daily_xp_date);

-- Update the leaderboard view to include avatar
DROP VIEW IF EXISTS public.game_leaderboard;
CREATE OR REPLACE VIEW public.game_leaderboard AS
SELECT
  gp.user_id,
  COALESCE(p.full_name, 'Jugador Anónimo') as full_name,
  p.email,
  COALESCE(gp.avatar, '/player.png') as avatar_url,
  gp.xp,
  gp.level,
  gp.reputation,
  gp.swap_count,
  gp.total_fees_earned,
  gp.current_streak,
  gp.best_streak,
  gp.daily_xp,
  gp.daily_xp_date,
  jsonb_array_length(gp.badges) as badge_count,
  gp.updated_at
FROM public.game_progress gp
LEFT JOIN public.profiles p ON gp.user_id = p.id
ORDER BY gp.xp DESC
LIMIT 100;

-- Re-grant permissions for the updated view
GRANT SELECT ON public.game_leaderboard TO anon, authenticated;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON COLUMN public.game_progress.daily_xp IS 'XP earned today (UTC-based), resets daily';
COMMENT ON COLUMN public.game_progress.daily_xp_date IS 'Date string (YYYY-MM-DD) in UTC for daily XP tracking';
COMMENT ON COLUMN public.game_progress.avatar IS 'Player avatar URL for the game';
