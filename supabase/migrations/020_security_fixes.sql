-- =============================================================================
-- SUPABASE SECURITY FIXES - Migration 020
-- =============================================================================
-- This migration applies comprehensive security fixes including:
-- 1. Enable RLS on all tables that need it
-- 2. Create appropriate security policies
-- 3. Fix function search_path vulnerabilities
-- 4. Fix RLS cascading issues
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. ENABLE RLS ON fintech_funds
-- -----------------------------------------------------------------------------
ALTER TABLE public.fintech_funds ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "fintech_funds_select_policy" ON public.fintech_funds;
DROP POLICY IF EXISTS "fintech_funds_admin_insert_policy" ON public.fintech_funds;
DROP POLICY IF EXISTS "fintech_funds_admin_update_policy" ON public.fintech_funds;
DROP POLICY IF EXISTS "fintech_funds_admin_delete_policy" ON public.fintech_funds;

-- Anyone can read fintech funds (public data)
CREATE POLICY "fintech_funds_select_policy" ON public.fintech_funds
  FOR SELECT USING (true);

-- Only admins can insert
CREATE POLICY "fintech_funds_admin_insert_policy" ON public.fintech_funds
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can update
CREATE POLICY "fintech_funds_admin_update_policy" ON public.fintech_funds
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Only admins can delete
CREATE POLICY "fintech_funds_admin_delete_policy" ON public.fintech_funds
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 2. ENABLE RLS ON user_roles
-- -----------------------------------------------------------------------------
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "user_roles_select_own_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_select_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update_policy" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete_policy" ON public.user_roles;

-- Users can read their own role
CREATE POLICY "user_roles_select_own_policy" ON public.user_roles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admins can read all roles
CREATE POLICY "user_roles_admin_select_policy" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- Only admins can manage roles
CREATE POLICY "user_roles_admin_insert_policy" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "user_roles_admin_update_policy" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

CREATE POLICY "user_roles_admin_delete_policy" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 3. ENABLE RLS ON newsletter_subscribers
-- -----------------------------------------------------------------------------
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "newsletter_subscribers_admin_select_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_insert_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_admin_update_policy" ON public.newsletter_subscribers;
DROP POLICY IF EXISTS "newsletter_subscribers_admin_delete_policy" ON public.newsletter_subscribers;

-- Only admins can read subscribers
CREATE POLICY "newsletter_subscribers_admin_select_policy" ON public.newsletter_subscribers
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Anyone can subscribe (insert)
CREATE POLICY "newsletter_subscribers_insert_policy" ON public.newsletter_subscribers
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "newsletter_subscribers_admin_update_policy" ON public.newsletter_subscribers
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "newsletter_subscribers_admin_delete_policy" ON public.newsletter_subscribers
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 4. ENABLE RLS ON analytics_events
-- -----------------------------------------------------------------------------
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "analytics_events_admin_select_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_insert_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_admin_update_policy" ON public.analytics_events;
DROP POLICY IF EXISTS "analytics_events_admin_delete_policy" ON public.analytics_events;

-- Only admins can read analytics
CREATE POLICY "analytics_events_admin_select_policy" ON public.analytics_events
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Anyone can insert analytics events (for tracking)
CREATE POLICY "analytics_events_insert_policy" ON public.analytics_events
  FOR INSERT
  WITH CHECK (true);

-- Only admins can update/delete
CREATE POLICY "analytics_events_admin_update_policy" ON public.analytics_events
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "analytics_events_admin_delete_policy" ON public.analytics_events
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 5. ENABLE RLS ON comments
-- -----------------------------------------------------------------------------
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "comments_select_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_update_own_policy" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_policy" ON public.comments;

-- Anyone can read comments (public)
CREATE POLICY "comments_select_policy" ON public.comments
  FOR SELECT USING (true);

-- Authenticated users can insert their own comments
CREATE POLICY "comments_insert_policy" ON public.comments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can update their own comments
CREATE POLICY "comments_update_own_policy" ON public.comments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

-- Users can delete their own comments, admins can delete any
CREATE POLICY "comments_delete_policy" ON public.comments
  FOR DELETE TO authenticated
  USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 6. ENABLE RLS ON likes
-- -----------------------------------------------------------------------------
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "likes_select_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_policy" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_own_policy" ON public.likes;

