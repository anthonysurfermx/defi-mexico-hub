import { supabase } from '@/lib/supabase';
import type { PlayerState, Pool, Token } from '../types/game';

export interface GameProgressData {
  user_id: string;
  xp: number;
  level: number;
  reputation: number;
  swap_count: number;
  total_fees_earned: number;
  inventory: Record<string, number>;
  lp_positions: any[];
  badges: any[];
  completed_challenges: string[];
  tutorial_progress: Record<string, boolean>;
  stats: {
    totalSwapVolume: number;
    profitableSwaps: number;
    totalLPProvided: number;
    tokensCreated: number;
    auctionBidsPlaced: number;
    auctionTokensWon: number;
  };
  last_played_date?: string;
  current_streak: number;
  best_streak: number;
  pools: Pool[];
  tokens: Token[];
  current_level: number;
}

/**
 * Loads game progress from Supabase for the current user
 */
export async function loadGameProgress(): Promise<GameProgressData | null> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No user logged in, using local storage');
      return null;
    }

    const { data, error } = await supabase
      .from('game_progress')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No row found - first time playing
        console.log('No game progress found for user, will create on first save');
        return null;
      }
      throw error;
    }

    console.log('✅ Game progress loaded from Supabase');
    return data as GameProgressData;
  } catch (error) {
    console.error('Error loading game progress:', error);
    return null;
  }
}

/**
 * Saves game progress to Supabase for the current user
 */
export async function saveGameProgress(
  player: PlayerState,
  pools: Pool[],
  tokens: Token[],
  currentLevel: number
): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No user logged in, skipping Supabase save');
      return false;
    }

    const gameData: Partial<GameProgressData> = {
      user_id: user.id,
      xp: player.xp,
      level: player.level,
      reputation: player.reputation,
      swap_count: player.swapCount,
      total_fees_earned: player.totalFeesEarned,
      inventory: player.inventory,
      lp_positions: player.lpPositions,
      badges: player.badges,
      completed_challenges: player.completedChallenges,
      tutorial_progress: player.tutorialProgress,
      stats: player.stats,
      last_played_date: player.lastPlayedDate,
      current_streak: player.currentStreak,
      best_streak: player.bestStreak,
      pools,
      tokens,
      current_level: currentLevel,
    };

    const { error } = await supabase
      .from('game_progress')
      .upsert(gameData, {
        onConflict: 'user_id'
      });

    if (error) {
      throw error;
    }

    console.log('✅ Game progress saved to Supabase');
    return true;
  } catch (error) {
    console.error('Error saving game progress:', error);
    return false;
  }
}

/**
 * Gets the game leaderboard
 */
export async function getLeaderboard(limit = 10) {
  try {
    const { data, error } = await supabase
      .from('game_leaderboard')
      .select('*')
      .limit(limit);

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }
}

/**
 * Deletes game progress for the current user (reset game)
 */
export async function resetGameProgress(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.log('No user logged in');
      return false;
    }

    const { error } = await supabase
      .from('game_progress')
      .delete()
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }

    console.log('✅ Game progress reset');
    return true;
  } catch (error) {
    console.error('Error resetting game progress:', error);
    return false;
  }
}
