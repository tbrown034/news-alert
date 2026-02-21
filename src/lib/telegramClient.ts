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
import type { Entity } from 'telegram/define';

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

/**
 * Entity cache — avoids repeated contacts.ResolveUsername RPCs.
 * Maps channel handle -> resolved Entity with TTL.
 */
const entityCache = new Map<string, { entity: Entity; timestamp: number }>();
const ENTITY_CACHE_TTL = 30 * 60 * 1000; // 30 minutes

/**
 * Resolve a Telegram channel handle to an Entity, using cache.
 * This avoids triggering FloodWait on contacts.ResolveUsername
 * by caching resolved entities for 30 minutes.
 *
 * Returns the resolved entity, or null if resolution fails.
 */
export async function resolveEntity(
  telegramClient: TelegramClient,
  handle: string
): Promise<Entity | null> {
  const cached = entityCache.get(handle);
  if (cached && Date.now() - cached.timestamp < ENTITY_CACHE_TTL) {
    return cached.entity;
  }

  try {
    const entity = await telegramClient.getEntity(handle);
    entityCache.set(handle, { entity, timestamp: Date.now() });
    return entity;
  } catch {
    return null;
  }
}