-- Anyone can read likes (public counts)
CREATE POLICY "likes_select_policy" ON public.likes
  FOR SELECT USING (true);

-- Authenticated users can insert their own likes
CREATE POLICY "likes_insert_policy" ON public.likes
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own likes (unlike)
CREATE POLICY "likes_delete_own_policy" ON public.likes
  FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 7. ENABLE RLS ON follows
-- -----------------------------------------------------------------------------
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "follows_select_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_insert_policy" ON public.follows;
DROP POLICY IF EXISTS "follows_delete_own_policy" ON public.follows;

-- Anyone can read follows (public)
CREATE POLICY "follows_select_policy" ON public.follows
  FOR SELECT USING (true);

-- Authenticated users can insert their own follows
CREATE POLICY "follows_insert_policy" ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (follower_id = auth.uid());

-- Users can delete their own follows (unfollow)
CREATE POLICY "follows_delete_own_policy" ON public.follows
  FOR DELETE TO authenticated
  USING (follower_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 8. ENABLE RLS ON system_config
-- -----------------------------------------------------------------------------
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "system_config_select_policy" ON public.system_config;
DROP POLICY IF EXISTS "system_config_admin_insert_policy" ON public.system_config;
DROP POLICY IF EXISTS "system_config_admin_update_policy" ON public.system_config;
DROP POLICY IF EXISTS "system_config_admin_delete_policy" ON public.system_config;

-- Anyone can read system config (public settings)
CREATE POLICY "system_config_select_policy" ON public.system_config
  FOR SELECT USING (true);

-- Only admins can modify system config
CREATE POLICY "system_config_admin_insert_policy" ON public.system_config
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "system_config_admin_update_policy" ON public.system_config
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

CREATE POLICY "system_config_admin_delete_policy" ON public.system_config
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- -----------------------------------------------------------------------------
-- 9. FIX game_leaderboard VIEW (Security Definer)
-- -----------------------------------------------------------------------------
-- Drop and recreate the view with SECURITY INVOKER (Postgres 15+)
DROP VIEW IF EXISTS public.game_leaderboard;

CREATE VIEW public.game_leaderboard
WITH (security_invoker = true)
AS
SELECT
  gp.user_id,
  COALESCE(p.full_name, 'Jugador Anónimo'::text) AS full_name,
  p.email,
  COALESCE(gp.avatar, '/player.png'::text) AS avatar_url,
  gp.xp,
  gp.level,
  gp.reputation,
  gp.swap_count,
  gp.total_fees_earned,
  gp.current_streak,
  gp.best_streak,
  gp.daily_xp,
  gp.daily_xp_date,
  jsonb_array_length(gp.badges) AS badge_count,
  gp.updated_at,
  RANK() OVER (ORDER BY gp.xp DESC) as rank
FROM public.game_progress gp
LEFT JOIN public.profiles p ON gp.user_id = p.id
ORDER BY gp.xp DESC
LIMIT 100;

-- Grant appropriate permissions
GRANT SELECT ON public.game_leaderboard TO anon, authenticated;

-- =============================================================================
-- 10. FIX FUNCTION SEARCH_PATH (Security hardening)
-- =============================================================================
-- Adding SET search_path = '' to prevent search_path injection attacks

-- 10.1 enroll_student_in_course
CREATE OR REPLACE FUNCTION public.enroll_student_in_course(p_course_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
DECLARE
  v_enrolled BOOLEAN;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM public.course_enrollments
    WHERE course_id = p_course_id AND user_id = p_user_id
  ) INTO v_enrolled;

  IF NOT v_enrolled THEN
    INSERT INTO public.course_enrollments (course_id, user_id)
    VALUES (p_course_id, p_user_id);

    UPDATE public.courses
    SET enrollments_count = enrollments_count + 1,
        students = students + 1
    WHERE id = p_course_id;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$function$;

-- 10.2 exec_sql (CRITICAL: This function is dangerous, consider removing it)
-- WARNING: This function allows arbitrary SQL execution. If you don't need it, DROP it.
-- If you need it, it should be heavily restricted
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Add security check: only admins can execute
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can execute raw SQL';
  END IF;

  EXECUTE sql;
  RETURN 'OK';
END;
$function$;

-- 10.3 get_blog_stats
CREATE OR REPLACE FUNCTION public.get_blog_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'total', COUNT(*),
    'published', COUNT(*) FILTER (WHERE status = 'published'),
    'drafts', COUNT(*) FILTER (WHERE status = 'draft'),
    'review', COUNT(*) FILTER (WHERE status = 'review')
  ) INTO result
  FROM public.blog_posts;

  RETURN result;
