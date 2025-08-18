-- Create contact_forms table for form submissions
-- Migration: 004_create_contact_forms_table.sql

-- Create contact form status and priority enums
CREATE TYPE contact_status AS ENUM ('pending', 'in_progress', 'resolved', 'closed');
CREATE TYPE contact_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE contact_source AS ENUM ('website', 'social', 'referral', 'event', 'other');

-- Create the contact_forms table
CREATE TABLE IF NOT EXISTS contact_forms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  subject TEXT NOT NULL,
  message TEXT NOT NULL CHECK (LENGTH(message) >= 10),
  phone TEXT,
  status contact_status NOT NULL DEFAULT 'pending',
  priority contact_priority NOT NULL DEFAULT 'low',
  source contact_source NOT NULL DEFAULT 'website',
  response_message TEXT,
  response_sent_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  assigned_to UUID REFERENCES auth.users(id),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS contact_forms_email_idx ON contact_forms(email);
CREATE INDEX IF NOT EXISTS contact_forms_status_idx ON contact_forms(status);
CREATE INDEX IF NOT EXISTS contact_forms_priority_idx ON contact_forms(priority);
CREATE INDEX IF NOT EXISTS contact_forms_created_at_idx ON contact_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS contact_forms_assigned_to_idx ON contact_forms(assigned_to) WHERE assigned_to IS NOT NULL;
CREATE INDEX IF NOT EXISTS contact_forms_tags_gin_idx ON contact_forms USING GIN(tags);

-- Create text search index
CREATE INDEX IF NOT EXISTS contact_forms_search_idx ON contact_forms USING GIN(
  to_tsvector('spanish', name || ' ' || email || ' ' || subject || ' ' || message || ' ' || COALESCE(company, ''))
);

-- Create trigger for updated_at
CREATE TRIGGER update_contact_forms_updated_at 
  BEFORE UPDATE ON contact_forms 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set resolved_at when status changes to resolved
CREATE OR REPLACE FUNCTION set_contact_resolved_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
    NEW.resolved_at = NOW();
  ELSIF NEW.status != 'resolved' THEN
    NEW.resolved_at = NULL;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_contact_forms_resolved_at
  BEFORE UPDATE ON contact_forms
  FOR EACH ROW
  EXECUTE FUNCTION set_contact_resolved_at();

-- Enable RLS
ALTER TABLE contact_forms ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to create contact forms
CREATE POLICY "Allow public insert on contact forms" ON contact_forms
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view their own submissions
CREATE POLICY "Users can view own contact forms" ON contact_forms
  FOR SELECT TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Allow moderators and admins to view all contact forms
CREATE POLICY "Allow moderator/admin read access" ON contact_forms
  FOR SELECT TO authenticated
  USING (user_has_role('moderator'));

-- Allow moderators and admins to update contact forms
CREATE POLICY "Allow moderator/admin update access" ON contact_forms
  FOR UPDATE TO authenticated
  USING (user_has_role('moderator'))
  WITH CHECK (user_has_role('moderator'));

-- Allow admins to delete contact forms
CREATE POLICY "Allow admin delete access" ON contact_forms
  FOR DELETE TO authenticated
  USING (user_has_role('admin'));

-- Create function to get contact form statistics
CREATE OR REPLACE FUNCTION get_contact_form_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_forms', COUNT(*),
    'pending_forms', COUNT(*) FILTER (WHERE status = 'pending'),
    'in_progress_forms', COUNT(*) FILTER (WHERE status = 'in_progress'),
    'resolved_forms', COUNT(*) FILTER (WHERE status = 'resolved'),
    'high_priority_forms', COUNT(*) FILTER (WHERE priority IN ('high', 'urgent')),
    'avg_response_time_hours', AVG(
      CASE 
        WHEN response_sent_at IS NOT NULL 
        THEN EXTRACT(EPOCH FROM (response_sent_at - created_at)) / 3600
        ELSE NULL 
      END
    ),
    'forms_by_source', json_object_agg(source, source_count)
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY source) as source_count
    FROM contact_forms
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
  ) cf;
$$;

-- Create notification function for new contact forms
CREATE OR REPLACE FUNCTION notify_new_contact_form()
RETURNS TRIGGER AS $$
BEGIN
  -- This could trigger email notifications or webhooks
  -- For now, just log the event
  INSERT INTO logs (event_type, event_data, created_at)
  VALUES (
    'contact_form_submitted',
    json_build_object(
      'contact_id', NEW.id,
      'subject', NEW.subject,
      'priority', NEW.priority,
      'source', NEW.source
    ),
    NOW()
  )
  ON CONFLICT DO NOTHING; -- Ignore if logs table doesn't exist
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for new contact form notifications
CREATE TRIGGER notify_new_contact_form_trigger
  AFTER INSERT ON contact_forms
  FOR EACH ROW
  EXECUTE FUNCTION notify_new_contact_form();

-- Create view for contact form analytics
CREATE OR REPLACE VIEW contact_form_analytics AS
SELECT 
  DATE_TRUNC('day', created_at) as date,
  COUNT(*) as total_forms,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE priority = 'urgent') as urgent_count,
  COUNT(*) FILTER (WHERE priority = 'high') as high_priority_count,
  COUNT(DISTINCT email) as unique_contacts,
  AVG(CASE 
    WHEN resolved_at IS NOT NULL 
    THEN EXTRACT(EPOCH FROM (resolved_at - created_at)) / 3600
    ELSE NULL 
  END) as avg_resolution_time_hours
FROM contact_forms
GROUP BY DATE_TRUNC('day', created_at)
ORDER BY date DESC;

-- Add helpful comments
COMMENT ON TABLE contact_forms IS 'Contact form submissions from the website';
COMMENT ON COLUMN contact_forms.priority IS 'Priority level determined by keywords and content analysis';
COMMENT ON COLUMN contact_forms.source IS 'Where the contact form was submitted from';
COMMENT ON COLUMN contact_forms.metadata IS 'Additional metadata like user agent, IP country, etc.';
COMMENT ON FUNCTION get_contact_form_stats(INTEGER) IS 'Get contact form statistics for dashboard';
COMMENT ON VIEW contact_form_analytics IS 'Daily analytics for contact form submissions';