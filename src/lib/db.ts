// Database connection pool for editorial posts
// Reuses the same DATABASE_URL as Better Auth

import { Pool } from 'pg';

// Singleton pool instance
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    // Parse connection string and ensure proper SSL config
    let connectionString = process.env.DATABASE_URL || '';

    // Fix SSL mode warning: upgrade deprecated modes to verify-full
    // This silences the pg v9 deprecation warning while maintaining security
    if (connectionString.includes('sslmode=require') && !connectionString.includes('uselibpqcompat')) {
      connectionString = connectionString.replace('sslmode=require', 'sslmode=verify-full');
    }

    pool = new Pool({
      connectionString,
      max: 5, // Max connections in pool
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Log pool errors
    pool.on('error', (err) => {
      console.error('[DB Pool] Unexpected error:', err);
    });
  }
  return pool;
}

// Helper for running queries
export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const pool = getPool();
  const result = await pool.query(text, params);
  return result.rows as T[];
}

// Helper for running single-result queries
export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}
