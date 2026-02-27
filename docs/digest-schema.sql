-- News Digests table
-- AI-generated editorial summaries, produced 4x/day by Vercel cron
-- Each digest covers a 6-hour window of mainstream news articles

CREATE TABLE IF NOT EXISTS news_digests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  headline        TEXT NOT NULL,
  summary         TEXT NOT NULL,
  stories         JSONB NOT NULL DEFAULT '[]',
  articles_analyzed INTEGER NOT NULL DEFAULT 0,
  time_window_start TIMESTAMPTZ NOT NULL,
  time_window_end   TIMESTAMPTZ NOT NULL,
  model           TEXT NOT NULL,
  input_tokens    INTEGER DEFAULT 0,
  output_tokens   INTEGER DEFAULT 0,
  cost_usd        NUMERIC(10,6) DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  is_active       BOOLEAN DEFAULT TRUE
);

-- Fetch latest digest quickly
CREATE INDEX IF NOT EXISTS idx_news_digests_created_at
  ON news_digests (created_at DESC);

-- Active digest queries
CREATE INDEX IF NOT EXISTS idx_news_digests_active_created
  ON news_digests (is_active, created_at DESC)
  WHERE is_active = TRUE;
