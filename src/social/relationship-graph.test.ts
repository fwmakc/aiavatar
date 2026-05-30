import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import {
  updateGraphInteraction,
  getGraphWeight,
  getGraphEdges,
  findConflictPair,
} from './relationship-graph';

function resetDb() {
  db.exec('DELETE FROM social_graph');
}

describe('relationship graph', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('updateGraphInteraction', () => {
    it('ignores self-interaction', () => {
      updateGraphInteraction(1, 1, 'весёлый', true);
      expect(getGraphWeight(1, 1)).toBe(0);
    });

    it('increases weight for positive tone', () => {
      updateGraphInteraction(1, 2, 'весёлый', true);
      expect(getGraphWeight(1, 2)).toBe(2);
    });

    it('decreases weight for aggressive tone', () => {
      updateGraphInteraction(1, 2, 'агрессивный', true);
      expect(getGraphWeight(1, 2)).toBe(-3);
    });

    it('decreases weight for sarcastic tone', () => {
      updateGraphInteraction(1, 2, 'саркастичный', true);
      expect(getGraphWeight(1, 2)).toBe(-1);
    });

    it('increments interaction count', () => {
      updateGraphInteraction(1, 2, 'нейтральный', true);
      updateGraphInteraction(1, 2, 'нейтральный', true);
      const edges = getGraphEdges(1);
      expect(edges[0].interactionCount).toBe(2);
    });

    it('clamps weight to maximum 10', () => {
      for (let i = 0; i < 10; i++) {
        updateGraphInteraction(1, 2, 'весёлый', true);
      }
      expect(getGraphWeight(1, 2)).toBe(10);
    });

    it('clamps weight to minimum -10', () => {
      for (let i = 0; i < 10; i++) {
        updateGraphInteraction(1, 2, 'агрессивный', true);
      }
      expect(getGraphWeight(1, 2)).toBe(-10);
    });

    it('is directed (1→2 != 2→1)', () => {
      updateGraphInteraction(1, 2, 'весёлый', true);
      expect(getGraphWeight(1, 2)).toBe(2);
      expect(getGraphWeight(2, 1)).toBe(0);
    });
  });

  describe('findConflictPair', () => {
    it('returns null when no conflicts', () => {
      const pair = findConflictPair([1, 2, 3]);
      expect(pair).toBeNull();
    });

    it('finds pair with worst negative weight', () => {
      updateGraphInteraction(1, 2, 'агрессивный', true);
      updateGraphInteraction(1, 2, 'агрессивный', true);
      // weight = -6 now
      const pair = findConflictPair([1, 2]);
      expect(pair).toEqual([1, 2]);
    });

    it('ignores edges outside chat members', () => {
      updateGraphInteraction(1, 99, 'агрессивный', true);
      updateGraphInteraction(1, 99, 'агрессивный', true);
      const pair = findConflictPair([1, 2]);
      expect(pair).toBeNull();
    });
  });
});
