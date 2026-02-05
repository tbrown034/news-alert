/**
 * Shared Telegram MTProto client for serverless environments.
 *
 * Uses GramJS with a pre-authenticated StringSession stored in env vars.
 * The client is a lazy singleton that connects on first use and reconnects
 * as needed (handles Vercel cold starts).
 *
 * If TELEGRAM_SESSION is missing, falls back gracefully so rss.ts can
 * use the HTML scraper instead.
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION = process.env.TELEGRAM_SESSION || '';

/** Whether the Telegram MTProto API is configured (env vars present) */
export function isTelegramApiAvailable(): boolean {
  return !!(API_ID && API_HASH && SESSION);
}

let client: TelegramClient | null = null;
let disabled = false; // Set to true after a fatal error (bad session, auth revoked)
let connectPromise: Promise<TelegramClient | null> | null = null; // Prevents concurrent connects

const CONNECT_TIMEOUT_MS = 10_000; // 10s max to establish connection

/**
 * Get a connected TelegramClient. Reuses the module-level singleton
 * across requests (warm starts) and reconnects on cold starts.
 * Uses a connection lock to prevent concurrent connect() calls.
 *
 * Returns null if credentials are missing or connection fails.
 */
export async function getTelegramClient(): Promise<TelegramClient | null> {
  if (!isTelegramApiAvailable() || disabled) return null;

  // If already connected, return immediately
  if (client?.connected) return client;

  // If a connection is already in progress, wait for it
  if (connectPromise) return connectPromise;

  // Start a new connection attempt (with lock)
  connectPromise = doConnect();
  try {
    return await connectPromise;
  } finally {
    connectPromise = null;
  }
}

async function doConnect(): Promise<TelegramClient | null> {
  try {
    if (!client) {
      client = new TelegramClient(new StringSession(SESSION), API_ID, API_HASH, {
        connectionRetries: 2,
      });
    }

    // Race connect against a timeout
    await Promise.race([
      client.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Connection timeout')), CONNECT_TIMEOUT_MS)
      ),
    ]);

    console.log('[Telegram MTProto] Connected successfully');
    return client;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`[Telegram MTProto] Failed to connect: ${msg}. Disabling MTProto for this session.`);
    // Clean up and disable
    try { await client?.disconnect(); } catch { /* ignore */ }
    client = null;
    disabled = true;
    return null;
  }
}

/** Disconnect the shared client (for cleanup) */
export async function disconnectTelegram(): Promise<void> {
  if (client?.connected) {
    try {
      await client.disconnect();
    } catch {
      // Ignore disconnect errors
    }
  }
}
