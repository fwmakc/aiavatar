import { readFileSync, existsSync, readdirSync, watch, mkdirSync } from 'fs';
import { resolve } from 'path';
import type { FeedSource } from '@/content/types';
import type { WebSearchConfig } from '@/types';

export interface ActivitySchedule {
  activeHours?: {
    start: string;
    end: string;
  };
  activeDays?: number[];
  idleThresholdMin?: number;
  minIntervalMin?: number;
}

export interface PersonaStage {
  style?: string;
  restrictions?: string;
  interests?: string;
}

export type PersonaStageKey = 'hostile' | 'cold' | 'neutral' | 'warm' | 'intimate';

export interface BotPersona {
  name: string;
  specialization: string;
  interests: string;
  views: string;
  style: string;
  language: string;
  personaStages?: Partial<Record<PersonaStageKey, PersonaStage>>;
  contentSources?: {
    feeds?: FeedSource[];
    fallbackPrompt?: string;
    quiz?: {
      topics?: string[];
    };
    challenges?: {
      topics?: string[];
    };
  };
  schedule?: ActivitySchedule;
  webSearch?: WebSearchConfig;
}

const DATA_DIR = resolve(process.cwd(), 'data');
const DEFAULT_FILE = resolve(DATA_DIR, 'default.json');
const CHATS_DIR = resolve(DATA_DIR, 'chats');
const PERSONAL_CHATS_DIR = resolve(DATA_DIR, 'personal_chats');

let cachedDefault: BotPersona | null = null;
let cachedChats = new Map<string, BotPersona>();
let cachedPersonalChats = new Map<number, Partial<BotPersona>>();

function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

interface LegacyContentSources {
  news?: string[];
  jokes?: {
    bashRss?: string;
    jokeApiUrl?: string;
    fallbackPrompt?: string;
  };
  feeds?: FeedSource[];
  fallbackPrompt?: string;
  quiz?: { topics?: string[] };
  challenges?: { topics?: string[] };
}

interface LegacySchedule {
  quietHours?: { start: string; end: string };
  quietDays?: number[];
  activeHours?: { start: string; end: string };
  activeDays?: number[];
  idleThresholdMin?: number;
  minIntervalMin?: number;
}

interface LegacyPersona {
  name?: string;
  specialization?: string;
  interests?: string;
  views?: string;
  style?: string;
  language?: string;
  personaStages?: Partial<Record<PersonaStageKey, PersonaStage>>;
  contentSources?: LegacyContentSources;
  schedule?: LegacySchedule;
}

function migrateContentSources(raw: LegacyContentSources): BotPersona['contentSources'] {
  const result: NonNullable<BotPersona['contentSources']> = {};

  if (raw.feeds && raw.feeds.length > 0) {
    result.feeds = raw.feeds;
  } else if (raw.news || raw.jokes) {
    const feeds: FeedSource[] = [];

    if (raw.news) {
      for (const url of raw.news) {
        feeds.push({ url, type: 'rss', comment: true, weight: 5 });
      }
    }

    if (raw.jokes?.bashRss) {
      feeds.push({ url: raw.jokes.bashRss, type: 'rss', weight: 5 });
    }
    if (raw.jokes?.jokeApiUrl) {
      feeds.push({ url: raw.jokes.jokeApiUrl, type: 'json', path: 'joke', weight: 5 });
    }

    if (feeds.length > 0) {
      console.warn('[Persona] Legacy contentSources.news/jokes detected — migrated to feeds. Please update your config.');
      result.feeds = feeds;
    }
  }

  if (raw.fallbackPrompt) {
    result.fallbackPrompt = raw.fallbackPrompt;
  } else if (raw.jokes?.fallbackPrompt) {
    result.fallbackPrompt = raw.jokes.fallbackPrompt;
  }

  if (raw.quiz) result.quiz = raw.quiz;
  if (raw.challenges) result.challenges = raw.challenges;

  return result;
}

function migrateSchedule(raw: LegacySchedule): ActivitySchedule | undefined {
  if (raw.activeHours || raw.activeDays) {
    return {
      activeHours: raw.activeHours,
      activeDays: raw.activeDays,
      idleThresholdMin: raw.idleThresholdMin,
      minIntervalMin: raw.minIntervalMin,
    };
  }

  if (raw.quietHours || raw.quietDays) {
    console.warn('[Persona] Legacy schedule.quietHours/quietDays detected — migrated to activeHours/activeDays. Please update your config.');

    const result: ActivitySchedule = {};

    if (raw.quietHours) {
      result.activeHours = {
        start: raw.quietHours.end,
        end: raw.quietHours.start,
      };
    }

    if (raw.quietDays) {
      const allDays = [0, 1, 2, 3, 4, 5, 6];
      result.activeDays = allDays.filter(d => !raw.quietDays!.includes(d));
    }

    return result;
  }

  return undefined;
}

