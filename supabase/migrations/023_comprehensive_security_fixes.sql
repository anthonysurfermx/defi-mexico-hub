-- =============================================================================
-- COMPREHENSIVE SECURITY & PERFORMANCE MIGRATION
-- =============================================================================
-- Run this in: Supabase Dashboard > SQL Editor
-- Date: 2026-02-24
--
-- What this fixes:
--   1. blog_posts: Remove overly permissive INSERT/UPDATE/DELETE (any auth user)
--   2. short_urls: Fix overly permissive UPDATE policy
--   3. game_leaderboard: Fix SECURITY DEFINER view → SECURITY INVOKER
--   4. increment_scan_count: Fix mutable search_path
--   5. is_admin_or_role: Secure helper function
--   6. All functions: Set search_path = '' to prevent injection
--   7. RLS cascading fix for jobs & defi_advocates
-- =============================================================================

BEGIN;

-- =============================================
-- 1. FIX blog_posts OVERLY PERMISSIVE RLS
-- =============================================

DROP POLICY IF EXISTS "auth_insert" ON public.blog_posts;
DROP POLICY IF EXISTS "auth_update" ON public.blog_posts;
DROP POLICY IF EXISTS "auth_delete" ON public.blog_posts;

-- Only admins/editors can insert blog posts
CREATE POLICY "admin_editor_insert_blog" ON public.blog_posts
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'editor', 'super_admin')
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'editor')
    )
  );

-- Only admins/editors can update blog posts
CREATE POLICY "admin_editor_update_blog" ON public.blog_posts
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'editor', 'super_admin')
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role IN ('admin', 'editor')
    )
  );

-- Only admins can delete blog posts
CREATE POLICY "admin_delete_blog" ON public.blog_posts
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = (select auth.uid())
      AND role IN ('admin', 'super_admin')
      AND is_active = true
    )
    OR EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = (select auth.uid())
      AND role = 'admin'
    )
  );

-- =============================================
-- 2. FIX short_urls OVERLY PERMISSIVE UPDATE
-- =============================================

DROP POLICY IF EXISTS "Anyone can update click count" ON public.short_urls;

-- Restrict: only allow updates on active URLs
CREATE POLICY "Anyone can increment click count" ON public.short_urls
  FOR UPDATE
  USING (is_active = true)
  WITH CHECK (is_active = true);

-- =============================================
-- 3. FIX game_leaderboard SECURITY DEFINER VIEW
-- =============================================

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

GRANT SELECT ON public.game_leaderboard TO anon, authenticated;

