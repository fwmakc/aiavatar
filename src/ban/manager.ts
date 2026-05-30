import { config } from '@/config/env';
import { relationships } from '@/relationship/manager';
import type { BanRecord } from '@/types';

export class BanManager {
  private data = new Map<string, BanRecord>();

  private key(chatId: number | string, userId: number): string {
    return `${chatId}:${userId}`;
  }

  isBanned(chatId: number | string, userId: number): boolean {
    const key = this.key(chatId, userId);
    const record = this.data.get(key);
    if (!record) return false;
    if (Date.now() < record.bannedUntil) return true;
    this.data.delete(key);
    return false;
  }

  recordDenial(chatId: number | string, userId: number): boolean {
    const key = this.key(chatId, userId);
    const record = this.data.get(key) || { denials: 0, bannedUntil: 0 };
    record.denials += 1;
    const justBanned = record.denials >= 2;
    if (justBanned) {
      record.bannedUntil = Date.now() + config.banDurationMs;
      if (config.titForTatMode) {
        const currentScore = relationships.get(chatId, userId).score;
        const targetScore = currentScore <= -3 ? -4 : -3;
        const delta = targetScore - currentScore;
        relationships.addScore(chatId, userId, delta, 'предательство (бан)');
      }
    }
    this.data.set(key, record);
    return justBanned;
  }

  resetViolations(chatId: number | string, userId: number): void {
    this.data.delete(this.key(chatId, userId));
  }
}

export const banManager = new BanManager();
