import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import {
  getRelationship,
  addRelationshipScore,
  getRelationshipPromptAddon,
} from './manager';

function resetDb() {
  db.exec('DELETE FROM relationships');
}

describe('relationship manager', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('getRelationship', () => {
    it('returns default score 0 and empty history for unknown user', () => {
      const rel = getRelationship('chat1', 1);
      expect(rel.score).toBe(0);
      expect(rel.history).toEqual([]);
    });
  });

  describe('addRelationshipScore', () => {
    it('adds score and persists to db', () => {
      const score = addRelationshipScore('chat1', 1, 2, 'test reason');
      expect(score).toBe(2);

      const rel = getRelationship('chat1', 1);
      expect(rel.score).toBe(2);
      expect(rel.history).toHaveLength(1);
      expect(rel.history[0].delta).toBe(2);
      expect(rel.history[0].reason).toBe('test reason');
      expect(rel.history[0].score).toBe(2);
    });

    it('clamps score to maximum 5', () => {
      addRelationshipScore('chat1', 1, 5, 'max');
      const score = addRelationshipScore('chat1', 1, 2, 'overflow');
      expect(score).toBe(5);
    });

    it('clamps score to minimum -5', () => {
      addRelationshipScore('chat1', 1, -5, 'min');
      const score = addRelationshipScore('chat1', 1, -2, 'underflow');
      expect(score).toBe(-5);
    });

    it('accumulates multiple changes', () => {
      addRelationshipScore('chat1', 1, 1, 'a');
      addRelationshipScore('chat1', 1, 1, 'b');
      addRelationshipScore('chat1', 1, -3, 'c');
      const rel = getRelationship('chat1', 1);
      expect(rel.score).toBe(-1);
      expect(rel.history).toHaveLength(3);
    });

    it('truncates history to 20 entries', () => {
      for (let i = 0; i < 25; i++) {
        addRelationshipScore('chat1', 1, 0, `entry ${i}`);
      }
      const rel = getRelationship('chat1', 1);
      expect(rel.history).toHaveLength(20);
      expect(rel.history[0].reason).toBe('entry 5');
      expect(rel.history[19].reason).toBe('entry 24');
    });

    it('handles multiple chats and users independently', () => {
      addRelationshipScore('chatA', 1, 3, 'user1 in A');
      addRelationshipScore('chatB', 1, -2, 'user1 in B');
      addRelationshipScore('chatA', 2, 4, 'user2 in A');

      expect(getRelationship('chatA', 1).score).toBe(3);
      expect(getRelationship('chatB', 1).score).toBe(-2);
      expect(getRelationship('chatA', 2).score).toBe(4);
    });
  });

  describe('getRelationshipPromptAddon', () => {
    it('returns hostile text for score -5', () => {
      addRelationshipScore('c', 1, -5, '');
      const addon = getRelationshipPromptAddon('c', 1);
      expect(addon.length).toBeGreaterThan(0);
      expect(addon.toLowerCase()).toContain('саркастичен');
    });

    it('returns cold text for score -3', () => {
      addRelationshipScore('c', 1, -3, '');
      const addon = getRelationshipPromptAddon('c', 1);
      expect(addon.length).toBeGreaterThan(0);
      expect(addon.toLowerCase()).toContain('сдержан');
    });

    it('returns neutral text for score 0', () => {
      const addon = getRelationshipPromptAddon('c', 1);
      expect(addon.length).toBeGreaterThan(0);
      expect(addon.toLowerCase()).toContain('вежлив');
    });

    it('returns warm text for score 2', () => {
      addRelationshipScore('c', 1, 2, '');
      const addon = getRelationshipPromptAddon('c', 1);
      expect(addon.length).toBeGreaterThan(0);
      expect(addon.toLowerCase()).toContain('тепл');
    });

    it('returns intimate text for score 5', () => {
      addRelationshipScore('c', 1, 5, '');
      const addon = getRelationshipPromptAddon('c', 1);
      expect(addon.length).toBeGreaterThan(0);
      expect(addon.toLowerCase()).toContain('неформал');
    });
  });
});
