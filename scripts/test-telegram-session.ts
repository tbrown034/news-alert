/**
 * Test if the saved Telegram session is still valid
 * Run: npx tsx scripts/test-telegram-session.ts
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
for (const line of envContent.split('\n')) {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    process.env[key.trim()] = valueParts.join('=').trim();
  }
}

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const SESSION = process.env.TELEGRAM_SESSION || '';

async function testSession() {
  console.log('=== Telegram Session Test ===\n');

  // Check credentials
  console.log('Checking credentials...');
  if (!API_ID || !API_HASH) {
    console.error('❌ Missing TELEGRAM_API_ID or TELEGRAM_API_HASH in .env.local');
    return;
  }
  console.log(`✅ API_ID: ${API_ID}`);
  console.log(`✅ API_HASH: ${API_HASH.slice(0, 8)}...`);

  if (!SESSION) {
    console.error('❌ Missing TELEGRAM_SESSION in .env.local');
    return;
  }
  console.log(`✅ SESSION: ${SESSION.slice(0, 20)}... (${SESSION.length} chars)\n`);

  // Try to connect
  console.log('Connecting to Telegram...');
  const stringSession = new StringSession(SESSION);
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 3,
  });

  try {
    await client.connect();
    console.log('✅ Connected!\n');

    // Check if authorized
    const isAuthorized = await client.isUserAuthorized();
    if (!isAuthorized) {
      console.error('❌ Session exists but NOT authorized. Need to re-authenticate.');
      await client.disconnect();
      return;
    }
    console.log('✅ Session is VALID and authorized!\n');

    // Get current user info
    const me = await client.getMe();
    console.log('Logged in as:');
    console.log(`  Name: ${me.firstName} ${me.lastName || ''}`);
    console.log(`  Username: @${me.username || 'N/A'}`);
    console.log(`  Phone: ${me.phone}\n`);

    // Test fetching a public channel
    console.log('Testing channel fetch (DeepStateUA)...');
    const channel = await client.getEntity('DeepStateUA');
    const messages = await client.getMessages(channel, { limit: 3 });

    console.log(`✅ Fetched ${messages.length} messages from @DeepStateUA:\n`);
    for (const msg of messages) {
      const text = (msg.message || '').slice(0, 100).replace(/\n/g, ' ');
      console.log(`  [${msg.date}] ${text}...`);
    }

    console.log('\n=== SESSION IS VALID - MTProto ready to use! ===');

    await client.disconnect();
  } catch (error) {
    console.error('❌ Error:', error);
    await client.disconnect();
  }
}

testSession();
