/**
 * Combined Telegram Auth Script
 * Requests code and waits for input in same session
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import * as readline from 'readline';

const API_ID = 34591236;
const API_HASH = '5aaa0b9349afe69aff162680f58633fd';
const PHONE = '+16303010589';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function ask(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function main() {
  console.log('Telegram Auth (Combined)\n');

  const session = new StringSession('');
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => PHONE,
    phoneCode: async () => {
      console.log(`\nCode sent to ${PHONE}`);
      return await ask('Enter the code: ');
    },
    password: async () => await ask('2FA password (if needed): '),
    onError: (err) => console.error('Error:', err),
  });

  console.log('\n✓ Authenticated!\n');

  const sessionString = client.session.save() as unknown as string;
  console.log('TELEGRAM_SESSION=' + sessionString);

  await client.disconnect();
  rl.close();
}

main().catch(console.error);
