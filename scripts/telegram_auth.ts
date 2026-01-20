/**
 * Telegram Auth Script (Non-Interactive)
 * =======================================
 * Run this to get a session string for the app.
 *
 * Step 1 - Request code:
 *   TELEGRAM_PHONE=+1234567890 npx ts-node scripts/telegram_auth.ts
 *
 * Step 2 - Authenticate with code:
 *   TELEGRAM_PHONE=+1234567890 TELEGRAM_CODE=12345 npx ts-node scripts/telegram_auth.ts
 *
 * Then add the session string to .env.local:
 *   TELEGRAM_SESSION=your_session_string_here
 */

import { TelegramClient, Api } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as fs from 'fs';

const API_ID = parseInt(process.env.TELEGRAM_API_ID || '34591236', 10);
const API_HASH = process.env.TELEGRAM_API_HASH || '5aaa0b9349afe69aff162680f58633fd';
const PHONE = process.env.TELEGRAM_PHONE || '';
const CODE = process.env.TELEGRAM_CODE || '';

const HASH_FILE = 'telegram_code_hash.txt';

async function main() {
  console.log('Telegram Auth Script');
  console.log('====================\n');

  if (!PHONE) {
    console.log('Set TELEGRAM_PHONE environment variable');
    console.log('Example: TELEGRAM_PHONE=+16303010589 npx ts-node scripts/telegram_auth.ts');
    return;
  }

  const session = new StringSession('');
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.connect();

  if (!CODE) {
    // Step 1: Send code request
    const result = await client.invoke(
      new Api.auth.SendCode({
        phoneNumber: PHONE,
        apiId: API_ID,
        apiHash: API_HASH,
        settings: new Api.CodeSettings({}),
      })
    );

    // Save phone code hash (handle union type)
    const phoneCodeHash = (result as any).phoneCodeHash;
    if (!phoneCodeHash) {
      console.error('No phone code hash returned. You may already be logged in.');
      await client.disconnect();
      return;
    }
    fs.writeFileSync(HASH_FILE, phoneCodeHash);

    console.log(`✓ Code sent to ${PHONE}\n`);
    console.log('Check your Telegram app for the code, then run:');
    console.log(`TELEGRAM_PHONE=${PHONE} TELEGRAM_CODE=12345 npx ts-node scripts/telegram_auth.ts`);

    await client.disconnect();
    return;
  }

  // Step 2: Sign in with code
  if (!fs.existsSync(HASH_FILE)) {
    console.error('No code hash found. Run without TELEGRAM_CODE first to request a code.');
    await client.disconnect();
    return;
  }

  const phoneCodeHash = fs.readFileSync(HASH_FILE, 'utf8').trim();

  try {
    const result = await client.invoke(
      new Api.auth.SignIn({
        phoneNumber: PHONE,
        phoneCodeHash,
        phoneCode: CODE,
      })
    );

    // Clean up hash file
    fs.unlinkSync(HASH_FILE);

    console.log('✓ Authenticated successfully!\n');

    const sessionString = client.session.save() as unknown as string;

    console.log('Add this to your .env.local file:\n');
    console.log(`TELEGRAM_SESSION=${sessionString}\n`);
    console.log(`Session string length: ${sessionString.length}`);

  } catch (error: any) {
    if (error.message?.includes('SESSION_PASSWORD_NEEDED')) {
      console.error('2FA is enabled. This script does not support 2FA yet.');
    } else {
      console.error('Auth error:', error.message || error);
    }
  }

  await client.disconnect();
}

main().catch(console.error);
