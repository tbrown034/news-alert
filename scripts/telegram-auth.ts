/**
 * Telegram MTProto Authentication
 *
 * This is a TWO-STAGE process:
 *
 * Stage 1 - Request verification code:
 *   TELEGRAM_PHONE=+1234567890 npx tsx scripts/telegram-auth.ts
 *
 * Stage 2 - Complete auth with code:
 *   TELEGRAM_CODE=12345 npx tsx scripts/telegram-auth.ts
 *
 * After successful auth, copy the session string to .env.local
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import * as readline from 'readline';

// Load .env.local
const envPath = resolve(process.cwd(), '.env.local');
try {
  const envContent = readFileSync(envPath, 'utf-8');
  for (const line of envContent.split('\n')) {
    const eqIndex = line.indexOf('=');
    if (eqIndex > 0) {
      const key = line.slice(0, eqIndex).trim();
      const value = line.slice(eqIndex + 1).trim();
      if (key && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
} catch {
  console.log('Note: .env.local not found, using environment variables');
}

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '0', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '';
const PHONE = process.env.TELEGRAM_PHONE || '';
const CODE = process.env.TELEGRAM_CODE || '';

const CODE_HASH_FILE = resolve(process.cwd(), 'telegram_code_hash.txt');

function prompt(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  console.log('=== Telegram MTProto Authentication ===\n');

  if (!API_ID || !API_HASH) {
    console.error('❌ Missing TELEGRAM_API_ID or TELEGRAM_API_HASH');
    console.log('\nGet your API credentials from: https://my.telegram.org/apps');
    return;
  }

  console.log(`API_ID: ${API_ID}`);
  console.log(`API_HASH: ${API_HASH.slice(0, 8)}...`);

  // For Stage 2, try to restore the session from Stage 1 (preserves DC migration)
  let initialSession = '';
  if (CODE) {
    try {
      const saved = JSON.parse(readFileSync(CODE_HASH_FILE, 'utf-8'));
      if (saved.session) {
        initialSession = saved.session;
        console.log('✅ Restored session from Stage 1 (DC migration preserved)\n');
      }
    } catch {
      // Fall through to empty session
    }
  }

  const stringSession = new StringSession(initialSession);
  const client = new TelegramClient(stringSession, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.connect();
  console.log('✅ Connected to Telegram\n');

  // Check if already authorized (shouldn't be with empty session)
  if (await client.isUserAuthorized()) {
    console.log('✅ Already authorized!');
    const session = client.session.save() as string;
    console.log(`\nSession string (${session.length} chars):`);
    console.log(session);
    await client.disconnect();
    return;
  }

  // STAGE 1: Request code
  if (PHONE && !CODE) {
    console.log(`📱 Requesting verification code for ${PHONE}...`);

    try {
      const result = await client.invoke(
        new (await import('telegram/tl')).Api.auth.SendCode({
          phoneNumber: PHONE,
          apiId: API_ID,
          apiHash: API_HASH,
          settings: new (await import('telegram/tl')).Api.CodeSettings({}),
        })
      );

      const phoneCodeHash = result.phoneCodeHash;
      // Save code hash AND the session (which includes DC migration info)
      const pendingSession = client.session.save() as string;
      writeFileSync(CODE_HASH_FILE, JSON.stringify({ phoneCodeHash, session: pendingSession }));

      console.log('\n✅ Verification code sent!');
      console.log(`\nAuth state saved to: ${CODE_HASH_FILE}`);
      console.log('\n📲 Check your Telegram app for the code.\n');
      console.log('Then run:');
      console.log(`  TELEGRAM_CODE=<code> npx tsx scripts/telegram-auth.ts\n`);
    } catch (error: any) {
      if (error.message?.includes('PHONE_NUMBER_INVALID')) {
        console.error('❌ Invalid phone number format. Use international format: +1234567890');
      } else {
        console.error('❌ Error requesting code:', error.message);
      }
    }

    await client.disconnect();
    return;
  }

  // STAGE 2: Sign in with code
  if (CODE) {
    let phoneCodeHash: string;
    try {
      const raw = readFileSync(CODE_HASH_FILE, 'utf-8').trim();
      // Support both new JSON format and legacy plain text
      try {
        const parsed = JSON.parse(raw);
        phoneCodeHash = parsed.phoneCodeHash;
      } catch {
        phoneCodeHash = raw;
      }
    } catch {
      console.error('❌ Code hash file not found. Run Stage 1 first.');
      await client.disconnect();
      return;
    }

    // Get phone from env or prompt
    let phone = PHONE;
    if (!phone) {
      phone = await prompt('Enter phone number (e.g., +1234567890): ');
    }

    console.log(`\n🔐 Signing in with code: ${CODE}`);

    try {
      const Api = (await import('telegram/tl')).Api;

      await client.invoke(
        new Api.auth.SignIn({
          phoneNumber: phone,
          phoneCodeHash: phoneCodeHash,
          phoneCode: CODE,
        })
      );

      console.log('\n✅ Successfully authenticated!\n');

      // Get user info
      const me = await client.getMe();
      console.log(`Logged in as: ${me.firstName} ${me.lastName || ''} (@${me.username || 'N/A'})`);

      // Save session
      const session = client.session.save() as string;
      console.log(`\n📦 Session string (${session.length} chars):\n`);
      console.log('─'.repeat(60));
      console.log(session);
      console.log('─'.repeat(60));
      console.log('\n⚠️  Copy this ENTIRE string to your .env.local:');
      console.log('TELEGRAM_SESSION=<paste here>\n');

      // Test fetching a channel
      console.log('Testing channel fetch...');
      try {
        const messages = await client.getMessages('DeepStateUA', { limit: 1 });
        console.log(`✅ Successfully fetched from @DeepStateUA: "${messages[0]?.message?.slice(0, 50)}..."\n`);
      } catch (e: any) {
        console.log(`⚠️  Channel test failed: ${e.message}\n`);
      }

    } catch (error: any) {
      if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
        console.error('\n❌ This account has 2FA enabled.');
        console.log('You need to enter your 2FA password.');

        const password = await prompt('Enter 2FA password: ');

        try {
          const Api = (await import('telegram/tl')).Api;
          const passwordResult = await client.invoke(new Api.account.GetPassword());

          // This is complex - need to compute SRP proof
          // For simplicity, use the high-level method
          await client.signInWithPassword(
            { apiId: API_ID, apiHash: API_HASH },
            { password: () => Promise.resolve(password) }
          );

          console.log('\n✅ 2FA authentication successful!');
          const session = client.session.save() as string;
          console.log(`\nSession string (${session.length} chars):`);
          console.log(session);

        } catch (e2: any) {
          console.error('❌ 2FA authentication failed:', e2.message);
        }

      } else if (error.message?.includes('PHONE_CODE_INVALID')) {
        console.error('❌ Invalid verification code. Check and try again.');
      } else if (error.message?.includes('PHONE_CODE_EXPIRED')) {
        console.error('❌ Verification code expired. Run Stage 1 again.');
      } else {
        console.error('❌ Sign in failed:', error.message);
      }
    }

    await client.disconnect();
    return;
  }

  // No phone or code provided - show instructions
  console.log('📋 Usage:\n');
  console.log('Stage 1 - Request verification code:');
  console.log('  TELEGRAM_PHONE=+1234567890 npx tsx scripts/telegram-auth.ts\n');
  console.log('Stage 2 - Complete auth with code from Telegram:');
  console.log('  TELEGRAM_CODE=12345 npx tsx scripts/telegram-auth.ts\n');

  await client.disconnect();
}

main().catch(console.error);
