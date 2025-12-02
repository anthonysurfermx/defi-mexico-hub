-- ===================================================================
-- Migration: Global Search RPC Function
-- Efficient unified search across all content types
-- ===================================================================

-- ===================================================================
-- RPC FUNCTION: Global search across multiple tables
-- Returns up to 3 results per category, searched server-side
-- ===================================================================
CREATE OR REPLACE FUNCTION global_search(search_query TEXT, result_limit INTEGER DEFAULT 3)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  result JSON;
  clean_query TEXT;
BEGIN
  -- Sanitize and prepare search query
  clean_query := '%' || LOWER(TRIM(search_query)) || '%';

  -- Return empty if query too short
  IF LENGTH(TRIM(search_query)) < 2 THEN
    RETURN json_build_object(
      'startups', '[]'::json,
      'communities', '[]'::json,
      'events', '[]'::json,
      'blogPosts', '[]'::json,
      'advocates', '[]'::json
    );
  END IF;

  SELECT json_build_object(
    'startups', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (
        SELECT id, name, slug, COALESCE(description, '') as description, logo_url, COALESCE(category, '') as category
        FROM startups
        WHERE status = 'published'
          AND (
            LOWER(COALESCE(name, '')) LIKE clean_query
            OR LOWER(COALESCE(description, '')) LIKE clean_query
            OR LOWER(COALESCE(category, '')) LIKE clean_query
          )
        ORDER BY is_featured DESC, created_at DESC
        LIMIT result_limit
      ) s
    ),
    'communities', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT id, name, slug, COALESCE(description, '') as description, image_url, COALESCE(category, '') as category
        FROM communities
        WHERE is_verified = true
          AND (
            LOWER(COALESCE(name, '')) LIKE clean_query
            OR LOWER(COALESCE(description, '')) LIKE clean_query
            OR LOWER(COALESCE(category, '')) LIKE clean_query
          )
        ORDER BY is_featured DESC, member_count DESC
        LIMIT result_limit
      ) c
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT id, title, slug, COALESCE(description, '') as description, image_url, COALESCE(venue_city, '') as venue_city, start_date
        FROM events
        WHERE status = 'published'
          AND (
            LOWER(COALESCE(title, '')) LIKE clean_query
            OR LOWER(COALESCE(description, '')) LIKE clean_query
            OR LOWER(COALESCE(venue_city, '')) LIKE clean_query
            OR LOWER(COALESCE(venue_name, '')) LIKE clean_query
          )
        ORDER BY is_featured DESC, start_date DESC
        LIMIT result_limit
      ) e
    ),
    'blogPosts', (
      SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
      FROM (
        SELECT id, title, slug, COALESCE(excerpt, '') as excerpt, COALESCE(image_url, featured_image) as image_url, COALESCE(category, '') as category, COALESCE(author, '') as author
        FROM blog_posts
        WHERE status = 'published'
          AND (
            LOWER(COALESCE(title, '')) LIKE clean_query
            OR LOWER(COALESCE(excerpt, '')) LIKE clean_query
            OR LOWER(COALESCE(content, '')) LIKE clean_query
          )
        ORDER BY is_featured DESC, published_at DESC
        LIMIT result_limit
      ) b
    ),
    'advocates', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT id, name, slug, COALESCE(bio, '') as bio, avatar_url, COALESCE(expertise, '') as expertise
        FROM defi_advocates
        WHERE is_active = true
          AND (
            LOWER(COALESCE(name, '')) LIKE clean_query
            OR LOWER(COALESCE(bio, '')) LIKE clean_query
            OR LOWER(COALESCE(expertise, '')) LIKE clean_query
          )
        ORDER BY is_featured DESC, created_at DESC
        LIMIT result_limit
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to both anonymous and authenticated users
GRANT EXECUTE ON FUNCTION global_search(TEXT, INTEGER) TO anon, authenticated;

-- ===================================================================
-- INDEXES for search optimization
-- ===================================================================

-- Basic indexes for search columns
CREATE INDEX IF NOT EXISTS idx_startups_name_search ON startups(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_communities_name_search ON communities(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_events_title_search ON events(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_blog_posts_title_search ON blog_posts(LOWER(title));
CREATE INDEX IF NOT EXISTS idx_defi_advocates_name_search ON defi_advocates(LOWER(name));

-- ===================================================================
-- COMMENTS
-- ===================================================================
COMMENT ON FUNCTION global_search(TEXT, INTEGER) IS 'Unified search across startups, communities, events, blog posts and advocates. Returns up to N results per category.';
