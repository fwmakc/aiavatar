import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import {
  getChatState,
  updateLastMessageTime,
  recordContentPost,
  getRecentContentTypes,
  wasContentPosted,
  recordPostedContent,
  setActiveQuiz,
  getActiveQuiz,
  recordQuizAnswer,
  clearActiveQuiz,
} from './state';

function resetDb() {
  db.exec('DELETE FROM chat_engagement');
}

describe('content store state', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('getChatState', () => {
    it('creates default state for new chat', () => {
      const state = getChatState(1);
      expect(state.chatId).toBe(1);
      expect(state.lastMessageTime).toBeGreaterThan(0);
      expect(state.contentHistory).toEqual([]);
      expect(state.postedContent).toEqual([]);
    });

    it('returns existing state from db', () => {
      getChatState(1);
      updateLastMessageTime(1);
      const state = getChatState(1);
      expect(state.lastMessageTime).toBeGreaterThan(0);
    });
  });

  describe('content tracking', () => {
    it('records content post', () => {
      recordContentPost(1, 'news');
      const types = getRecentContentTypes(1);
      expect(types).toEqual(['news']);
    });

    it('keeps last 20 content types', () => {
      for (let i = 0; i < 25; i++) {
        recordContentPost(1, 'news');
      }
      const types = getRecentContentTypes(1, 25);
      expect(types).toHaveLength(20);
    });
  });

  describe('deduplication', () => {
    it('returns false for new content', () => {
      expect(wasContentPosted(1, 'news', 'First news')).toBe(false);
    });

    it('returns true for duplicate content', () => {
      recordPostedContent(1, 'news', 'Same news');
      expect(wasContentPosted(1, 'news', 'Same news')).toBe(true);
    });

    it('distinguishes same text with different types', () => {
      recordPostedContent(1, 'news', 'Docker tips');
      expect(wasContentPosted(1, 'joke', 'Docker tips')).toBe(false);
    });

    it('evicts old entries after 50 posts', () => {
      for (let i = 0; i < 55; i++) {
        recordPostedContent(1, 'news', `News ${i}`);
      }
      expect(wasContentPosted(1, 'news', 'News 0')).toBe(false);
      expect(wasContentPosted(1, 'news', 'News 54')).toBe(true);
    });
  });

  describe('quiz state', () => {
    it('round-trips active quiz through SQLite', () => {
      setActiveQuiz(1, {
        question: 'What is 2+2?',
        options: ['3', '4', '5'],
        correctIndex: 1,
      });

      const quiz = getActiveQuiz(1);
      expect(quiz).toBeDefined();
      expect(quiz!.question).toBe('What is 2+2?');
      expect(quiz!.options).toEqual(['3', '4', '5']);
      expect(quiz!.correctIndex).toBe(1);
      expect(quiz!.participants.size).toBe(0);
    });

    it('records participant answers', () => {
      setActiveQuiz(1, {
        question: 'Q?',
        options: ['A', 'B'],
        correctIndex: 0,
      });
      recordQuizAnswer(1, 42, 1);

      const quiz = getActiveQuiz(1);
      expect(quiz!.participants.get(42)).toBe(1);
    });

    it('clears active quiz', () => {
      setActiveQuiz(1, { question: 'Q?', options: ['A'], correctIndex: 0 });
      clearActiveQuiz(1);
      expect(getActiveQuiz(1)).toBeUndefined();
    });
  });
});
