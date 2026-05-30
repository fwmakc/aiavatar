import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { addUserMessage, getUserAnalyzedProfile, getAggressiveUsers } from './user-profile';

function resetDb() {
  db.exec('DELETE FROM user_profiles');
}

describe('user profile', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('addUserMessage', () => {
    it('increments message count', () => {
      addUserMessage(1, 'hello', 'весёлый');
      const p = getUserAnalyzedProfile(1);
      expect(p!.messageCount).toBe(1);
    });

    it('calculates average message length', () => {
      addUserMessage(1, 'hi', 'весёлый');
      addUserMessage(1, 'hello world', 'весёлый');
      const p = getUserAnalyzedProfile(1);
      expect(p!.avgMessageLength).toBe(6.5); // (2 + 11) / 2
    });

    it('sets aggression rate to 1.0 for aggressive message', () => {
      addUserMessage(1, 'stupid bot', 'агрессивный');
      const p = getUserAnalyzedProfile(1);
      expect(p!.aggressionRate).toBe(1);
    });

    it('sets aggression rate to 0.5 for mixed messages', () => {
      addUserMessage(1, 'hello', 'весёлый');
      addUserMessage(1, 'idiot', 'агрессивный');
      const p = getUserAnalyzedProfile(1);
      expect(p!.aggressionRate).toBe(0.5);
    });

    it('counts emoji frequency', () => {
      addUserMessage(1, 'hello 😀 world 😀', 'весёлый');
      const p = getUserAnalyzedProfile(1);
      expect(p!.emojiTop.get('😀')).toBe(2);
    });

    it('stores username and firstName', () => {
      addUserMessage(1, 'test', 'весёлый', 'ivan', 'Ivan');
      const p = getUserAnalyzedProfile(1);
      expect(p!.username).toBe('ivan');
      expect(p!.firstName).toBe('Ivan');
    });
  });

  describe('getAggressiveUsers', () => {
    it('returns empty array when no aggressive users', () => {
      addUserMessage(1, 'nice', 'весёлый');
      expect(getAggressiveUsers()).toHaveLength(0);
    });

    it('returns users above threshold', () => {
      addUserMessage(1, 'attack', 'агрессивный');
      addUserMessage(2, 'hello', 'весёлый');
      const aggressive = getAggressiveUsers(0.5);
      expect(aggressive).toHaveLength(1);
      expect(aggressive[0].userId).toBe(1);
    });
  });
});
