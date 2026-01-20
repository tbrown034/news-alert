/**
 * Telegram MTProto Client for fetching public channel posts
 * Uses GramJS (Node.js equivalent of Telethon)
 */

import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { NewsItem, Source } from '@/types';
import { classifyRegion, isBreakingNews } from './sources';
import { createHash } from 'crypto';

// Environment variables
const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION_STRING = process.env.TELEGRAM_SESSION || '';

// Singleton client instance
let client: TelegramClient | null = null;
let clientReady = false;

// Initialize the Telegram client
async function getClient(): Promise<TelegramClient | null> {
  if (!API_ID || !API_HASH) {
    console.warn('[Telegram] Missing API_ID or API_HASH');
    return null;
  }

  if (client && clientReady) {
    return client;
  }

  try {
    const session = new StringSession(SESSION_STRING);
    client = new TelegramClient(session, API_ID, API_HASH, {
      connectionRetries: 3,
    });

    await client.connect();

    // Check if we're authorized
    if (!await client.isUserAuthorized()) {
      console.warn('[Telegram] Not authorized. Run auth script to get session string.');
      return null;
    }

    clientReady = true;
    console.log('[Telegram] Client connected');
    return client;
  } catch (error) {
    console.error('[Telegram] Failed to connect:', error);
    return null;
  }
}

// Check if source is a Telegram source
export function isTelegramSource(source: Source & { feedUrl?: string; handle?: string }): boolean {
  return source.platform === 'telegram';
}

// Fetch posts from a Telegram channel
export async function fetchTelegramChannel(
  source: Source & { handle: string }
): Promise<NewsItem[]> {
  const telegramClient = await getClient();
  if (!telegramClient) {
    return [];
  }

  try {
    const channel = await telegramClient.getEntity(source.handle);

    // Get recent messages (last 20)
    const messages = await telegramClient.getMessages(channel, {
      limit: 20,
    });

    const items: NewsItem[] = [];
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 24 hours

    for (const msg of messages) {
      // Skip old messages
      if (msg.date && new Date(msg.date * 1000) < cutoff) {
        continue;
      }

      // Skip messages without text
      const text = msg.message || '';
      if (!text.trim()) {
        continue;
      }

      const timestamp = new Date((msg.date || 0) * 1000);
      const messageId = msg.id?.toString() || '';
      const link = `https://t.me/${source.handle}/${messageId}`;

      const region = source.region !== 'all'
        ? source.region
        : classifyRegion(text, text);

      items.push({
        id: `telegram-${source.handle}-${messageId}`,
        title: text.slice(0, 280), // Truncate for title
        content: text,
        source,
        timestamp,
        region,
        verificationStatus: getVerificationStatus(source.sourceType, source.confidence),
        url: link,
        alertStatus: null,
        isBreaking: isBreakingNews(text, text),
      });
    }

    return items;
  } catch (error) {
    console.error(`[Telegram] Error fetching @${source.handle}:`, error);
    return [];
  }
}

// Determine verification status based on source type and confidence
function getVerificationStatus(
  sourceType: Source['sourceType'],
  confidence: number
): 'confirmed' | 'multiple-sources' | 'unverified' {
  if (sourceType === 'official' || confidence >= 90) return 'confirmed';
  if (sourceType === 'reporter' || sourceType === 'news-org' || confidence >= 75) return 'multiple-sources';
  return 'unverified';
}

// Fetch all Telegram sources
export async function fetchAllTelegramFeeds(
  sources: (Source & { handle: string })[]
): Promise<NewsItem[]> {
  const telegramClient = await getClient();
  if (!telegramClient) {
    console.warn('[Telegram] Client not available, skipping Telegram sources');
    return [];
  }

  const allItems: NewsItem[] = [];

  // Fetch sequentially to avoid rate limits
  for (const source of sources) {
    try {
      const items = await fetchTelegramChannel(source);
      allItems.push(...items);
      // Small delay between channels
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`[Telegram] Failed to fetch ${source.name}:`, error);
    }
  }

  return allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// Disconnect client (for cleanup)
export async function disconnectTelegram(): Promise<void> {
  if (client) {
    await client.disconnect();
    client = null;
    clientReady = false;
  }
}

// Get session string (for initial auth - run separately)
export async function getSessionString(): Promise<string | null> {
  if (client) {
    const session = client.session as StringSession;
    return session.save();
  }
  return null;
}
