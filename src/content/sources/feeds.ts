import { askAI } from '@/ai/client';
import type { ContentItem, FeedSource } from '@/content/types';
import { getChatPersonaConfig, getChatFeeds } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

interface FetchResult {
  text: string;
  link?: string;
  id?: string;
}

const CACHE = new Map<string, { items: FetchResult[]; time: number }>();
const CACHE_TTL = 30 * 60 * 1000;

async function fetchFromSource(source: FeedSource): Promise<FetchResult[]> {
  const cached = CACHE.get(source.url);
  if (cached && Date.now() - cached.time < CACHE_TTL && cached.items.length > 0) {
    return cached.items;
  }

  try {
    const res = await fetch(source.url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`Fetch ${res.status}`);

    let items: FetchResult[];

    if (source.type === 'rss') {
      items = parseRss(await res.text());
    } else {
      items = parseJson(await res.json(), source.path);
    }

    CACHE.set(source.url, { items, time: Date.now() });
    return items;
  } catch (e) {
    console.error(`[Feeds] Fetch error for ${source.url}:`, e);
    return cached?.items || [];
  }
}

function parseRss(xml: string): FetchResult[] {
  const items: FetchResult[] = [];
  const itemRegex = /<item>(.*?)<\/item>/gs;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
    const block = match[1];
    const title = block.match(/<title>(.*?)<\/title>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const description = block.match(/<description>(.*?)<\/description>/)?.[1] || '';

    const text = description
      .replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<.*?>/g, '')
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();

    const cleanTitle = title.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim();

    if (text && text.length > 10) {
      items.push({
        text: text,
        link: link.trim() || undefined,
        id: cleanTitle || link.trim(),
      });
    } else if (cleanTitle && link.trim()) {
      items.push({
        text: cleanTitle,
        link: link.trim(),
        id: cleanTitle,
      });
    }
  }

  return items;
}

function parseJson(data: unknown, path?: string): FetchResult[] {
  if (!path) {
    if (typeof data === 'string') return [{ text: data }];
    return [];
  }

  const parts = path.split('.');
  let current: unknown = data;
  for (const part of parts) {
    if (current && typeof current === 'object') {
      current = (current as Record<string, unknown>)[part];
    } else {
      return [];
    }
  }

  if (typeof current === 'string') {
    return [{ text: current }];
  }

  return [];
}

function pickWeightedSource(sources: FeedSource[]): FeedSource {
  const totalWeight = sources.reduce((sum, s) => sum + (s.weight ?? 5), 0);
  let roll = Math.random() * totalWeight;
  for (const source of sources) {
    roll -= source.weight ?? 5;
    if (roll <= 0) return source;
  }
  return sources[sources.length - 1];
}

async function translateIfNeeded(text: string, chatId?: number): Promise<string> {
  const cfg = getChatPersonaConfig(chatId);
  const language = cfg.language;

  const latinRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
  if (latinRatio < 0.3) return text;

  const prompt = `Переведи этот текст на ${language}. Сохрани смысл, юмор и неформальный тон. Не добавляй ничего от себя, только перевод:\n\n${text}`;
  const translated = await askAI(prompt, undefined, 'friendly');
  return translated.trim() || text;
}

const DEFAULT_FALLBACK_PROMPT = 'Расскажи короткий анекдот или шутку. Максимум 3 предложения. От первого лица — как будто ты сам её вспомнил и хочешь поделиться с чатом.';

export async function getFeedContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const feeds = getChatFeeds(chatId);
  const fallbackPrompt = cfg.contentSources?.fallbackPrompt ?? DEFAULT_FALLBACK_PROMPT;
  const chatIdNum = chatId ?? 0;

  if (feeds.length === 0) {
    const text = await askAI(fallbackPrompt, undefined, 'friendly');
    return { type: 'feed', text: text.trim(), tags: ['ai-generated'] };
  }

  const shuffled = [...feeds].sort(() => Math.random() - 0.5);
  for (const source of shuffled) {
    const items = await fetchFromSource(source);
    if (items.length === 0) continue;

    const freshItems = items.filter(i =>
      !wasContentPosted(chatIdNum, 'feed', i.text, i.link)
    );

    if (freshItems.length === 0) {
      console.log(`[Feeds] All ${items.length} items from ${source.url} already posted for chat ${chatIdNum}`);
      continue;
    }

    const item = freshItems[Math.floor(Math.random() * freshItems.length)];
    let text = item.text;

    if (source.translate) {
      text = await translateIfNeeded(text, chatId);
    }

    if (source.comment) {
      const commentPrompt = `Напиши короткую заметку (1-2 предложения) от лица айтишника, который casually делится инфой в рабочем чате. Не используй "Вот новость" или "Сообщается". Просто факт + лёгкое мнение.\n\nЗаголовок: ${text.slice(0, 200)}`;
      const commentary = await askAI(commentPrompt, undefined, 'friendly');
      text = commentary.trim() || text;
    }

    return {
      type: 'feed',
      text,
      link: item.link,
      tags: ['feed', source.type],
    };
  }

  console.log(`[Feeds] All sources exhausted for chat ${chatIdNum}, using AI fallback`);
  const text = await askAI(fallbackPrompt, undefined, 'friendly');
  return { type: 'feed', text: text.trim(), tags: ['ai-generated'] };
}
