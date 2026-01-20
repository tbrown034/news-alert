/**
 * Quick test of GramJS with extracted session
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

const API_ID = 34591236;
const API_HASH = '5aaa0b9349afe69aff162680f58633fd';
const SESSION = '1AZWarzwBu8I83Q6iuSjHcRcKxeDGh8d8bPZO_XMi2wyBhDEDni-Ze2c-hOOHXDO7RRYLnv9soIwFspfJaFyY4ara3iZpqMeCU2IZvW8f2G4trR-aj4YH6PQbj9-xyu6P-j-0o0QgYccvh13zfIStgnm9ZQoIg_tiRybKsC1C9cexrLoe9vuPsAwLzwq26YcSBkJdh_Cb3G_9Rt6LAMHP5izrWy35TYWVF_pRdcrZOVJbY6Qh8ZGm1Ev9_5FTEHXv5uhKkUdDtnBvC3lk7t8t5eM2kaEwqwDNnCVPGR7yRnrNqt03Ak4JOnlGqzx4aAY0we3HHIYt4uPW5XtUx5gO19BV_38TYT8';

const TEST_CHANNELS = ['DeepStateUA', 'Reuters'];

async function main() {
  console.log('Testing GramJS with extracted session...\n');

  const session = new StringSession(SESSION);
  const client = new TelegramClient(session, API_ID, API_HASH, {
    connectionRetries: 3,
  });

  await client.connect();

  if (!await client.isUserAuthorized()) {
    console.error('Not authorized! Session may be invalid.');
    await client.disconnect();
    return;
  }

  console.log('✓ Authorized!\n');

  for (const channelName of TEST_CHANNELS) {
    try {
      console.log(`=== @${channelName} ===`);
      const channel = await client.getEntity(channelName);
      const messages = await client.getMessages(channel, { limit: 3 });

      for (const msg of messages) {
        if (msg.message) {
          const date = new Date((msg.date || 0) * 1000);
          const text = msg.message.slice(0, 100) + (msg.message.length > 100 ? '...' : '');
          console.log(`[${date.toISOString()}] ${text}`);
        }
      }
      console.log('');
    } catch (err) {
      console.error(`Error with ${channelName}:`, err);
    }
  }

  await client.disconnect();
  console.log('✓ Test complete');
}

main().catch(console.error);
