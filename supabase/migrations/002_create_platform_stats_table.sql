-- Create platform_stats table for caching statistics
-- Migration: 002_create_platform_stats_table.sql

-- Create the platform_stats table
CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  total_communities INTEGER DEFAULT 0,
  active_communities INTEGER DEFAULT 0,
  total_members INTEGER DEFAULT 0,
  total_events INTEGER DEFAULT 0,
  upcoming_events INTEGER DEFAULT 0,
  total_startups INTEGER DEFAULT 0,
  featured_startups INTEGER DEFAULT 0,
  total_blog_posts INTEGER DEFAULT 0,
  published_posts INTEGER DEFAULT 0,
  draft_posts INTEGER DEFAULT 0,
  last_community_update TIMESTAMP WITH TIME ZONE,
  last_event_update TIMESTAMP WITH TIME ZONE,
  last_startup_update TIMESTAMP WITH TIME ZONE,
  last_blog_update TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS platform_stats_updated_at_idx ON platform_stats(updated_at DESC);

-- Create trigger for updated_at
CREATE TRIGGER update_platform_stats_updated_at 
  BEFORE UPDATE ON platform_stats 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE platform_stats ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow everyone to read platform stats
CREATE POLICY "Allow public read access to platform stats" ON platform_stats
  FOR SELECT USING (true);

-- Allow only admins to modify platform stats
CREATE POLICY "Allow admin modify access" ON platform_stats
  FOR ALL TO authenticated 
  USING (auth.jwt() ->> 'role' = 'admin')
  WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- Insert initial record
INSERT INTO platform_stats (
  total_communities, 
  active_communities, 
  total_members,
  total_events,
  upcoming_events,
  total_startups,
  featured_startups,
  total_blog_posts,
  published_posts,
  draft_posts
) VALUES (0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
ON CONFLICT (id) DO NOTHING;

-- Create a function to automatically update platform stats
CREATE OR REPLACE FUNCTION update_platform_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO platform_stats (
    total_communities,
    active_communities,
    total_members,
    total_events,
    upcoming_events,
    total_startups,
    featured_startups,
    total_blog_posts,
    published_posts,
    draft_posts,
    last_community_update,
    last_event_update,
    last_startup_update,
    last_blog_update
  ) 
  SELECT 
    (SELECT COUNT(*) FROM communities),
    (SELECT COUNT(*) FROM communities WHERE is_active = true),
    (SELECT COALESCE(SUM(member_count), 0) FROM communities WHERE is_active = true),
    (SELECT COUNT(*) FROM events),
    (SELECT COUNT(*) FROM events WHERE is_upcoming = true),
    (SELECT COUNT(*) FROM startups),
    (SELECT COUNT(*) FROM startups WHERE is_featured = true),
    (SELECT COUNT(*) FROM blog_posts),
    (SELECT COUNT(*) FROM blog_posts WHERE published = true),
    (SELECT COUNT(*) FROM blog_posts WHERE published = false),
    (SELECT MAX(updated_at) FROM communities),
    (SELECT MAX(updated_at) FROM events),
    (SELECT MAX(updated_at) FROM startups),
    (SELECT MAX(updated_at) FROM blog_posts)
  ON CONFLICT (id) DO UPDATE SET
    total_communities = EXCLUDED.total_communities,
    active_communities = EXCLUDED.active_communities,
    total_members = EXCLUDED.total_members,
    total_events = EXCLUDED.total_events,
    upcoming_events = EXCLUDED.upcoming_events,
    total_startups = EXCLUDED.total_startups,
    featured_startups = EXCLUDED.featured_startups,
    total_blog_posts = EXCLUDED.total_blog_posts,
    published_posts = EXCLUDED.published_posts,
    draft_posts = EXCLUDED.draft_posts,
    last_community_update = EXCLUDED.last_community_update,
    last_event_update = EXCLUDED.last_event_update,
    last_startup_update = EXCLUDED.last_startup_update,
    last_blog_update = EXCLUDED.last_blog_update,
    updated_at = NOW();
END;
$$;

-- Add helpful comments
COMMENT ON TABLE platform_stats IS 'Cached platform statistics for dashboard and analytics';
COMMENT ON COLUMN platform_stats.total_members IS 'Sum of all community member counts';
COMMENT ON FUNCTION update_platform_stats() IS 'Function to refresh platform statistics from source tables';