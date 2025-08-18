-- Create startup_applications table for startup application management
-- Migration: 007_create_startup_applications_table.sql

-- Create application status and funding stage enums
CREATE TYPE application_status AS ENUM ('submitted', 'under_review', 'approved', 'rejected', 'waitlisted');
CREATE TYPE funding_stage AS ENUM ('pre_seed', 'seed', 'series_a', 'series_b', 'later', 'bootstrap');

-- Create the startup_applications table
CREATE TABLE IF NOT EXISTS startup_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  startup_name TEXT NOT NULL,
  founder_name TEXT NOT NULL,
  founder_email TEXT NOT NULL,
  co_founders TEXT,
  website TEXT,
  linkedin_profile TEXT,
  description TEXT NOT NULL CHECK (LENGTH(description) >= 50),
  problem_statement TEXT NOT NULL CHECK (LENGTH(problem_statement) >= 50),
  solution TEXT NOT NULL CHECK (LENGTH(solution) >= 50),
  target_market TEXT NOT NULL,
  business_model TEXT NOT NULL,
  traction TEXT NOT NULL,
  funding_stage funding_stage NOT NULL,
  funding_amount_sought DECIMAL(15,2) CHECK (funding_amount_sought > 0),
  team_size INTEGER CHECK (team_size > 0),
  location TEXT NOT NULL,
  industry TEXT NOT NULL,
  technology_stack TEXT,
  competitive_advantage TEXT NOT NULL,
  pitch_deck_url TEXT,
  demo_url TEXT,
  github_url TEXT,
  additional_info TEXT,
  status application_status NOT NULL DEFAULT 'submitted',
  review_notes TEXT,
  reviewer_feedback JSONB DEFAULT '{}',
  score INTEGER CHECK (score >= 1 AND score <= 10),
  tags TEXT[] DEFAULT '{}',
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id),
  follow_up_date TIMESTAMP WITH TIME ZONE,
  interview_scheduled_at TIMESTAMP WITH TIME ZONE,
  decision_deadline TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(founder_email, startup_name)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS startup_applications_founder_email_idx ON startup_applications(founder_email);
CREATE INDEX IF NOT EXISTS startup_applications_status_idx ON startup_applications(status);
CREATE INDEX IF NOT EXISTS startup_applications_funding_stage_idx ON startup_applications(funding_stage);
CREATE INDEX IF NOT EXISTS startup_applications_industry_idx ON startup_applications(industry);
CREATE INDEX IF NOT EXISTS startup_applications_location_idx ON startup_applications(location);
CREATE INDEX IF NOT EXISTS startup_applications_submitted_at_idx ON startup_applications(submitted_at DESC);
CREATE INDEX IF NOT EXISTS startup_applications_reviewed_by_idx ON startup_applications(reviewed_by) WHERE reviewed_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS startup_applications_score_idx ON startup_applications(score DESC) WHERE score IS NOT NULL;
CREATE INDEX IF NOT EXISTS startup_applications_tags_gin_idx ON startup_applications USING GIN(tags);

