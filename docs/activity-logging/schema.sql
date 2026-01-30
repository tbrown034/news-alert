-- Activity Logging Schema
-- Created: 2026-01-30
-- Purpose: Track post counts per 6-hour bucket for rolling average baselines

CREATE TABLE IF NOT EXISTS post_activity_logs (
  id SERIAL PRIMARY KEY,

  -- Time bucket (6-hour boundary: 00:00, 06:00, 12:00, 18:00 UTC)
  bucket_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,

  -- Region being tracked
  region VARCHAR(20) NOT NULL,

  -- Counts
  post_count INTEGER NOT NULL DEFAULT 0,
  source_count INTEGER NOT NULL DEFAULT 0,

  -- Region breakdown (JSON for flexibility)
  region_breakdown JSONB,

  -- Platform breakdown (JSON)
  platform_breakdown JSONB,

  -- Metadata
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  fetch_duration_ms INTEGER,

  -- Prevent duplicate entries for same bucket+region
  CONSTRAINT unique_bucket_region UNIQUE (bucket_timestamp, region)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_activity_region_time
ON post_activity_logs (region, bucket_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_activity_recorded
ON post_activity_logs (recorded_at DESC);

-- Example queries:

-- Get 14-day rolling average per region
SELECT
  region,
  ROUND(AVG(post_count)::numeric, 1) as avg_posts_6h,
  COUNT(*) as sample_count
FROM post_activity_logs
WHERE bucket_timestamp > NOW() - INTERVAL '14 days'
GROUP BY region
ORDER BY region;

-- Get recent activity logs
SELECT * FROM post_activity_logs
ORDER BY bucket_timestamp DESC, region
LIMIT 50;

-- Clean up old data (run monthly)
DELETE FROM post_activity_logs
WHERE bucket_timestamp < NOW() - INTERVAL '90 days';
