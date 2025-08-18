-- Create newsletter_subscribers table for newsletter management
-- Migration: 005_create_newsletter_subscribers_table.sql

-- Create newsletter status and source enums
CREATE TYPE newsletter_status AS ENUM ('active', 'unsubscribed', 'bounced', 'complained');
CREATE TYPE newsletter_source AS ENUM ('website', 'event', 'social', 'referral', 'import');

-- Create the newsletter_subscribers table
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  interests TEXT[] DEFAULT '{}',
  source newsletter_source NOT NULL DEFAULT 'website',
  status newsletter_status NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  unsubscribed_at TIMESTAMP WITH TIME ZONE,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  last_email_sent TIMESTAMP WITH TIME ZONE,
  engagement_score INTEGER DEFAULT 0 CHECK (engagement_score >= 0 AND engagement_score <= 100),
  bounce_count INTEGER DEFAULT 0 CHECK (bounce_count >= 0),
  complaint_count INTEGER DEFAULT 0 CHECK (complaint_count >= 0),
  click_count INTEGER DEFAULT 0 CHECK (click_count >= 0),
  open_count INTEGER DEFAULT 0 CHECK (open_count >= 0),
  unsubscribe_reason TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx ON newsletter_subscribers(email);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_status_idx ON newsletter_subscribers(status);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_source_idx ON newsletter_subscribers(source);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_subscribed_at_idx ON newsletter_subscribers(subscribed_at DESC);
CREATE INDEX IF NOT EXISTS newsletter_subscribers_engagement_idx ON newsletter_subscribers(engagement_score DESC) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS newsletter_subscribers_interests_gin_idx ON newsletter_subscribers USING GIN(interests);

-- Create partial index for active subscribers
CREATE INDEX IF NOT EXISTS newsletter_active_subscribers_idx ON newsletter_subscribers(subscribed_at DESC) 
WHERE status = 'active';

-- Create trigger for updated_at
CREATE TRIGGER update_newsletter_subscribers_updated_at 
  BEFORE UPDATE ON newsletter_subscribers 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Create trigger to set unsubscribed_at when status changes
CREATE OR REPLACE FUNCTION set_newsletter_unsubscribed_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Set unsubscribed_at when status changes to unsubscribed
  IF NEW.status = 'unsubscribed' AND OLD.status != 'unsubscribed' THEN
    NEW.unsubscribed_at = NOW();
  -- Clear unsubscribed_at if resubscribing
  ELSIF NEW.status = 'active' AND OLD.status = 'unsubscribed' THEN
    NEW.unsubscribed_at = NULL;
    NEW.subscribed_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_newsletter_unsubscribed_at
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  EXECUTE FUNCTION set_newsletter_unsubscribed_at();

-- Create trigger to calculate engagement score
CREATE OR REPLACE FUNCTION calculate_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate engagement score based on opens, clicks, and activity
  NEW.engagement_score = GREATEST(0, LEAST(100,
    (NEW.open_count * 2) +
    (NEW.click_count * 5) -
    (NEW.bounce_count * 10) -
    (NEW.complaint_count * 20)
  ));
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_engagement_score_trigger
  BEFORE UPDATE ON newsletter_subscribers
  FOR EACH ROW
  WHEN (
    OLD.open_count != NEW.open_count OR 
    OLD.click_count != NEW.click_count OR
    OLD.bounce_count != NEW.bounce_count OR
    OLD.complaint_count != NEW.complaint_count
  )
  EXECUTE FUNCTION calculate_engagement_score();

-- Enable RLS
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow anyone to subscribe (insert)
CREATE POLICY "Allow public subscription" ON newsletter_subscribers
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow subscribers to view and update their own subscription
CREATE POLICY "Subscribers can manage own subscription" ON newsletter_subscribers
  FOR ALL TO authenticated
  USING (email = auth.jwt() ->> 'email')
  WITH CHECK (email = auth.jwt() ->> 'email');

-- Allow public unsubscribe (for unsubscribe links)
CREATE POLICY "Allow public unsubscribe" ON newsletter_subscribers
  FOR UPDATE TO anon, authenticated
  USING (true)
  WITH CHECK (status = 'unsubscribed');

-- Allow moderators and admins to view all subscribers
CREATE POLICY "Allow moderator/admin read access" ON newsletter_subscribers
  FOR SELECT TO authenticated
  USING (user_has_role('moderator'));

-- Allow admins to manage all subscriptions
CREATE POLICY "Allow admin full access" ON newsletter_subscribers
  FOR ALL TO authenticated
  USING (user_has_role('admin'))
  WITH CHECK (user_has_role('admin'));

