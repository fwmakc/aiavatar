import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mockFs from 'mock-fs';
import {
  getChatPersonaConfig,
  buildSystemPrompt,
  getChatFeeds,
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
          feeds: [
            { url: 'https://example.com/rss', type: 'rss', comment: true, weight: 5 },
          ],
          fallbackPrompt: 'Tell a joke',
        },
        schedule: {
          activeHours: { start: '08:00', end: '23:00' },
          activeDays: [1, 2, 3, 4, 5],
        },
      }),
      'data/chats': {
        '1001234567890.json': JSON.stringify({
          name: 'GroupMax',
          style: 'sarcastic',
          contentSources: {
            feeds: [
              { url: 'https://override.com/rss', type: 'rss', weight: 3 },
            ],
          },
        }),
      },
      'data/personal_chats': {
        '789012.json': JSON.stringify({
          specialization: 'Grandson',
          style: 'gentle',
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
      expect(cfg.specialization).toBe('IT expert');
    });

    it('deep-merges contentSources', () => {
      const cfg = getChatPersonaConfig('1001234567890');
      expect(cfg.contentSources!.feeds).toEqual([
        { url: 'https://override.com/rss', type: 'rss', weight: 3 },
      ]);
      expect(cfg.contentSources!.fallbackPrompt).toBe('Tell a joke');
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

  describe('getChatFeeds', () => {
    it('returns default feeds', () => {
      const feeds = getChatFeeds();
      expect(feeds).toHaveLength(1);
      expect(feeds[0].url).toBe('https://example.com/rss');
    });

    it('returns chat-override feeds', () => {
      const feeds = getChatFeeds(1001234567890);
      expect(feeds).toHaveLength(1);
      expect(feeds[0].url).toBe('https://override.com/rss');
    });
  });

  describe('legacy migration', () => {
    it('migrates news/jokes to feeds', () => {
      mockFs.restore();
      mockFs({
        'data/default.json': JSON.stringify({
          name: 'Bot',
          language: 'english',
          specialization: 'test',
          interests: 'test',
          views: 'test',
          style: 'test',
          contentSources: {
            news: ['https://habr.com/rss'],
            jokes: {
              bashRss: 'https://bash.im/rss/',
              jokeApiUrl: 'https://jokeapi.example.com',
              fallbackPrompt: 'Tell me a joke',
            },
          },
          schedule: {
            quietHours: { start: '23:00', end: '08:00' },
            quietDays: [0, 6],
          },
        }),
        'data/chats': {},
        'data/personal_chats': {},
      });

      const cfg = getChatPersonaConfig();
      expect(cfg.contentSources!.feeds).toHaveLength(2);
      expect(cfg.contentSources!.feeds![0].url).toBe('https://habr.com/rss');
      expect(cfg.contentSources!.feeds![1].url).toBe('https://bash.im/rss/');
      expect(cfg.contentSources!.fallbackPrompt).toBe('Tell me a joke');
      expect(cfg.schedule!.activeHours).toEqual({ start: '08:00', end: '23:00' });
      expect(cfg.schedule!.activeDays).toEqual([1, 2, 3, 4, 5]);
    });
  });

  describe('getPersonaStages', () => {
    it('returns default stages', () => {
      const stages = getPersonaStages();
      expect(stages?.neutral?.style).toBe('Default neutral');
    });
  });
});