-- Create text search index
CREATE INDEX IF NOT EXISTS startup_applications_search_idx ON startup_applications USING GIN(
  to_tsvector('spanish', 
    startup_name || ' ' || 
    founder_name || ' ' || 
    description || ' ' || 
    problem_statement || ' ' || 
    solution || ' ' ||
    industry || ' ' ||
    COALESCE(technology_stack, '')
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_startup_applications_updated_at 
  BEFORE UPDATE ON startup_applications 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set review timestamp
CREATE OR REPLACE FUNCTION set_application_review_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Set reviewed_at when status changes from submitted
  IF NEW.status != 'submitted' AND OLD.status = 'submitted' THEN
    NEW.reviewed_at = NOW();
    NEW.reviewed_by = COALESCE(NEW.reviewed_by, auth.uid());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_application_review_time_trigger
  BEFORE UPDATE ON startup_applications
  FOR EACH ROW
  EXECUTE FUNCTION set_application_review_time();

-- Enable RLS
ALTER TABLE startup_applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to submit applications
CREATE POLICY "Allow public application submission" ON startup_applications
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow applicants to view their own applications
CREATE POLICY "Applicants can view own applications" ON startup_applications
  FOR SELECT TO authenticated
  USING (founder_email = auth.jwt() ->> 'email');

-- Allow applicants to update their pending applications
CREATE POLICY "Applicants can update pending applications" ON startup_applications
  FOR UPDATE TO authenticated
  USING (
    founder_email = auth.jwt() ->> 'email' 
    AND status = 'submitted'
  )
  WITH CHECK (
    founder_email = auth.jwt() ->> 'email' 
    AND status = 'submitted'
  );

-- Allow reviewers to view applications under review
CREATE POLICY "Reviewers can view assigned applications" ON startup_applications
  FOR SELECT TO authenticated
  USING (
    reviewed_by = auth.uid() OR
    user_has_role('moderator')
  );

-- Allow moderators and admins to view all applications
CREATE POLICY "Allow moderator/admin read access" ON startup_applications
  FOR SELECT TO authenticated
  USING (user_has_role('moderator'));

-- Allow moderators and admins to update applications
CREATE POLICY "Allow moderator/admin update access" ON startup_applications
  FOR UPDATE TO authenticated
  USING (user_has_role('moderator'))
  WITH CHECK (user_has_role('moderator'));

-- Allow admins to delete applications
CREATE POLICY "Allow admin delete access" ON startup_applications
  FOR DELETE TO authenticated
  USING (user_has_role('admin'));

-- Create function to assign reviewer
CREATE OR REPLACE FUNCTION assign_application_reviewer(
  application_id UUID,
  reviewer_id UUID
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user has permission to assign reviewers
  IF NOT user_has_role('moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions to assign reviewers';
  END IF;
  
  -- Update the application
  UPDATE startup_applications
  SET 
    reviewed_by = reviewer_id,
    status = CASE WHEN status = 'submitted' THEN 'under_review' ELSE status END,
    updated_at = NOW()
  WHERE id = application_id;
  
  RETURN FOUND;
END;
$$;

-- Create function to score application
CREATE OR REPLACE FUNCTION score_application(
  application_id UUID,
  application_score INTEGER,
  feedback_notes TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate score
  IF application_score < 1 OR application_score > 10 THEN
    RAISE EXCEPTION 'Score must be between 1 and 10';
  END IF;
  
  -- Check permissions
  IF NOT (
    user_has_role('moderator') OR 
    EXISTS (
      SELECT 1 FROM startup_applications 
      WHERE id = application_id AND reviewed_by = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Insufficient permissions to score this application';
  END IF;
  
  -- Update the application
  UPDATE startup_applications
  SET 
    score = application_score,
    review_notes = COALESCE(feedback_notes, review_notes),
    updated_at = NOW()
  WHERE id = application_id;
  
  RETURN FOUND;
END;
$$;

-- Create function for application statistics
CREATE OR REPLACE FUNCTION get_startup_application_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_applications', COUNT(*),
    'submitted_count', COUNT(*) FILTER (WHERE status = 'submitted'),
    'under_review_count', COUNT(*) FILTER (WHERE status = 'under_review'),
    'approved_count', COUNT(*) FILTER (WHERE status = 'approved'),
    'rejected_count', COUNT(*) FILTER (WHERE status = 'rejected'),
    'waitlisted_count', COUNT(*) FILTER (WHERE status = 'waitlisted'),
    'approval_rate', ROUND(
      (COUNT(*) FILTER (WHERE status = 'approved')::NUMERIC / 
       NULLIF(COUNT(*) FILTER (WHERE status IN ('approved', 'rejected')), 0)) * 100, 2
    ),
    'avg_review_time_hours', AVG(
      CASE 
        WHEN reviewed_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (reviewed_at - submitted_at)) / 3600
        ELSE NULL 
      END
    ),
    'avg_score', AVG(score) FILTER (WHERE score IS NOT NULL),
    'applications_by_stage', json_object_agg(funding_stage, stage_count),
    'applications_by_industry', json_object_agg(industry, industry_count),
    'top_locations', json_agg(location_data ORDER BY location_count DESC LIMIT 10)
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY funding_stage) as stage_count,
      COUNT(*) OVER (PARTITION BY industry) as industry_count
    FROM startup_applications
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
  ) sa,
  LATERAL (
    SELECT 
      location,
      COUNT(*) as location_count
    FROM startup_applications
    WHERE submitted_at >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY location
  ) AS location_data;
$$;

-- Create function to get applications needing review
CREATE OR REPLACE FUNCTION get_applications_needing_review(
  reviewer_id UUID DEFAULT NULL,
  limit_count INTEGER DEFAULT 20
)
RETURNS TABLE(
  id UUID,
  startup_name TEXT,
  founder_name TEXT,
  industry TEXT,
  funding_stage funding_stage,
  submitted_at TIMESTAMP WITH TIME ZONE,
  days_pending INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    sa.id,
    sa.startup_name,
    sa.founder_name,
    sa.industry,
    sa.funding_stage,
    sa.submitted_at,
    EXTRACT(DAYS FROM (NOW() - sa.submitted_at))::INTEGER as days_pending
  FROM startup_applications sa
  WHERE sa.status IN ('submitted', 'under_review')
    AND (reviewer_id IS NULL OR sa.reviewed_by = reviewer_id)
  ORDER BY sa.submitted_at ASC
  LIMIT limit_count;
$$;

-- Create function to bulk update application status
CREATE OR REPLACE FUNCTION bulk_update_application_status(
  application_ids UUID[],
  new_status application_status,
  review_notes_text TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER := 0;
BEGIN
  -- Check permissions
  IF NOT user_has_role('moderator') THEN
    RAISE EXCEPTION 'Insufficient permissions to bulk update applications';
  END IF;
  
  -- Update applications
  UPDATE startup_applications
  SET 
    status = new_status,
    review_notes = COALESCE(review_notes_text, review_notes),
    reviewed_at = CASE WHEN reviewed_at IS NULL THEN NOW() ELSE reviewed_at END,
    reviewed_by = COALESCE(reviewed_by, auth.uid()),
    updated_at = NOW()
  WHERE id = ANY(application_ids);
  
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- Create view for application pipeline
CREATE OR REPLACE VIEW startup_application_pipeline AS
SELECT 
  status,
  COUNT(*) as count,
  AVG(
    CASE 
      WHEN reviewed_at IS NOT NULL 
      THEN EXTRACT(DAYS FROM (reviewed_at - submitted_at))
      ELSE EXTRACT(DAYS FROM (NOW() - submitted_at))
    END
  ) as avg_days_in_stage,
  MIN(submitted_at) as oldest_application,
  MAX(submitted_at) as newest_application
FROM startup_applications
GROUP BY status
ORDER BY 
  CASE status
    WHEN 'submitted' THEN 1
    WHEN 'under_review' THEN 2
    WHEN 'waitlisted' THEN 3
    WHEN 'approved' THEN 4
    WHEN 'rejected' THEN 5
  END;

-- Create view for reviewer workload
CREATE OR REPLACE VIEW reviewer_workload AS
SELECT 
  u.id as reviewer_id,
  u.email as reviewer_email,
  COUNT(sa.id) as total_assigned,
  COUNT(sa.id) FILTER (WHERE sa.status = 'under_review') as in_review,
  COUNT(sa.id) FILTER (WHERE sa.status IN ('approved', 'rejected')) as completed,
  AVG(sa.score) FILTER (WHERE sa.score IS NOT NULL) as avg_score_given,
  AVG(
    CASE 
      WHEN sa.reviewed_at IS NOT NULL 
      THEN EXTRACT(DAYS FROM (sa.reviewed_at - sa.submitted_at))
      ELSE NULL 
    END
  ) as avg_review_time_days
FROM auth.users u
LEFT JOIN startup_applications sa ON u.id = sa.reviewed_by
WHERE EXISTS (
  SELECT 1 FROM user_roles ur 
  WHERE ur.user_id = u.id 
    AND ur.role IN ('moderator', 'admin') 
    AND ur.is_active = TRUE
)
GROUP BY u.id, u.email
ORDER BY total_assigned DESC;

-- Add helpful comments
COMMENT ON TABLE startup_applications IS 'Startup applications for incubator/accelerator programs';
COMMENT ON COLUMN startup_applications.reviewer_feedback IS 'Structured feedback from reviewers in JSON format';
COMMENT ON COLUMN startup_applications.score IS 'Application score from 1-10 by reviewers';
COMMENT ON COLUMN startup_applications.decision_deadline IS 'Deadline for making a decision on this application';
COMMENT ON FUNCTION assign_application_reviewer(UUID, UUID) IS 'Assign a reviewer to an application';
COMMENT ON FUNCTION score_application(UUID, INTEGER, TEXT) IS 'Score an application with feedback';
COMMENT ON FUNCTION bulk_update_application_status(UUID[], application_status, TEXT) IS 'Bulk update multiple application statuses';
COMMENT ON VIEW startup_application_pipeline IS 'Overview of applications in each stage of the pipeline';
COMMENT ON VIEW reviewer_workload IS 'Reviewer workload and performance metrics';