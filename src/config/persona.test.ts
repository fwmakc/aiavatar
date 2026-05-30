import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import {
  getChatPersonaConfig,
  buildSystemPrompt,
  getChatNewsSources,
  getPersonaStages,
} from './persona';

describe('persona config', () => {
  afterEach(() => {
    mockFs.restore();
  });

  beforeEach(() => {
    mockFs({
      'data/default.json': JSON.stringify({
        name: 'Макс',
        language: 'русский',
        specialization: 'IT expert',
        interests: 'retro culture',
        views: 'moderate',
        style: 'friendly',
        personaStages: {
          neutral: { style: 'Default neutral' },
        },
        contentSources: {
          news: ['https://example.com/news'],
          jokes: { bashRss: 'https://bash.im/rss' },
        },
        schedule: {
          quietHours: { start: '23:00', end: '08:00' },
          quietDays: [0, 6],
        },
      }),
      'data/chats': {
        '1001234567890.json': JSON.stringify({
          name: 'GroupMax',
          style: 'sarcastic',
          contentSources: {
            news: ['https://override.com/news'],
          },
        }),
      },
      'data/personal_chats': {
        '789012.json': JSON.stringify({
          persona: {
            specialization: 'Grandson',
            style: 'gentle',
          },
        }),
      },
    });
  });

  describe('getChatPersonaConfig', () => {
    it('returns default config when no chatId', () => {
      const cfg = getChatPersonaConfig();
      expect(cfg.name).toBe('Макс');
      expect(cfg.style).toBe('friendly');
    });

    it('merges chat override over default', () => {
      const cfg = getChatPersonaConfig('1001234567890');
      expect(cfg.name).toBe('GroupMax');
      expect(cfg.style).toBe('sarcastic');
      expect(cfg.specialization).toBe('IT expert'); // from default
    });

    it('deep-merges contentSources', () => {
      const cfg = getChatPersonaConfig('1001234567890');
      expect(cfg.contentSources!.news).toEqual(['https://override.com/news']);
      expect(cfg.contentSources!.jokes!.bashRss).toBe('https://bash.im/rss');
    });

    it('returns default for unknown chat', () => {
      const cfg = getChatPersonaConfig('999999');
      expect(cfg.name).toBe('Макс');
    });
  });

  describe('buildSystemPrompt', () => {
    it('includes bot name and language', () => {
      const prompt = buildSystemPrompt();
      expect(prompt).toContain('Макс');
      expect(prompt).toContain('русский');
    });

    it('applies personal_chat override in DMs', () => {
      const prompt = buildSystemPrompt(undefined, 789012);
      expect(prompt).toContain('Grandson');
      expect(prompt).toContain('gentle');
    });
  });

  describe('getChatNewsSources', () => {
    it('returns default news sources', () => {
      expect(getChatNewsSources()).toEqual(['https://example.com/news']);
    });

    it('returns chat-override news sources', () => {
      expect(getChatNewsSources(1001234567890)).toEqual(['https://override.com/news']);
    });
  });

  describe('getPersonaStages', () => {
    it('returns default stages', () => {
      const stages = getPersonaStages();
      expect(stages?.neutral?.style).toBe('Default neutral');
    });
  });
});