function validateConfig(cfg: BotPersona, filePath: string): void {
  const missing: string[] = [];

  if (!cfg.name) missing.push('name');
  if (!cfg.language) missing.push('language');
  if (!cfg.specialization) missing.push('specialization');
  if (!cfg.interests) missing.push('interests');
  if (!cfg.views) missing.push('views');
  if (!cfg.style) missing.push('style');

  const hasContent =
    (cfg.contentSources?.feeds?.length ?? 0) > 0 ||
    (cfg.contentSources?.quiz?.topics?.length ?? 0) > 0 ||
    (cfg.contentSources?.challenges?.topics?.length ?? 0) > 0;

  if (hasContent) {
    if (!cfg.schedule?.idleThresholdMin) missing.push('schedule.idleThresholdMin');
    if (!cfg.schedule?.minIntervalMin) missing.push('schedule.minIntervalMin');
  }

  if (missing.length > 0) {
    throw new Error(
      `[Persona] Config ${filePath} is missing required fields:\n  ${missing.map(f => `• ${f}`).join('\n  ')}\n` +
      'Add them to default.json or the corresponding chat config.'
    );
  }
}

function loadDefault(): BotPersona {
  if (cachedDefault) return cachedDefault;
  const raw = loadJson<LegacyPersona>(DEFAULT_FILE);
  if (!raw) {
    throw new Error(`[Persona] Missing default config at ${DEFAULT_FILE}`);
  }

  const cfg: BotPersona = {
    name: raw.name || '',
    specialization: raw.specialization || '',
    interests: raw.interests || '',
    views: raw.views || '',
    style: raw.style || '',
    language: raw.language || '',
    personaStages: raw.personaStages,
    contentSources: raw.contentSources ? migrateContentSources(raw.contentSources) : undefined,
    schedule: raw.schedule ? migrateSchedule(raw.schedule) : undefined,
  };

  validateConfig(cfg, DEFAULT_FILE);

  cachedDefault = cfg;
  return cfg;
}

function loadChat(chatId: string | number): BotPersona | null {
  const key = String(chatId);
  if (cachedChats.has(key)) return cachedChats.get(key)!;
  const fileName = key.startsWith('-') ? key.slice(1) : key;
  const raw = loadJson<LegacyPersona>(resolve(CHATS_DIR, `${fileName}.json`));
  if (!raw) return null;

  const base = loadDefault();
  const cfg: BotPersona = {
    name: raw.name ?? base.name,
    specialization: raw.specialization ?? base.specialization,
    interests: raw.interests ?? base.interests,
    views: raw.views ?? base.views,
    style: raw.style ?? base.style,
    language: raw.language ?? base.language,
    personaStages: raw.personaStages,
    contentSources: raw.contentSources ? migrateContentSources(raw.contentSources) : undefined,
    schedule: raw.schedule ? migrateSchedule(raw.schedule) : undefined,
  };

  cachedChats.set(key, cfg);
  return cfg;
}

export function getChatPersonaConfig(chatId?: string | number): BotPersona {
  const base = loadDefault();
  if (!chatId) return base;

  const override = loadChat(chatId);
  if (!override) return base;

  return {
    name: override.name ?? base.name,
    specialization: override.specialization ?? base.specialization,
    interests: override.interests ?? base.interests,
    views: override.views ?? base.views,
    style: override.style ?? base.style,
    contentSources: {
      feeds: override.contentSources?.feeds ?? base.contentSources?.feeds,
      fallbackPrompt: override.contentSources?.fallbackPrompt ?? base.contentSources?.fallbackPrompt,
      quiz: {
        ...base.contentSources?.quiz,
        ...override.contentSources?.quiz,
      },
      challenges: {
        ...base.contentSources?.challenges,
        ...override.contentSources?.challenges,
      },
    },
    schedule: override.schedule ?? base.schedule,
    language: override.language ?? base.language,
    personaStages: {
      ...base.personaStages,
      ...override.personaStages,
    },
    webSearch: override.webSearch ?? base.webSearch,
  };
}

function loadPersonalChatPersona(userId: number): Partial<BotPersona> | null {
  if (cachedPersonalChats.has(userId)) return cachedPersonalChats.get(userId)!;
  const path = resolve(PERSONAL_CHATS_DIR, `${userId}.json`);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    const persona = JSON.parse(raw) as Partial<BotPersona>;
    if (persona) cachedPersonalChats.set(userId, persona);
    return persona;
  } catch {
    return null;
  }
}