END;
$function$;

-- 10.4 get_dashboard_stats
CREATE OR REPLACE FUNCTION public.get_dashboard_stats()
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result JSON;
  today DATE := CURRENT_DATE;
  last_week DATE := CURRENT_DATE - INTERVAL '7 days';
BEGIN
  SELECT json_build_object(
    'total_users', (SELECT COUNT(*) FROM public.profiles),
    'total_startups', (SELECT COUNT(*) FROM public.startups WHERE status = 'approved'),
    'upcoming_events', (SELECT COUNT(*) FROM public.events WHERE start_date >= today),
    'published_posts', (SELECT COUNT(*) FROM public.blog_posts WHERE status = 'published'),
    'weekly_new_users', (SELECT COUNT(*) FROM public.profiles WHERE created_at >= last_week)
  ) INTO result;

  RETURN result;
END;
$function$;

-- 10.5 global_search
CREATE OR REPLACE FUNCTION public.global_search(search_query text, result_limit integer DEFAULT 3)
RETURNS json
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
  result JSON;
  clean_query TEXT;
BEGIN
  clean_query := '%' || LOWER(TRIM(search_query)) || '%';

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
        SELECT id, name, slug, description, logo_url, category
        FROM public.startups
        WHERE status = 'published'
          AND (LOWER(name) LIKE clean_query OR LOWER(description) LIKE clean_query OR LOWER(COALESCE(category::text, '')) LIKE clean_query)
        ORDER BY is_featured DESC, created_at DESC
        LIMIT result_limit
      ) s
    ),
    'communities', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (
        SELECT id, name, slug, description, image_url, category
        FROM public.communities
        WHERE is_verified = true
          AND (LOWER(name) LIKE clean_query OR LOWER(description) LIKE clean_query)
        ORDER BY is_featured DESC, member_count DESC
        LIMIT result_limit
      ) c
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (
        SELECT id, title, slug, description, image_url, venue_city, start_date
        FROM public.events
        WHERE status = 'published'
          AND (LOWER(title) LIKE clean_query OR LOWER(description) LIKE clean_query OR LOWER(COALESCE(venue_city, '')) LIKE clean_query)
        ORDER BY is_featured DESC, start_date DESC
        LIMIT result_limit
      ) e
    ),
    'blogPosts', (
      SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
      FROM (
        SELECT id, title, slug, excerpt, COALESCE(image_url, featured_image) as image_url, category, author
        FROM public.blog_posts
        WHERE status = 'published'
          AND (LOWER(title) LIKE clean_query OR LOWER(COALESCE(excerpt, '')) LIKE clean_query OR LOWER(content) LIKE clean_query)
        ORDER BY is_featured DESC, published_at DESC
        LIMIT result_limit
      ) b
    ),
    'advocates', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (
        SELECT id, name, slug, bio, avatar_url, expertise, specializations
        FROM public.defi_advocates
        WHERE is_active = true
          AND (LOWER(name) LIKE clean_query OR LOWER(COALESCE(bio, '')) LIKE clean_query OR LOWER(COALESCE(expertise, '')) LIKE clean_query)
        ORDER BY is_featured DESC, created_at DESC
        LIMIT result_limit
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$function$;

-- 10.6 handle_new_user
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$function$;

-- 10.7 increment_counter
CREATE OR REPLACE FUNCTION public.increment_counter(table_name text, column_name text, record_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  EXECUTE format(
    'UPDATE public.%I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1',
    table_name, column_name, column_name
  ) USING record_id;
END;
$function$;

-- 10.8 increment_course_views
CREATE OR REPLACE FUNCTION public.increment_course_views(course_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  UPDATE public.courses
  SET views_count = views_count + 1
  WHERE id = course_id;
END;
$function$;

-- 10.9 log_proposal_decision
CREATE OR REPLACE FUNCTION public.log_proposal_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.activity_log (
      user_id,
      action,
      entity_type,
      entity_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      NEW.status,
      NEW.content_type,
      NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object(
        'status', NEW.status,
        'reviewed_by', NEW.reviewed_by,
        'review_notes', NEW.review_notes
      )
    );
  END IF;

  RETURN NEW;
END;
$function$;

-- 10.10 notify_proposal_decision
CREATE OR REPLACE FUNCTION public.notify_proposal_decision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_type, related_id)
    VALUES (
      NEW.proposed_by,
      CASE WHEN NEW.status = 'approved' THEN 'Propuesta Aprobada ✅' ELSE 'Propuesta Rechazada ❌' END,
      CASE WHEN NEW.status = 'approved' THEN 'Tu propuesta ha sido aprobada y publicada'
           ELSE 'Tu propuesta ha sido rechazada. ' || COALESCE(NEW.review_notes, 'Sin comentarios.') END,
      'proposal_' || NEW.status,
      NEW.content_type,
      NEW.id
    );
  END IF;
  RETURN NEW;
END;
$function$;

-- 10.11 prevent_role_self_escalation
CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF NEW.id = auth.uid() AND NEW.role != OLD.role THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin' AND is_active = true
    ) THEN
      RAISE EXCEPTION 'No puedes cambiar tu propio rol';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

-- 10.12 update_blog_posts_updated_at
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.13 update_courses_updated_at
CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.14 update_defi_advocates_updated_at
CREATE OR REPLACE FUNCTION public.update_defi_advocates_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.15 update_game_progress_updated_at
CREATE OR REPLACE FUNCTION public.update_game_progress_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.16 update_jobs_updated_at
CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.17 update_proposals_updated_at
CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.18 update_updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.19 update_updated_at_column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$;

-- 10.20 validate_proposal_content
CREATE OR REPLACE FUNCTION public.validate_proposal_content()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  IF jsonb_typeof(NEW.content_data) != 'object' THEN
    RAISE EXCEPTION 'content_data debe ser un objeto JSON válido';
  END IF;

  CASE NEW.content_type
    WHEN 'startup' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN
        RAISE EXCEPTION 'Startup debe tener name y description';
      END IF;
    WHEN 'event' THEN
      IF NOT (NEW.content_data ? 'title' AND NEW.content_data ? 'start_date') THEN
        RAISE EXCEPTION 'Event debe tener title y start_date';
      END IF;
    WHEN 'community' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN
        RAISE EXCEPTION 'Community debe tener name y description';
      END IF;
    WHEN 'referent' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'category') THEN
        RAISE EXCEPTION 'Referent debe tener name y category';
      END IF;
    ELSE NULL;
  END CASE;

  RETURN NEW;