-- Create function for newsletter statistics
CREATE OR REPLACE FUNCTION get_newsletter_stats(days_back INTEGER DEFAULT 30)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_subscribers', COUNT(*),
    'active_subscribers', COUNT(*) FILTER (WHERE status = 'active'),
    'unsubscribed_count', COUNT(*) FILTER (WHERE status = 'unsubscribed'),
    'bounced_count', COUNT(*) FILTER (WHERE status = 'bounced'),
    'new_subscribers_period', COUNT(*) FILTER (
      WHERE subscribed_at >= NOW() - INTERVAL '1 day' * days_back
    ),
    'unsubscribes_period', COUNT(*) FILTER (
      WHERE unsubscribed_at >= NOW() - INTERVAL '1 day' * days_back
    ),
    'avg_engagement_score', AVG(engagement_score) FILTER (WHERE status = 'active'),
    'subscribers_by_source', json_object_agg(source, source_count),
    'top_interests', json_agg(interest_data ORDER BY interest_count DESC)
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY source) as source_count
    FROM newsletter_subscribers
    WHERE created_at >= NOW() - INTERVAL '1 day' * days_back
  ) ns,
  LATERAL (
    SELECT 
      unnest(interests) as interest_name,
      COUNT(*) as interest_count
    FROM newsletter_subscribers
    WHERE status = 'active' AND interests IS NOT NULL
    GROUP BY unnest(interests)
    LIMIT 10
  ) AS interest_data(interest_name, interest_count);
$$;

-- Create function to track email events
CREATE OR REPLACE FUNCTION track_email_event(
  subscriber_email TEXT,
  event_type TEXT, -- 'open', 'click', 'bounce', 'complaint'
  campaign_id TEXT DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  CASE event_type
    WHEN 'open' THEN
      UPDATE newsletter_subscribers 
      SET open_count = open_count + 1,
          last_email_sent = COALESCE(last_email_sent, NOW()),
          updated_at = NOW()
      WHERE email = subscriber_email AND status = 'active';
      
    WHEN 'click' THEN
      UPDATE newsletter_subscribers 
      SET click_count = click_count + 1,
          updated_at = NOW()
      WHERE email = subscriber_email AND status = 'active';
      
    WHEN 'bounce' THEN
      UPDATE newsletter_subscribers 
      SET bounce_count = bounce_count + 1,
          status = CASE WHEN bounce_count >= 3 THEN 'bounced' ELSE status END,
          updated_at = NOW()
      WHERE email = subscriber_email;
      
    WHEN 'complaint' THEN
      UPDATE newsletter_subscribers 
      SET complaint_count = complaint_count + 1,
          status = 'complained',
          updated_at = NOW()
      WHERE email = subscriber_email;
      
    ELSE
      RETURN false;
  END CASE;
  
  RETURN FOUND;
END;
$$;

-- Create function to get subscribers for campaign
CREATE OR REPLACE FUNCTION get_campaign_subscribers(
  interest_filter TEXT[] DEFAULT NULL,
  min_engagement INTEGER DEFAULT 0,
  exclude_recent_days INTEGER DEFAULT 7
)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  interests TEXT[],
  engagement_score INTEGER
)
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT 
    ns.id,
    ns.email,
    ns.name,
    ns.interests,
    ns.engagement_score
  FROM newsletter_subscribers ns
  WHERE ns.status = 'active'
    AND ns.engagement_score >= min_engagement
    AND (
      ns.last_email_sent IS NULL 
      OR ns.last_email_sent < NOW() - INTERVAL '1 day' * exclude_recent_days
    )
    AND (
      interest_filter IS NULL 
      OR ns.interests && interest_filter
    )
  ORDER BY ns.engagement_score DESC, ns.subscribed_at ASC;
$$;

-- Create view for subscriber analytics
CREATE OR REPLACE VIEW newsletter_analytics AS
SELECT 
  DATE_TRUNC('week', subscribed_at) as week,
  COUNT(*) as new_subscribers,
  COUNT(*) FILTER (WHERE source = 'website') as website_signups,
  COUNT(*) FILTER (WHERE source = 'event') as event_signups,
  COUNT(*) FILTER (WHERE source = 'social') as social_signups,
  COUNT(DISTINCT CASE WHEN interests IS NOT NULL THEN unnest(interests) END) as unique_interests,
  AVG(engagement_score) as avg_engagement
FROM newsletter_subscribers
WHERE subscribed_at >= NOW() - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', subscribed_at)
ORDER BY week DESC;

-- Add helpful comments
COMMENT ON TABLE newsletter_subscribers IS 'Newsletter subscription management with engagement tracking';
COMMENT ON COLUMN newsletter_subscribers.engagement_score IS 'Calculated score based on email interactions (0-100)';
COMMENT ON COLUMN newsletter_subscribers.interests IS 'Array of subscriber interests for targeted campaigns';
COMMENT ON FUNCTION track_email_event(TEXT, TEXT, TEXT) IS 'Track email events like opens, clicks, bounces';
COMMENT ON FUNCTION get_campaign_subscribers(TEXT[], INTEGER, INTEGER) IS 'Get targeted subscriber list for campaigns';
COMMENT ON VIEW newsletter_analytics IS 'Weekly analytics for newsletter growth and engagement';