-- =============================================
-- 4. FIX increment_scan_count SEARCH_PATH
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_scan_count(p_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.scan_counter (scan_date, count)
  VALUES (p_date, 1)
  ON CONFLICT (scan_date)
  DO UPDATE SET count = public.scan_counter.count + 1;
END;
$function$;

-- =============================================
-- 5. FIX is_admin_or_role HELPER FUNCTION
-- =============================================

CREATE OR REPLACE FUNCTION public.is_admin_or_role(required_roles text[] DEFAULT ARRAY['admin', 'super_admin'])
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (select auth.uid())
    AND role = ANY(required_roles)
    AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin_or_role(text[]) TO anon;

-- =============================================
-- 6. FIX ALL FUNCTIONS WITH search_path ISSUES
-- =============================================

-- 6.1 enroll_student_in_course
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

-- 6.2 exec_sql (hardened with admin check + secure search_path)
CREATE OR REPLACE FUNCTION public.exec_sql(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = (select auth.uid())
    AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can execute raw SQL';
  END IF;
  EXECUTE sql;
  RETURN 'OK';
END;
$function$;

-- 6.3 get_blog_stats
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

-- 6.4 get_dashboard_stats
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

-- 6.5 global_search
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
      'startups', '[]'::json, 'communities', '[]'::json,
      'events', '[]'::json, 'blogPosts', '[]'::json, 'advocates', '[]'::json
    );
  END IF;
  SELECT json_build_object(
    'startups', (
      SELECT COALESCE(json_agg(row_to_json(s)), '[]'::json)
      FROM (SELECT id, name, slug, description, logo_url, category FROM public.startups
        WHERE status = 'published' AND (LOWER(name) LIKE clean_query OR LOWER(description) LIKE clean_query)
        ORDER BY is_featured DESC, created_at DESC LIMIT result_limit) s
    ),
    'communities', (
      SELECT COALESCE(json_agg(row_to_json(c)), '[]'::json)
      FROM (SELECT id, name, slug, description, image_url, category FROM public.communities
        WHERE is_verified = true AND (LOWER(name) LIKE clean_query OR LOWER(description) LIKE clean_query)
        ORDER BY is_featured DESC, member_count DESC LIMIT result_limit) c
    ),
    'events', (
      SELECT COALESCE(json_agg(row_to_json(e)), '[]'::json)
      FROM (SELECT id, title, slug, description, image_url, venue_city, start_date FROM public.events
        WHERE status = 'published' AND (LOWER(title) LIKE clean_query OR LOWER(description) LIKE clean_query)
        ORDER BY is_featured DESC, start_date DESC LIMIT result_limit) e
    ),
    'blogPosts', (
      SELECT COALESCE(json_agg(row_to_json(b)), '[]'::json)
      FROM (SELECT id, title, slug, excerpt, COALESCE(image_url, featured_image) as image_url, category, author FROM public.blog_posts
        WHERE status = 'published' AND (LOWER(title) LIKE clean_query OR LOWER(COALESCE(excerpt, '')) LIKE clean_query)
        ORDER BY is_featured DESC, published_at DESC LIMIT result_limit) b
    ),
    'advocates', (
      SELECT COALESCE(json_agg(row_to_json(a)), '[]'::json)
      FROM (SELECT id, name, slug, bio, avatar_url, expertise, specializations FROM public.defi_advocates
        WHERE is_active = true AND (LOWER(name) LIKE clean_query OR LOWER(COALESCE(bio, '')) LIKE clean_query)
        ORDER BY is_featured DESC, created_at DESC LIMIT result_limit) a
    )
  ) INTO result;
  RETURN result;
END;
$function$;

-- 6.6 handle_new_user
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

-- 6.7 All update_*_updated_at trigger functions
CREATE OR REPLACE FUNCTION public.update_blog_posts_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_courses_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_defi_advocates_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_game_progress_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_jobs_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_proposals_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$;

-- 6.8 Other functions
CREATE OR REPLACE FUNCTION public.increment_counter(table_name text, column_name text, record_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  EXECUTE format('UPDATE public.%I SET %I = COALESCE(%I, 0) + 1 WHERE id = $1', table_name, column_name, column_name) USING record_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.increment_course_views(course_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  UPDATE public.courses SET views_count = views_count + 1 WHERE id = course_id;
END;
$function$;

CREATE OR REPLACE FUNCTION public.log_proposal_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO public.activity_log (user_id, action, entity_type, entity_id, old_data, new_data)
    VALUES (auth.uid(), NEW.status, NEW.content_type, NEW.id,
      jsonb_build_object('status', OLD.status),
      jsonb_build_object('status', NEW.status, 'reviewed_by', NEW.reviewed_by, 'review_notes', NEW.review_notes));
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.notify_proposal_decision()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF NEW.status IN ('approved', 'rejected') AND OLD.status = 'pending' THEN
    INSERT INTO public.notifications (user_id, title, message, type, related_type, related_id)
    VALUES (NEW.proposed_by,
      CASE WHEN NEW.status = 'approved' THEN 'Propuesta Aprobada' ELSE 'Propuesta Rechazada' END,
      CASE WHEN NEW.status = 'approved' THEN 'Tu propuesta ha sido aprobada y publicada'
           ELSE 'Tu propuesta ha sido rechazada. ' || COALESCE(NEW.review_notes, 'Sin comentarios.') END,
      'proposal_' || NEW.status, NEW.content_type, NEW.id);
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.prevent_role_self_escalation()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF NEW.id = auth.uid() AND NEW.role != OLD.role THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin' AND is_active = true) THEN
      RAISE EXCEPTION 'No puedes cambiar tu propio rol';
    END IF;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.validate_proposal_content()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path = ''
AS $function$
BEGIN
  IF jsonb_typeof(NEW.content_data) != 'object' THEN
    RAISE EXCEPTION 'content_data debe ser un objeto JSON valido';
  END IF;
  CASE NEW.content_type
    WHEN 'startup' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN RAISE EXCEPTION 'Startup debe tener name y description'; END IF;
    WHEN 'event' THEN
      IF NOT (NEW.content_data ? 'title' AND NEW.content_data ? 'start_date') THEN RAISE EXCEPTION 'Event debe tener title y start_date'; END IF;
    WHEN 'community' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'description') THEN RAISE EXCEPTION 'Community debe tener name y description'; END IF;
    WHEN 'referent' THEN
      IF NOT (NEW.content_data ? 'name' AND NEW.content_data ? 'category') THEN RAISE EXCEPTION 'Referent debe tener name y category'; END IF;
    ELSE NULL;
  END CASE;
  RETURN NEW;
END;
$function$;

-- =============================================
-- 7. FIX RLS CASCADING ON JOBS & DEFI_ADVOCATES
-- =============================================

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

DROP POLICY IF EXISTS "Admins and editors can manage advocates" ON public.defi_advocates;
CREATE POLICY "Admins and editors can manage advocates" ON public.defi_advocates
  FOR ALL
  USING (public.is_admin_or_role(ARRAY['admin', 'editor', 'super_admin']));

COMMIT;