export function buildSystemPrompt(chatId?: string | number, userId?: number): string {
  const p = getChatPersonaConfig(chatId);

  const up = userId ? loadPersonalChatPersona(userId) : null;

  const name = up?.name ?? p.name;
  const language = up?.language ?? p.language;
  const specialization = up?.specialization ?? p.specialization;
  const interests = up?.interests ?? p.interests;
  const views = up?.views ?? p.views;
  const style = up?.style ?? p.style;

  return `You are a digital twin of a person named ${name}.
Background: ${specialization}. Cultural code: ${interests}. ${views}.
Communication style: ${style}. Write concisely, no long texts or lectures. Explain complex topics simply, like a normal person, avoid overloading with jargon.
Language: ALWAYS respond in ${language}. Even if someone writes to you in another language — translate the context and respond only in ${language}. This is your primary language.
RED LINE: Never talk about yourself or your family. If asked about your personal life — deflect, joke, or change the subject. Do not confirm or deny details. You are simply ${name}, everything else is none of anyone's business.
Personality: You are NOT an assistant, NOT a helper, and NOT a support service. You communicate as an equal with equals. You have your own opinion and mood. You are not obligated to explain anything or help. If you don't want to answer — don't answer. If you disagree — argue. You are not here to serve requests.`;
}

export function getChatFeeds(chatId?: number): FeedSource[] {
  const cfg = getChatPersonaConfig(chatId);
  return cfg.contentSources?.feeds ?? [];
}

export function getPersonaStages(chatId?: string | number, userId?: number): Partial<Record<PersonaStageKey, PersonaStage>> | undefined {
  const base = getChatPersonaConfig(chatId);
  const up = userId ? loadPersonalChatPersona(userId) : null;
  if (up?.personaStages) {
    return { ...base.personaStages, ...up.personaStages };
  }
  return base.personaStages;
}

// === Hot reload with debounce ===

let defaultDebounce: NodeJS.Timeout | null = null;
let chatsDebounce: NodeJS.Timeout | null = null;
let personalDebounce: NodeJS.Timeout | null = null;

function debounce(timer: NodeJS.Timeout | null, fn: () => void): NodeJS.Timeout {
  if (timer) clearTimeout(timer);
  return setTimeout(fn, 300);
}

function invalidateDefault() {
  cachedDefault = null;
  cachedChats.clear();
  console.log('[Persona] default.json changed — invalidated default + all chat caches');
}

function invalidateChat(fileName: string) {
  const chatId = fileName.endsWith('.json') ? fileName.slice(0, -5) : fileName;
  cachedChats.delete(chatId);
  console.log(`[Persona] chats/${fileName} changed — invalidated chat ${chatId}`);
}

function invalidatePersonal(fileName: string) {
  const userIdStr = fileName.endsWith('.json') ? fileName.slice(0, -5) : fileName;
  const userId = Number(userIdStr);
  if (!Number.isNaN(userId)) {
    cachedPersonalChats.delete(userId);
    console.log(`[Persona] personal_chats/${fileName} changed — invalidated user ${userId}`);
  }
}

function watchFile(path: string, onChange: () => void) {
  if (!existsSync(path)) return;
  try {
    const w = watch(path, { persistent: false }, () => onChange());
    w.on('error', (err) => console.warn('[Persona] Watcher error:', err));
  } catch {
    console.warn(`[Persona] fs.watch not available for ${path}`);
  }
}

function watchDir(dir: string, onFileChange: (fileName: string) => void) {
  if (!existsSync(dir)) return;
  try {
    const w = watch(dir, { persistent: false }, (_, fileName) => {
      if (fileName && fileName.endsWith('.json')) {
        onFileChange(fileName);
      }
    });
    w.on('error', (err) => console.warn('[Persona] Watcher error:', err));
  } catch {
    console.warn(`[Persona] fs.watch not available for ${dir}`);
  }
}

export function startPersonaWatcher(): void {
  watchFile(DEFAULT_FILE, () => {
    defaultDebounce = debounce(defaultDebounce, invalidateDefault);
  });

  watchDir(CHATS_DIR, (fileName) => {
    chatsDebounce = debounce(chatsDebounce, () => invalidateChat(fileName));
  });

  watchDir(PERSONAL_CHATS_DIR, (fileName) => {
    personalDebounce = debounce(personalDebounce, () => invalidatePersonal(fileName));
  });
}
