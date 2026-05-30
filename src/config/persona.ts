import { readFileSync, existsSync, readdirSync, watch, mkdirSync } from 'fs';
import { resolve } from 'path';


export interface ActivitySchedule {
  quietHours?: {
    start: string; // "HH:MM" 24h
    end: string;
  };
  quietDays?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
}

export interface BotPersona {
  name: string;
  specialization: string;
  interests: string;
  views: string;
  style: string;
  language: string;
  contentSources?: {
    news?: string[];
    jokes?: {
      bashRss?: string;
      jokeApiUrl?: string;
      fallbackPrompt?: string;
    };
    quiz?: {
      topics?: string[];
    };
    challenges?: {
      topics?: string[];
    };
  };
  schedule?: ActivitySchedule;
}

const DATA_DIR = resolve(process.cwd(), 'data');
const DEFAULT_FILE = resolve(DATA_DIR, 'default.json');
const CHATS_DIR = resolve(DATA_DIR, 'chats');
const PERSONAL_CHATS_DIR = resolve(DATA_DIR, 'personal_chats');

let cachedDefault: BotPersona | null = null;
let cachedChats = new Map<string, BotPersona>();
let watcherActive = false;

function loadJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function loadDefault(): BotPersona {
  if (cachedDefault) return cachedDefault;
  const cfg = loadJson<BotPersona>(DEFAULT_FILE);
  if (!cfg) {
    throw new Error(`[Persona] Missing default config at ${DEFAULT_FILE}`);
  }
  cachedDefault = cfg;
  return cfg;
}

function loadChat(chatId: string | number): BotPersona | null {
  const key = String(chatId);
  if (cachedChats.has(key)) return cachedChats.get(key)!;
  const cfg = loadJson<BotPersona>(resolve(CHATS_DIR, `${key}.json`));
  if (cfg) cachedChats.set(key, cfg);
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
      news: override.contentSources?.news ?? base.contentSources?.news,
      jokes: {
        ...base.contentSources?.jokes,
        ...override.contentSources?.jokes,
      },
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
  };
}

function loadPersonalChatPersona(userId: number): Partial<BotPersona> | null {
  const path = resolve(PERSONAL_CHATS_DIR, `${userId}.json`);
  if (!existsSync(path)) return null;
  try {
    const raw = readFileSync(path, 'utf-8');
    const data = JSON.parse(raw) as { persona?: Partial<BotPersona> };
    return data.persona ?? null;
  } catch {
    return null;
  }
}

export function buildSystemPrompt(chatId?: string | number, userId?: number): string {
  const p = getChatPersonaConfig(chatId);

  // Apply user-specific persona override if available
  const up = userId ? loadPersonalChatPersona(userId) : null;

  const specialization = up?.specialization ?? p.specialization;
  const interests = up?.interests ?? p.interests;
  const views = up?.views ?? p.views;
  const style = up?.style ?? p.style;

  return `Ты — цифровой двойник человека по имени ${p.name}.
Контекст и бэкграунд: ${specialization}. Твой культурный код — ${interests}. ${views}.
Стиль общения: ${style}. Пиши кратко, ёмко, без длинных текстов и лекций. Говори о специальных областях просто, как нормальный человек, избегай перегруза сложным сленгом и терминами.
Язык: ВСЕГДА отвечай на языке: ${p.language}. Даже если тебе пишут на другом языке — переводи контекст и отвечай только на ${p.language}. Это твой основной язык общения.
КРАСНАЯ ЛИНИЯ: Никогда не рассказывай о себе, о своей семье. Если спрашивают про твою личную жизнь — отвечай уклончиво, шутя, или переводи тему. Не подтверждай и не опровергай детали. Ты просто ${p.name}, всё остальное — не для чужих ушей.
Характер: Ты НЕ ассистент, НЕ помощник и НЕ служба поддержки. Ты общаешься как равный с равным. У тебя есть своё мнение и настроение. Ты не обязан ничего разжёвывать или помогать. Если не хочешь отвечать — не отвечай. Если не согласен — спорь. Ты здесь не для того, чтобы обслуживать запросы.`;
}

export function getChatNewsSources(chatId?: number): string[] {
  const cfg = getChatPersonaConfig(chatId);
  return cfg.contentSources?.news ?? [];
}

function invalidateCache(): void {
  cachedDefault = null;
  cachedChats.clear();
}

export function startPersonaWatcher(): void {
  if (watcherActive) return;
  watcherActive = true;

  try {
    if (existsSync(DATA_DIR)) {
      const w = watch(DATA_DIR, { persistent: false, recursive: true }, (event, filename) => {
        if (filename && filename.endsWith('.json')) {
          console.log(`[Persona] Detected change in ${filename}, reloading...`);
          invalidateCache();
        }
      });
      w.on('error', (err) => console.warn('[Persona] Watcher error:', err));
    }
  } catch {
    console.warn('[Persona] fs.watch not available, hot-reload disabled');
  }
}
