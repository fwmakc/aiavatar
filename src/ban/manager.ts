import { db } from '@/db';
import { config } from '@/config/env';
import { addRelationshipScore, getRelationship } from '@/relationship/manager';
import type { BanRecord } from '@/types';

const stmtGet = db.prepare('SELECT denials, banned_until FROM bans WHERE chat_id = ? AND user_id = ?');

const stmtUpsert = db.prepare(
  `INSERT INTO bans (chat_id, user_id, denials, banned_until)
   VALUES (?, ?, ?, ?)
   ON CONFLICT(chat_id, user_id) DO UPDATE SET
     denials = excluded.denials,
     banned_until = excluded.banned_until`
);

const stmtDelete = db.prepare('DELETE FROM bans WHERE chat_id = ? AND user_id = ?');

function getBanRecord(chatId: number | string, userId: number): BanRecord {
  const row = stmtGet.get(String(chatId), userId);
  if (!row) return { denials: 0, bannedUntil: 0 };
  return { denials: (row as any).denials, bannedUntil: (row as any).banned_until };
}

export function isUserBanned(chatId: number | string, userId: number): boolean {
  const record = getBanRecord(chatId, userId);
  if (record.bannedUntil === 0) return false;
  if (Date.now() < record.bannedUntil) return true;
  // Expired — clean up
  stmtDelete.run(String(chatId), userId);
  return false;
}

export function recordUserDenial(chatId: number | string, userId: number): boolean {
  const record = getBanRecord(chatId, userId);
  record.denials += 1;
  const justBanned = record.denials >= 2;
  if (justBanned) {
    record.bannedUntil = Date.now() + config.banDurationMs;
    if (config.titForTatMode) {
      const currentScore = getRelationship(chatId, userId).score;
      const targetScore = currentScore <= -3 ? -4 : -3;
      const delta = targetScore - currentScore;
      addRelationshipScore(chatId, userId, delta, 'предательство (бан)');
    }
  }
  stmtUpsert.run(String(chatId), userId, record.denials, record.bannedUntil);
  return justBanned;
}

export function resetUserViolations(chatId: number | string, userId: number): void {
  stmtDelete.run(String(chatId), userId);
}

// Backward-compatible singleton wrapper
class BanManager {
  isBanned(chatId: number | string, userId: number): boolean {
    return isUserBanned(chatId, userId);
  }

  recordDenial(chatId: number | string, userId: number): boolean {
    return recordUserDenial(chatId, userId);
  }

  resetViolations(chatId: number | string, userId: number): void {
    resetUserViolations(chatId, userId);
  }
}

export const banManager = new BanManager();
