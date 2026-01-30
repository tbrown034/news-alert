// Migration script to create the post_activity_logs table
// Run with: npx tsx scripts/migrate-activity-logs.ts

import { config } from 'dotenv';
import { Pool } from 'pg';

// Load environment variables from .env.local
config({ path: '.env.local' });

async function migrate() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('DATABASE_URL environment variable is required');
    process.exit(1);
  }

  const pool = new Pool({ connectionString });

  try {
    console.log('Creating post_activity_logs table...');

    await pool.query(`
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
    `);

    console.log('Creating indexes...');

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_region_time
      ON post_activity_logs (region, bucket_timestamp DESC);
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_activity_recorded
      ON post_activity_logs (recorded_at DESC);
    `);

    console.log('Migration completed successfully!');

    // Show table info
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'post_activity_logs'
      ORDER BY ordinal_position;
    `);

    console.log('\nTable schema:');
    console.table(result.rows);

  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