END;
$function$;

-- =============================================================================
-- 11. FIX RLS CASCADING ISSUE ON JOBS AND DEFI_ADVOCATES
-- =============================================================================
-- Problem: Policies on jobs/defi_advocates query user_roles table, but user_roles
-- now has RLS that blocks anonymous access, causing 500 errors for public pages.
-- Solution: Create a SECURITY DEFINER helper function that bypasses RLS.

-- Create helper function with SECURITY DEFINER to check admin status
CREATE OR REPLACE FUNCTION public.is_admin_or_role(required_roles text[] DEFAULT ARRAY['admin', 'super_admin'])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = ANY(required_roles)
    AND is_active = true
  );
$$;

-- Grant execute to all users (including anon for policy evaluation)
GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO anon;

-- -----------------------------------------------------------------------------
-- 11.1 Update JOBS table policies to use helper function
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins can view all jobs" ON public.jobs;
CREATE POLICY "Admins can view all jobs" ON public.jobs
  FOR SELECT
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can update jobs" ON public.jobs;
CREATE POLICY "Admins can update jobs" ON public.jobs
  FOR UPDATE
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can delete jobs" ON public.jobs;
CREATE POLICY "Admins can delete jobs" ON public.jobs
  FOR DELETE
  USING (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

DROP POLICY IF EXISTS "Admins can insert jobs" ON public.jobs;
CREATE POLICY "Admins can insert jobs" ON public.jobs
  FOR INSERT
  WITH CHECK (public.is_admin_or_role(ARRAY['admin', 'super_admin']));

-- -----------------------------------------------------------------------------
-- 11.2 Update DEFI_ADVOCATES table policies to use helper function
-- -----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Admins and editors can manage advocates" ON public.defi_advocates;
CREATE POLICY "Admins and editors can manage advocates" ON public.defi_advocates
  FOR ALL
  USING (public.is_admin_or_role(ARRAY['admin', 'editor', 'super_admin']));





