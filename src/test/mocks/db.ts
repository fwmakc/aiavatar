import { db } from '@/db';

const TABLES = [
  'relationships',
  'user_profiles',
  'social_graph',
  'bans',
  'chat_engagement',
  'private_context',
];

export function resetDatabase(): void {
  for (const table of TABLES) {
    db.exec(`DELETE FROM ${table}`);
  }
}
