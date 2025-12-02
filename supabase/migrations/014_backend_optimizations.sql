-- ===================================================================
-- Migration: Backend Optimizations
-- RPC functions and composite indexes for better performance
-- ===================================================================

-- ===================================================================
-- RPC FUNCTION: Get blog stats efficiently
-- Returns counts by status without transferring all rows
-- ===================================================================
CREATE OR REPLACE FUNCTION get_blog_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'drafts', COUNT(*) FILTER (WHERE status = 'draft'),
    'review', COUNT(*) FILTER (WHERE status = 'review')
  ) INTO result
  FROM blog_posts;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_blog_stats() TO authenticated;

-- ===================================================================
-- RPC FUNCTION: Get dashboard stats efficiently
-- Single query instead of multiple count queries
-- ===================================================================
CREATE OR REPLACE FUNCTION get_dashboard_stats()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  today DATE := CURRENT_DATE;
  last_week DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM profiles),
    'total_startups', (SELECT COUNT(*) FROM startups WHERE status = 'approved'),
    'upcoming_events', (SELECT COUNT(*) FROM events WHERE date >= today),
    'published_posts', (SELECT COUNT(*) FROM blog_posts WHERE status = 'published'),
    'weekly_new_users', (SELECT COUNT(*) FROM profiles WHERE created_at >= last_week)
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_dashboard_stats() TO authenticated;

-- ===================================================================
-- COMPOSITE INDEXES for common query patterns
-- ===================================================================

-- Communities: Featured + Active + Member count (for homepage listings)
CREATE INDEX IF NOT EXISTS idx_communities_featured_active_members
ON communities(is_featured DESC, is_active, member_count DESC)
WHERE is_verified = true;

-- Blog posts: Published posts by date (for blog listing)
CREATE INDEX IF NOT EXISTS idx_blog_posts_published_date
ON blog_posts(published_at DESC, status)
WHERE status = 'published';

-- Blog posts: Author lookup with status
CREATE INDEX IF NOT EXISTS idx_blog_posts_author_status
ON blog_posts(author, status, created_at DESC);

-- Startups: Status + Featured (for directory)
CREATE INDEX IF NOT EXISTS idx_startups_status_featured
ON startups(status, is_featured DESC, created_at DESC);

-- Events: Upcoming featured events
CREATE INDEX IF NOT EXISTS idx_events_upcoming_featured
ON events(is_featured DESC, date ASC)
WHERE status = 'published' AND date >= CURRENT_DATE;

-- User roles: Active roles by user (for auth checks)
CREATE INDEX IF NOT EXISTS idx_user_roles_active_user
ON user_roles(user_id, role)
WHERE is_active = true;

-- Game progress: Leaderboard query optimization
CREATE INDEX IF NOT EXISTS idx_game_progress_leaderboard
ON game_progress(xp DESC, level DESC, updated_at DESC);

-- Game progress: Daily XP tracking
CREATE INDEX IF NOT EXISTS idx_game_progress_daily_xp
ON game_progress(daily_xp_date, user_id);

-- ===================================================================
-- COMMENTS
-- ===================================================================

COMMENT ON FUNCTION get_blog_stats() IS 'Efficiently get blog post counts by status';
COMMENT ON FUNCTION get_dashboard_stats() IS 'Get all dashboard stats in a single query';
