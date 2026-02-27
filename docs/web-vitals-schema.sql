-- Web Vitals tracking table
-- Stores Core Web Vitals (LCP, INP, CLS) and diagnostics (FCP, TTFB, FID)
-- collected from real users via the web-vitals library + Next.js useReportWebVitals hook

CREATE TABLE IF NOT EXISTS web_vitals (
  id SERIAL PRIMARY KEY,
  metric_name VARCHAR(10) NOT NULL,        -- LCP, INP, CLS, FCP, TTFB, FID
  value DOUBLE PRECISION NOT NULL,          -- Metric value (ms for most, unitless for CLS)
  delta DOUBLE PRECISION NOT NULL,          -- Change since last report (first report: delta = value)
  rating VARCHAR(20) NOT NULL,              -- 'good', 'needs-improvement', 'poor'
  metric_id VARCHAR(100) NOT NULL,          -- Unique ID per metric instance per page load
  page_path VARCHAR(500),                   -- URL pathname (e.g., '/', '/conditions')
  navigation_type VARCHAR(30),              -- 'navigate', 'reload', 'back-forward', etc.
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_web_vitals_metric ON web_vitals(metric_name);
CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded ON web_vitals(recorded_at);

-- Useful queries:

-- p75 per metric (last 7 days) — the standard Google uses
-- SELECT metric_name,
--        PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75,
--        COUNT(*) as samples
-- FROM web_vitals
-- WHERE recorded_at > NOW() - INTERVAL '7 days'
-- GROUP BY metric_name;

-- Rating distribution
-- SELECT metric_name, rating, COUNT(*) as count
-- FROM web_vitals
-- WHERE recorded_at > NOW() - INTERVAL '7 days'
-- GROUP BY metric_name, rating
-- ORDER BY metric_name, rating;
