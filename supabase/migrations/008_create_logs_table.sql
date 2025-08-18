-- Create logs table for system events and audit trail
-- Migration: 008_create_logs_table.sql

-- Create log level enum
CREATE TYPE log_level AS ENUM ('debug', 'info', 'warn', 'error', 'fatal');

-- Create the logs table
CREATE TABLE IF NOT EXISTS logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  event_data JSONB DEFAULT '{}',
  level log_level DEFAULT 'info',
  message TEXT,
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,
  ip_address INET,
  user_agent TEXT,
  referer TEXT,
  correlation_id TEXT,
  duration_ms INTEGER CHECK (duration_ms >= 0),
  error_details JSONB,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS logs_event_type_idx ON logs(event_type);
CREATE INDEX IF NOT EXISTS logs_level_idx ON logs(level);
CREATE INDEX IF NOT EXISTS logs_user_id_idx ON logs(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS logs_created_at_idx ON logs(created_at DESC);
CREATE INDEX IF NOT EXISTS logs_correlation_id_idx ON logs(correlation_id) WHERE correlation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS logs_event_data_gin_idx ON logs USING GIN(event_data);

-- Create partial indexes for performance
CREATE INDEX IF NOT EXISTS logs_errors_idx ON logs(created_at DESC) WHERE level IN ('error', 'fatal');
CREATE INDEX IF NOT EXISTS logs_user_actions_idx ON logs(created_at DESC) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Only admins can read logs
CREATE POLICY "Allow admin read access to logs" ON logs
  FOR SELECT TO authenticated
  USING (user_has_role('admin'));

-- System can insert logs
CREATE POLICY "Allow system log insertion" ON logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Create function to log events
CREATE OR REPLACE FUNCTION log_event(
  p_event_type TEXT,
  p_event_data JSONB DEFAULT '{}',
  p_level log_level DEFAULT 'info',
  p_message TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid(),
  p_correlation_id TEXT DEFAULT NULL,
  p_duration_ms INTEGER DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO logs (
    event_type,
    event_data,
    level,
    message,
    user_id,
    correlation_id,
    duration_ms,
    error_details,
    metadata
  ) VALUES (
    p_event_type,
    p_event_data,
    p_level,
    p_message,
    p_user_id,
    p_correlation_id,
    p_duration_ms,
    p_error_details,
    p_metadata
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Create function for log analytics
CREATE OR REPLACE FUNCTION get_log_analytics(
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '7 days',
  end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT json_build_object(
    'total_events', COUNT(*),
    'error_count', COUNT(*) FILTER (WHERE level IN ('error', 'fatal')),
    'user_events', COUNT(*) FILTER (WHERE user_id IS NOT NULL),
    'events_by_level', json_object_agg(level, level_count),
    'events_by_type', json_object_agg(event_type, type_count),
    'top_error_types', json_agg(error_data ORDER BY error_count DESC LIMIT 10),
    'avg_duration_ms', AVG(duration_ms) FILTER (WHERE duration_ms IS NOT NULL),
    'unique_users', COUNT(DISTINCT user_id) FILTER (WHERE user_id IS NOT NULL)
  )
  FROM (
    SELECT 
      *,
      COUNT(*) OVER (PARTITION BY level) as level_count,
      COUNT(*) OVER (PARTITION BY event_type) as type_count
    FROM logs
    WHERE created_at BETWEEN start_date AND end_date
  ) l,
  LATERAL (
    SELECT 
      event_type,
      COUNT(*) as error_count
    FROM logs
    WHERE created_at BETWEEN start_date AND end_date
      AND level IN ('error', 'fatal')
    GROUP BY event_type
  ) AS error_data;
$$;

-- Create log cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_logs(
  retention_days INTEGER DEFAULT 90
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM logs
  WHERE created_at < NOW() - INTERVAL '1 day' * retention_days
    AND level NOT IN ('error', 'fatal'); -- Keep errors longer
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log the cleanup operation
  PERFORM log_event(
    'logs_cleanup',
    json_build_object(
      'deleted_count', deleted_count,
      'retention_days', retention_days
    ),
    'info',
    'Cleaned up old log entries'
  );
  
  RETURN deleted_count;
END;
$$;

-- Add helpful comments
COMMENT ON TABLE logs IS 'System event logs and audit trail';
COMMENT ON COLUMN logs.correlation_id IS 'ID to correlate related events across systems';
COMMENT ON COLUMN logs.duration_ms IS 'Duration of the operation in milliseconds';
COMMENT ON FUNCTION log_event(TEXT, JSONB, log_level, TEXT, UUID, TEXT, INTEGER, JSONB, JSONB) IS 'Log a system event with metadata';
COMMENT ON FUNCTION cleanup_old_logs(INTEGER) IS 'Clean up old log entries based on retention policy';