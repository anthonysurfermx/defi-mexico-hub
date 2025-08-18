-- Create event_registrations table for event registration management
-- Migration: 006_create_event_registrations_table.sql

-- Create registration status enum
CREATE TYPE registration_status AS ENUM ('pending', 'confirmed', 'cancelled', 'attended', 'no_show');

-- Create the event_registrations table
CREATE TABLE IF NOT EXISTS event_registrations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company TEXT,
  job_title TEXT,
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  how_did_you_hear TEXT,
  expectations TEXT,
  emergency_contact TEXT,
  emergency_phone TEXT,
  status registration_status NOT NULL DEFAULT 'pending',
  registration_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmation_sent_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  check_in_time TIMESTAMP WITH TIME ZONE,
  feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
  feedback_comments TEXT,
  certificate_issued BOOLEAN DEFAULT FALSE,
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  attendance_duration_minutes INTEGER CHECK (attendance_duration_minutes >= 0),
  networking_opt_in BOOLEAN DEFAULT TRUE,
  marketing_opt_in BOOLEAN DEFAULT FALSE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(event_id, email)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS event_registrations_event_id_idx ON event_registrations(event_id);
CREATE INDEX IF NOT EXISTS event_registrations_user_id_idx ON event_registrations(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS event_registrations_email_idx ON event_registrations(email);
CREATE INDEX IF NOT EXISTS event_registrations_status_idx ON event_registrations(status);
CREATE INDEX IF NOT EXISTS event_registrations_registration_date_idx ON event_registrations(registration_date DESC);
CREATE INDEX IF NOT EXISTS event_registrations_check_in_idx ON event_registrations(check_in_time) WHERE check_in_time IS NOT NULL;

-- Create composite index for event analytics
CREATE INDEX IF NOT EXISTS event_registrations_event_status_idx ON event_registrations(event_id, status);

-- Create text search index
CREATE INDEX IF NOT EXISTS event_registrations_search_idx ON event_registrations USING GIN(
  to_tsvector('spanish', name || ' ' || email || ' ' || COALESCE(company, '') || ' ' || COALESCE(job_title, ''))
);

-- Create trigger for updated_at
CREATE TRIGGER update_event_registrations_updated_at 
  BEFORE UPDATE ON event_registrations 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set confirmation timestamp
CREATE OR REPLACE FUNCTION set_registration_confirmation_time()
RETURNS TRIGGER AS $$
BEGIN
  -- Set confirmation timestamp when status changes to confirmed
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    NEW.confirmation_sent_at = COALESCE(NEW.confirmation_sent_at, NOW());
  END IF;
  
  -- Set certificate issued timestamp
  IF NEW.certificate_issued = TRUE AND OLD.certificate_issued != TRUE THEN
    NEW.certificate_issued_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_registration_confirmation_time_trigger
  BEFORE UPDATE ON event_registrations
  FOR EACH ROW
  EXECUTE FUNCTION set_registration_confirmation_time();

-- Enable RLS
ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to register for events
CREATE POLICY "Allow public event registration" ON event_registrations
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow users to view and update their own registrations
CREATE POLICY "Users can manage own registrations" ON event_registrations
  FOR ALL TO authenticated
  USING (
    user_id = auth.uid() OR 
    email = auth.jwt() ->> 'email'
  )
  WITH CHECK (
    user_id = auth.uid() OR 
    email = auth.jwt() ->> 'email'
  );

-- Allow event organizers to view registrations for their events
CREATE POLICY "Event organizers can view registrations" ON event_registrations
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM events e 
      WHERE e.id = event_id 
        AND e.created_by = auth.uid()
    )
  );

-- Allow moderators and admins to view all registrations
CREATE POLICY "Allow moderator/admin read access" ON event_registrations
  FOR SELECT TO authenticated
  USING (user_has_role('moderator'));

-- Allow moderators and admins to update registrations
CREATE POLICY "Allow moderator/admin update access" ON event_registrations
  FOR UPDATE TO authenticated
  USING (user_has_role('moderator'))
  WITH CHECK (user_has_role('moderator'));

-- Allow admins to delete registrations
CREATE POLICY "Allow admin delete access" ON event_registrations
  FOR DELETE TO authenticated
  USING (user_has_role('admin'));

-- Create function to check event capacity
CREATE OR REPLACE FUNCTION check_event_capacity(target_event_id UUID)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    CASE 
      WHEN e.max_attendees IS NULL THEN TRUE
      ELSE (
        SELECT COUNT(*) 
        FROM event_registrations er 
        WHERE er.event_id = target_event_id 
          AND er.status IN ('confirmed', 'pending')
      ) < e.max_attendees
    END
  FROM events e
  WHERE e.id = target_event_id;
$$;

