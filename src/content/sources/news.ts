import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatNewsSources } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

interface RssItem {
  title: string;
  link: string;
  description: string;
}

const GLOBAL_CACHE = new Map<string, { items: RssItem[]; time: number }>();
const CACHE_TTL = 30 * 60 * 1000;

async function fetchRss(url: string): Promise<RssItem[]> {
  const cached = GLOBAL_CACHE.get(url);
  if (cached && Date.now() - cached.time < CACHE_TTL && cached.items.length > 0) {
    return cached.items;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`RSS ${res.status}`);
    const xml = await res.text();

    const items: RssItem[] = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null && items.length < 20) {
      const block = match[1];
      const title = block.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
      const description = block.match(/<description>(.*?)<\/description>/)?.[1] || '';
      if (title && link) {
        items.push({
          title: title.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').trim(),
          link: link.trim(),
          description: description.replace(/<!\[CDATA\[(.*?)\]\]>/s, '$1').replace(/<.*?>/g, '').trim(),
        });
      }
    }

    GLOBAL_CACHE.set(url, { items, time: Date.now() });
    return items;
  } catch (e) {
    console.error('RSS fetch error for', url, ':', e);
    return cached?.items || [];
  }
}

function parseNewsSources(envValue?: string): string[] {
  if (!envValue) return [];
  return envValue
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
    .map(s => (s.startsWith('http') ? s : `https://${s}`));
}

export async function getNewsContent(chatId?: number): Promise<ContentItem | null> {
  const sourcesList = getChatNewsSources(chatId);
  const sources = sourcesList.filter(Boolean).map(s => (s.startsWith('http') ? s : `https://${s}`));
  if (sources.length === 0) return null;

  const sourceUrl = sources[Math.floor(Math.random() * sources.length)];
  const items = await fetchRss(sourceUrl);
  if (items.length === 0) return null;

  // Filter out already posted news
  const chatIdNum = chatId ?? 0;
  const freshItems = items.filter(i => !wasContentPosted(chatIdNum, 'news', i.title, i.link));
  if (freshItems.length === 0) {
    console.log(`[News] All ${items.length} items already posted for chat ${chatIdNum}, skipping`);
    return null;
  }

  const item = freshItems[Math.floor(Math.random() * freshItems.length)];

  const prompt = `Напиши короткую заметку (1-2 предложения) о новости от лица айтишника, который casually делится инфой в рабочем чате. Не используй "Вот новость" или "Сообщается". Просто факт + лёгкое мнение.

Заголовок: ${item.title}
Описание: ${item.description.slice(0, 400)}`;

  const text = await askAI(prompt, undefined, 'friendly');

  return {
    type: 'news',
    text: text.trim(),
    link: item.link,
    tags: ['news'],
  };
}
