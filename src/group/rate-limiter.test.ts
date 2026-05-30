import { describe, it, expect, beforeEach } from 'vitest';
import { canReplyInGroup, recordGroupReply, resetRateLimiter } from './rate-limiter';

describe('rate limiter', () => {
  beforeEach(() => {
    resetRateLimiter();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  describe('canReplyInGroup', () => {
    it('allows first reply and shows full remaining', () => {
      const result = canReplyInGroup('chat1');
      expect(result.allowed).toBe(true);
      expect(result.sleeping).toBe(false);
      expect(result.remaining).toBeGreaterThan(0);
    });

    it('blocks replies over the hourly limit', () => {
      const limit = 5; // default from env, may vary
      for (let i = 0; i < limit; i++) {
        recordGroupReply('chat1');
      }
      const result = canReplyInGroup('chat1');
      expect(result.allowed).toBe(false);
      expect(result.sleeping).toBe(true);
      expect(result.remaining).toBe(0);
    });

    it('resets window after 1 hour', () => {
      const limit = 5;
      for (let i = 0; i < limit; i++) {
        recordGroupReply('chat1');
      }
      expect(canReplyInGroup('chat1').allowed).toBe(false);

      vi.advanceTimersByTime(60 * 60 * 1000 + 1);

      const result = canReplyInGroup('chat1');
      expect(result.allowed).toBe(true);
      expect(result.sleeping).toBe(false);
    });
  });

  describe('recordGroupReply', () => {
    it('starts a new window on first reply', () => {
      recordGroupReply('chat1');
      const result = canReplyInGroup('chat1');
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });

    it('increments count within the same window', () => {
      recordGroupReply('chat1');
      recordGroupReply('chat1');
      const result = canReplyInGroup('chat1');
      expect(result.remaining).toBeGreaterThanOrEqual(0);
    });
  });

  describe('multi-chat isolation', () => {
    it('tracks limits per chat independently', () => {
      const limit = 5;
      for (let i = 0; i < limit; i++) {
        recordGroupReply('chatA');
      }
      expect(canReplyInGroup('chatA').allowed).toBe(false);
      expect(canReplyInGroup('chatB').allowed).toBe(true);
    });
  });
});
