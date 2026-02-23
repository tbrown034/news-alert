-- News Cache table
-- L2 cache for OSINT and mainstream news, warmed every 5 minutes by Vercel cron.
-- Survives cold starts and is shared across serverless instances.

CREATE TABLE IF NOT EXISTS news_cache (
  cache_key   TEXT PRIMARY KEY,          -- 'osint:all', 'mainstream:all'
  data        JSONB NOT NULL,            -- NewsItem[] or MainstreamSourceGroup[]
  item_count  INTEGER NOT NULL DEFAULT 0,
  fetched_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