-- Create function to register for event with validation
CREATE OR REPLACE FUNCTION register_for_event(
  target_event_id UUID,
  registrant_name TEXT,
  registrant_email TEXT,
  registrant_phone TEXT DEFAULT NULL,
  registrant_company TEXT DEFAULT NULL,
  additional_info JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  registration_id UUID;
  event_date TIMESTAMP WITH TIME ZONE;
  has_capacity BOOLEAN;
BEGIN
  -- Check if event exists and is upcoming
  SELECT e.date, check_event_capacity(target_event_id)
  INTO event_date, has_capacity
  FROM events e
  WHERE e.id = target_event_id AND e.is_upcoming = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Event not found or not open for registration';
  END IF;
  
  -- Check capacity
  IF NOT has_capacity THEN
    RAISE EXCEPTION 'Event is at full capacity';
  END IF;
  
  -- Check if already registered
  IF EXISTS (
    SELECT 1 FROM event_registrations 
    WHERE event_id = target_event_id 
      AND email = registrant_email
  ) THEN
    RAISE EXCEPTION 'Already registered for this event';
  END IF;
  
  -- Create registration
  INSERT INTO event_registrations (
    event_id,
    user_id,
    name,
    email,
    phone,
    company,
    metadata
  ) VALUES (
    target_event_id,
    auth.uid(),
    registrant_name,
    registrant_email,
    registrant_phone,
    registrant_company,
    additional_info
  )
  RETURNING id INTO registration_id;
  
  RETURN registration_id;
END;
$$;

-- Create function for event registration statistics
CREATE OR REPLACE FUNCTION get_event_registration_stats(target_event_id UUID)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'event_id', target_event_id,
    'total_registrations', COUNT(*),
    'confirmed_registrations', COUNT(*) FILTER (WHERE status = 'confirmed'),
    'pending_registrations', COUNT(*) FILTER (WHERE status = 'pending'),
    'cancelled_registrations', COUNT(*) FILTER (WHERE status = 'cancelled'),
    'attended_count', COUNT(*) FILTER (WHERE status = 'attended'),
    'no_show_count', COUNT(*) FILTER (WHERE status = 'no_show'),
    'attendance_rate', 
      CASE 
        WHEN COUNT(*) FILTER (WHERE status IN ('attended', 'no_show')) > 0
        THEN ROUND(
          (COUNT(*) FILTER (WHERE status = 'attended')::NUMERIC / 
           COUNT(*) FILTER (WHERE status IN ('attended', 'no_show'))) * 100, 2
        )
        ELSE NULL
      END,
    'avg_feedback_rating', AVG(feedback_rating) FILTER (WHERE feedback_rating IS NOT NULL),
    'certificates_issued', COUNT(*) FILTER (WHERE certificate_issued = TRUE),
    'companies_represented', COUNT(DISTINCT company) FILTER (WHERE company IS NOT NULL),
    'dietary_restrictions_count', COUNT(*) FILTER (WHERE dietary_restrictions IS NOT NULL),
    'accessibility_needs_count', COUNT(*) FILTER (WHERE accessibility_needs IS NOT NULL)
  )
  FROM event_registrations
  WHERE event_id = target_event_id;
$$;

-- Create function to check in attendee
CREATE OR REPLACE FUNCTION check_in_attendee(
  registration_id UUID,
  check_in_by UUID DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE event_registrations
  SET 
    status = 'attended',
    check_in_time = NOW(),
    updated_at = NOW()
  WHERE id = registration_id
    AND status IN ('confirmed', 'pending')
    AND check_in_time IS NULL;
  
  RETURN FOUND;
END;
$$;

-- Create view for event attendance analytics
CREATE OR REPLACE VIEW event_attendance_analytics AS
SELECT 
  e.id as event_id,
  e.title as event_title,
  e.date as event_date,
  e.max_attendees,
  COUNT(er.id) as total_registrations,
  COUNT(er.id) FILTER (WHERE er.status = 'confirmed') as confirmed_count,
  COUNT(er.id) FILTER (WHERE er.status = 'attended') as attended_count,
  COUNT(er.id) FILTER (WHERE er.status = 'no_show') as no_show_count,
  CASE 
    WHEN COUNT(er.id) FILTER (WHERE er.status IN ('attended', 'no_show')) > 0
    THEN ROUND(
      (COUNT(er.id) FILTER (WHERE er.status = 'attended')::NUMERIC / 
       COUNT(er.id) FILTER (WHERE er.status IN ('attended', 'no_show'))) * 100, 2
    )
    ELSE NULL
  END as attendance_rate,
  AVG(er.feedback_rating) as avg_rating,
  COUNT(DISTINCT er.company) FILTER (WHERE er.company IS NOT NULL) as companies_count
FROM events e
LEFT JOIN event_registrations er ON e.id = er.event_id
GROUP BY e.id, e.title, e.date, e.max_attendees
ORDER BY e.date DESC;

-- Create function to send registration reminders
CREATE OR REPLACE FUNCTION send_registration_reminders(
  target_event_id UUID,
  hours_before_event INTEGER DEFAULT 24
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reminder_count INTEGER := 0;
BEGIN
  -- Update reminder_sent_at for eligible registrations
  UPDATE event_registrations
  SET reminder_sent_at = NOW()
  WHERE event_id = target_event_id
    AND status IN ('confirmed', 'pending')
    AND reminder_sent_at IS NULL
    AND EXISTS (
      SELECT 1 FROM events e
      WHERE e.id = target_event_id
        AND e.date <= NOW() + INTERVAL '1 hour' * hours_before_event
        AND e.date > NOW()
    );
  
  GET DIAGNOSTICS reminder_count = ROW_COUNT;
  RETURN reminder_count;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE event_registrations IS 'Event registration management with check-in and feedback tracking';
COMMENT ON COLUMN event_registrations.attendance_duration_minutes IS 'How long the attendee stayed at the event';
COMMENT ON COLUMN event_registrations.networking_opt_in IS 'Permission to share contact info with other attendees';
COMMENT ON COLUMN event_registrations.certificate_issued IS 'Whether a completion certificate was issued';
COMMENT ON FUNCTION register_for_event(UUID, TEXT, TEXT, TEXT, TEXT, JSONB) IS 'Register for an event with capacity and validation checks';
COMMENT ON FUNCTION check_in_attendee(UUID, UUID) IS 'Check in an attendee at the event';
COMMENT ON FUNCTION send_registration_reminders(UUID, INTEGER) IS 'Send reminders to registered attendees';
COMMENT ON VIEW event_attendance_analytics IS 'Analytics view for event attendance and engagement';