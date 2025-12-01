-- ===================================================================
-- MERCADO LP GAME - Database Schema
-- Game progress tracking for DeFi Hub Mexico
-- ===================================================================

-- Create game_progress table
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,

  -- Player Stats
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  reputation INTEGER DEFAULT 10,
  swap_count INTEGER DEFAULT 0,
  total_fees_earned DECIMAL(18, 2) DEFAULT 0,

  -- Inventory (stored as JSONB)
  inventory JSONB DEFAULT '{}'::jsonb,

  -- LP Positions (stored as JSONB array)
  lp_positions JSONB DEFAULT '[]'::jsonb,

  -- Badges (stored as JSONB array)
  badges JSONB DEFAULT '[]'::jsonb,

  -- Completed Challenges (stored as array of strings)
  completed_challenges TEXT[] DEFAULT ARRAY[]::TEXT[],

  -- Tutorial Progress (stored as JSONB)
  tutorial_progress JSONB DEFAULT '{}'::jsonb,

  -- Player Stats (detailed tracking)
  stats JSONB DEFAULT jsonb_build_object(
    'totalSwapVolume', 0,
    'profitableSwaps', 0,
    'totalLPProvided', 0,
    'tokensCreated', 0,
    'auctionBidsPlaced', 0,
    'auctionTokensWon', 0
  ),

  -- Streaks
  last_played_date DATE,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,

  -- Game State (pools and tokens - stored as JSONB)
  pools JSONB DEFAULT '[]'::jsonb,
  tokens JSONB DEFAULT '[]'::jsonb,

  -- Current Level
  current_level INTEGER DEFAULT 1,

  -- Daily XP Tracking (UTC-based)
  daily_xp INTEGER DEFAULT 0,
  daily_xp_date TEXT, -- ISO date string in UTC (YYYY-MM-DD)

  -- Player Avatar
  avatar TEXT DEFAULT '/player.png',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint: one save per user
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON public.game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_xp ON public.game_progress(xp DESC);
CREATE INDEX IF NOT EXISTS idx_game_progress_level ON public.game_progress(level DESC);

-- Create leaderboard view
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

-- RLS (Row Level Security) Policies
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own game progress
CREATE POLICY "Users can view own game progress"
  ON public.game_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own game progress
CREATE POLICY "Users can create own game progress"
  ON public.game_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own game progress
CREATE POLICY "Users can update own game progress"
  ON public.game_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own game progress
CREATE POLICY "Users can delete own game progress"
  ON public.game_progress
  FOR DELETE
  USING (auth.uid() = user_id);

-- Policy: Everyone can view leaderboard (public read)
CREATE POLICY "Anyone can view leaderboard"
  ON public.game_progress
  FOR SELECT
  USING (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_game_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to call the function before update
DROP TRIGGER IF EXISTS trigger_update_game_progress_updated_at ON public.game_progress;
CREATE TRIGGER trigger_update_game_progress_updated_at
  BEFORE UPDATE ON public.game_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.update_game_progress_updated_at();

-- Function to automatically create game progress for new users
CREATE OR REPLACE FUNCTION public.create_initial_game_progress()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.game_progress (
    user_id,
    inventory,
    xp,
    level,
    reputation
  ) VALUES (
    NEW.id,
    jsonb_build_object(
      'peso', 500,
      'mango', 50,
      'limon', 50,
      'sandia', 30,
      'platano', 40
    ),
    0,
    1,
    10
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- If already exists, do nothing
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create initial game progress on user signup (optional - uncomment if needed)
-- DROP TRIGGER IF EXISTS trigger_create_initial_game_progress ON auth.users;
-- CREATE TRIGGER trigger_create_initial_game_progress
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.create_initial_game_progress();

-- Grant permissions
GRANT SELECT ON public.game_leaderboard TO anon, authenticated;
GRANT ALL ON public.game_progress TO authenticated;

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON TABLE public.game_progress IS 'Stores player progress for Mercado LP educational game';
COMMENT ON COLUMN public.game_progress.inventory IS 'Player inventory stored as JSONB {tokenId: amount}';
COMMENT ON COLUMN public.game_progress.lp_positions IS 'Liquidity provider positions stored as JSONB array';
COMMENT ON COLUMN public.game_progress.badges IS 'Unlocked achievements/badges stored as JSONB array';
COMMENT ON COLUMN public.game_progress.stats IS 'Detailed player statistics for gamification';
COMMENT ON COLUMN public.game_progress.pools IS 'Current game pools state stored as JSONB';
COMMENT ON COLUMN public.game_progress.tokens IS 'Current game tokens state stored as JSONB';
COMMENT ON COLUMN public.game_progress.daily_xp IS 'XP earned today (UTC-based), resets daily';
COMMENT ON COLUMN public.game_progress.daily_xp_date IS 'Date string (YYYY-MM-DD) in UTC for daily XP tracking';
COMMENT ON COLUMN public.game_progress.avatar IS 'Player avatar URL for the game';
