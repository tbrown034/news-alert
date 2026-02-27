import { query } from './db';

// ─── Types ───────────────────────────────────────────────────────────

export interface WebVitalRecord {
  id: number;
  metric_name: string;
  value: number;
  delta: number;
  rating: string;
  metric_id: string;
  page_path: string | null;
  navigation_type: string | null;
  recorded_at: string;
}

export interface WebVitalsSummary {
  metric_name: string;
  p75: number;
  median: number;
  avg: number;
  good_pct: number;
  needs_improvement_pct: number;
  poor_pct: number;
  sample_count: number;
}

// ─── Thresholds (from web-vitals library) ────────────────────────────

export const METRIC_THRESHOLDS: Record<string, { good: number; poor: number; unit: string }> = {
  LCP:  { good: 2500, poor: 4000, unit: 'ms' },
  INP:  { good: 200,  poor: 500,  unit: 'ms' },
  CLS:  { good: 0.1,  poor: 0.25, unit: '' },
  FCP:  { good: 1800, poor: 3000, unit: 'ms' },
  TTFB: { good: 800,  poor: 1800, unit: 'ms' },
  FID:  { good: 100,  poor: 300,  unit: 'ms' },
};

// ─── Table Creation ──────────────────────────────────────────────────

export async function ensureWebVitalsTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS web_vitals (
      id SERIAL PRIMARY KEY,
      metric_name VARCHAR(10) NOT NULL,
      value DOUBLE PRECISION NOT NULL,
      delta DOUBLE PRECISION NOT NULL,
      rating VARCHAR(20) NOT NULL,
      metric_id VARCHAR(100) NOT NULL,
      page_path VARCHAR(500),
      navigation_type VARCHAR(30),
      recorded_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Create indexes if they don't exist
  await query(`CREATE INDEX IF NOT EXISTS idx_web_vitals_metric ON web_vitals(metric_name)`);
  await query(`CREATE INDEX IF NOT EXISTS idx_web_vitals_recorded ON web_vitals(recorded_at)`);
}

// ─── Write ───────────────────────────────────────────────────────────

export async function logWebVital(
  metricName: string,
  value: number,
  delta: number,
  rating: string,
  metricId: string,
  pagePath?: string,
  navigationType?: string,
): Promise<void> {
  try {
    await query(
      `INSERT INTO web_vitals (metric_name, value, delta, rating, metric_id, page_path, navigation_type)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [metricName, value, delta, rating, metricId, pagePath || null, navigationType || null]
    );
  } catch (err) {
    console.error('[WebVitals] Failed to log:', err instanceof Error ? err.message : err);
  }
}

// ─── Read ────────────────────────────────────────────────────────────

export async function getRecentWebVitals(limit: number = 100): Promise<WebVitalRecord[]> {
  return query<WebVitalRecord>(
    `SELECT * FROM web_vitals ORDER BY recorded_at DESC LIMIT $1`,
    [limit]
  );
}

export async function getWebVitalsSummary(days: number = 7): Promise<WebVitalsSummary[]> {
  return query<WebVitalsSummary>(
    `SELECT
       metric_name,
       PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75,
       PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY value) as median,
       AVG(value) as avg,
       ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'good') / NULLIF(COUNT(*), 0), 1) as good_pct,
       ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'needs-improvement') / NULLIF(COUNT(*), 0), 1) as needs_improvement_pct,
       ROUND(100.0 * COUNT(*) FILTER (WHERE rating = 'poor') / NULLIF(COUNT(*), 0), 1) as poor_pct,
       COUNT(*) as sample_count
     FROM web_vitals
     WHERE recorded_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY metric_name
     ORDER BY metric_name`,
    [days]
  );
}

export async function getWebVitalsTimeline(days: number = 7): Promise<Array<{
  bucket: string;
  metric_name: string;
  p75: number;
  sample_count: number;
}>> {
  // 6-hour buckets to match the activity logging pattern
  return query(
    `SELECT
       date_trunc('hour', recorded_at) -
         (EXTRACT(hour FROM recorded_at)::int % 6) * INTERVAL '1 hour' as bucket,
       metric_name,
       PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY value) as p75,
       COUNT(*) as sample_count
     FROM web_vitals
     WHERE recorded_at > NOW() - INTERVAL '1 day' * $1
     GROUP BY bucket, metric_name
     ORDER BY bucket, metric_name`,
    [days]
  );
}

// ─── Cleanup ─────────────────────────────────────────────────────────

export async function cleanupOldVitals(retentionDays: number = 90): Promise<number> {
  const result = await query<{ count: string }>(
    `WITH deleted AS (
       DELETE FROM web_vitals WHERE recorded_at < NOW() - INTERVAL '1 day' * $1
       RETURNING *
     ) SELECT COUNT(*) as count FROM deleted`,
    [retentionDays]
  );
  return parseInt(result[0]?.count || '0', 10);
}
