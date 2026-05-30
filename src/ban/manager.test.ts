import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { isUserBanned, recordUserDenial, resetUserViolations } from './manager';

function resetDb() {
  db.exec('DELETE FROM bans');
  db.exec('DELETE FROM relationships');
}

describe('ban manager', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('isUserBanned', () => {
    it('returns false for unknown user', () => {
      expect(isUserBanned('chat1', 1)).toBe(false);
    });

    it('returns true when ban has not expired', () => {
      recordUserDenial('chat1', 1);
      recordUserDenial('chat1', 1); // 2nd denial triggers ban
      expect(isUserBanned('chat1', 1)).toBe(true);
    });

    it('returns false and cleans up when ban has expired', () => {
      recordUserDenial('chat1', 1);
      recordUserDenial('chat1', 1);
      expect(isUserBanned('chat1', 1)).toBe(true);

      // Advance time past ban duration (24h = 86400000ms)
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      expect(isUserBanned('chat1', 1)).toBe(false);
      // Verify cleanup: querying again should still be false
      expect(isUserBanned('chat1', 1)).toBe(false);
    });
  });

  describe('recordUserDenial', () => {
    it('does not ban on first denial', () => {
      const banned = recordUserDenial('chat1', 1);
      expect(banned).toBe(false);
      expect(isUserBanned('chat1', 1)).toBe(false);
    });

    it('bans on second denial', () => {
      recordUserDenial('chat1', 1);
      const banned = recordUserDenial('chat1', 1);
      expect(banned).toBe(true);
      expect(isUserBanned('chat1', 1)).toBe(true);
    });

    it('resets denial count after successful interaction', () => {
      recordUserDenial('chat1', 1);
      resetUserViolations('chat1', 1);
      const banned = recordUserDenial('chat1', 1);
      expect(banned).toBe(false);
    });

    it('handles multiple chats independently', () => {
      recordUserDenial('chatA', 1);
      recordUserDenial('chatA', 1);
      recordUserDenial('chatB', 1);

      expect(isUserBanned('chatA', 1)).toBe(true);
      expect(isUserBanned('chatB', 1)).toBe(false);
    });
  });

  describe('resetUserViolations', () => {
    it('clears an active ban', () => {
      recordUserDenial('chat1', 1);
      recordUserDenial('chat1', 1);
      expect(isUserBanned('chat1', 1)).toBe(true);

      resetUserViolations('chat1', 1);
      expect(isUserBanned('chat1', 1)).toBe(false);
    });
  });
});
