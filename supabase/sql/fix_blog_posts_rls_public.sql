-- Fix RLS policies for blog_posts to allow public read access
-- This ensures anonymous users can view published blog posts

-- Drop existing problematic policy
DROP POLICY IF EXISTS "Public can view published posts" ON public.blog_posts;

-- Create a proper public read policy that doesn't require authentication
CREATE POLICY "Anyone can view published posts" ON public.blog_posts
    FOR SELECT
    USING (status = 'published');

-- Ensure RLS is enabled
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT SELECT ON public.blog_posts TO anon;
GRANT SELECT ON public.blog_posts TO authenticated;

-- Test query to verify the fix works
-- SELECT id, title, status FROM public.blog_posts WHERE status = 'published' LIMIT 1;