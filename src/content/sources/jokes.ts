import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatPersonaConfig } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

interface BashQuote {
  id: string;
  text: string;
}

let bashCache: BashQuote[] = [];
let bashCacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000;

const DEFAULT_BASH_RSS = 'https://bash.im/rss/';
const DEFAULT_JOKE_API_URL = 'https://v2.jokeapi.dev/joke/Programming?type=single&blacklistFlags=nsfw,racist,sexist,explicit';
const DEFAULT_FALLBACK_PROMPT = 'Расскажи короткий анекдот или шутку. Максимум 3 предложения. От первого лица — как будто ты сам её вспомнил и хочешь поделиться с чатом.';

async function fetchBashRSS(url: string): Promise<BashQuote[]> {
  if (Date.now() - bashCacheTime < CACHE_TTL && bashCache.length > 0) {
    return bashCache;
  }

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`Bash.im RSS ${res.status}`);
    const xml = await res.text();

    const quotes: BashQuote[] = [];
    const itemRegex = /<item>(.*?)<\/item>/gs;
    let match: RegExpExecArray | null;
    while ((match = itemRegex.exec(xml)) !== null && quotes.length < 20) {
      const block = match[1];
      const title = block.match(/<title>(.*?)<\/title>/)?.[1] || '';
      const description = block.match(/<description>(.*?)<\/description>/)?.[1] || '';
      if (description) {
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
        if (text.length > 20 && text.length < 2000) {
          quotes.push({ id: title.replace('#', '').trim(), text });
        }
      }
    }

    bashCache = quotes;
    bashCacheTime = Date.now();
    return quotes;
  } catch (e) {
    console.error('Bash.im fetch error:', e);
    return bashCache.length > 0 ? bashCache : [];
  }
}

async function fetchJokeAPI(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0' },
    });
    if (!res.ok) throw new Error(`JokeAPI ${res.status}`);
    const data = await res.json();
    if (data.error) throw new Error(data.message || 'JokeAPI error');
    return data.joke as string;
  } catch (e) {
    console.error('JokeAPI fetch error:', e);
    return null;
  }
}

async function translateIfNeeded(text: string): Promise<string> {
  const englishRatio = (text.match(/[a-zA-Z]/g) || []).length / text.length;
  if (englishRatio > 0.6) {
    const prompt = `Переведи эту шутку на русский язык. Сохрани юмор и неформальный тон. Не добавляй ничего от себя, только перевод:\n\n${text}`;
    const translated = await askAI(prompt, undefined, 'friendly');
    return translated.trim() || text;
  }
  return text;
}

export async function getJokeContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const jokesCfg = cfg.contentSources?.jokes;

  const bashRss = jokesCfg?.bashRss ?? DEFAULT_BASH_RSS;
  const jokeApiUrl = jokesCfg?.jokeApiUrl ?? DEFAULT_JOKE_API_URL;
  const fallbackPrompt = jokesCfg?.fallbackPrompt ?? DEFAULT_FALLBACK_PROMPT;

  // 50/50 — Bash.im или JokeAPI (if configured)
  const hasBash = !!bashRss;
  const hasJokeApi = !!jokeApiUrl;

  if (!hasBash && !hasJokeApi) {
    // Both disabled — go straight to fallback AI generation
    const text = await askAI(fallbackPrompt, undefined, 'friendly');
    return { type: 'joke', text: text.trim(), tags: ['joke'] };
  }

  const source = hasBash && (!hasJokeApi || Math.random() < 0.5) ? 'bash' : 'jokeapi';

  const chatIdNum = chatId ?? 0;

  if (source === 'bash' && hasBash) {
    const quotes = await fetchBashRSS(bashRss);
    const freshQuotes = quotes.filter(q => !wasContentPosted(chatIdNum, 'joke', q.text, `https://bash.im/quote/${q.id}`));
    if (freshQuotes.length > 0) {
      const quote = freshQuotes[Math.floor(Math.random() * freshQuotes.length)];
      return {
        type: 'joke',
        text: `💬 #${quote.id}\n\n${quote.text}`,
        link: `https://bash.im/quote/${quote.id}`,
        tags: ['joke', 'bash'],
      };
    }
    console.log(`[Jokes] All ${quotes.length} bash quotes already posted for chat ${chatIdNum}`);
  }

  if (hasJokeApi) {
    const joke = await fetchJokeAPI(jokeApiUrl);
    if (joke) {
      const translated = await translateIfNeeded(joke);
      if (!wasContentPosted(chatIdNum, 'joke', translated)) {
        return {
          type: 'joke',
          text: `😂 ${translated}`,
          tags: ['joke'],
        };
      }
      console.log(`[Jokes] JokeAPI returned duplicate for chat ${chatIdNum}`);
    }
  }

  // Ultimate fallback — AI generation
  const text = await askAI(fallbackPrompt, undefined, 'friendly');
  return { type: 'joke', text: text.trim(), tags: ['joke'] };
}
