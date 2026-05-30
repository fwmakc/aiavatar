import { bot } from '@/telegram/bot';
import { config } from '@/config/env';
import { generateContent } from '@/content/engine';
import { isQuietTime } from '@/schedule/checker';
import {
  getChatState,
  getAllChatIds,
  registerChat,
  recordContentPost,
  recordBotActivity,
  recordPostedContent,
} from '@/content/store/state';
import type { ContentItem } from '@/content/types';

const IDLE_THRESHOLD_MS = 60 * 60 * 1000; // 1 hour of silence before content post before posting
const MIN_INTERVAL_BETWEEN_POSTS_MS = 2 * 60 * 60 * 1000; // min 2 hours between content posts per chat

// Adaptive check intervals based on chat activity
const CHECK_5_MIN = 5 * 60 * 1000;
const CHECK_10_MIN = 10 * 60 * 1000;
const CHECK_30_MIN = 30 * 60 * 1000;
const CHECK_60_MIN = 60 * 60 * 1000;

let checkTimer: NodeJS.Timeout | null = null;

export function startContentScheduler(): void {
  if (!config.contentEngineEnabled) {
    console.log('[ContentEngine] Disabled');
    return;
  }

  console.log('[ContentEngine] Started (adaptive)');

  // Run once shortly after start, then schedule adaptively
  setTimeout(() => {
    runCheckCycle();
  }, 60 * 1000);
}

function computeNextCheckDelay(): number {
  const chatIds = getAllChatIds();
  if (chatIds.length === 0) {
    return CHECK_60_MIN;
  }

  const now = Date.now();
  let shortestIdle = Infinity;

  for (const chatId of chatIds) {
    const state = getChatState(chatId);
    const idle = now - state.lastMessageTime;
    if (idle < shortestIdle) {
      shortestIdle = idle;
    }
  }

  // Most active chat determines check frequency
  if (shortestIdle < 10 * 60 * 1000) {
    return CHECK_5_MIN; // Active chat → check often
  }
  if (shortestIdle < 30 * 60 * 1000) {
    return CHECK_10_MIN;
  }
  if (shortestIdle < 60 * 60 * 1000) {
    return CHECK_30_MIN;
  }
  return CHECK_60_MIN; // All chats idle → check rarely
}

async function runCheckCycle(): Promise<void> {
  try {
    await checkAllChats();
  } catch (e) {
    console.error('[ContentEngine] Check cycle error:', e);
  }

  const nextDelay = computeNextCheckDelay();
  console.log(`[ContentEngine] Next check in ${Math.round(nextDelay / 60000)} min`);

  if (checkTimer) {
    clearTimeout(checkTimer);
  }
  checkTimer = setTimeout(runCheckCycle, nextDelay);
}

function shouldPostToChat(chatId: number): boolean {
  const state = getChatState(chatId);
  const now = Date.now();

  // Don't post if we posted recently
  if (state.lastContentPostTime > 0 && now - state.lastContentPostTime < MIN_INTERVAL_BETWEEN_POSTS_MS) {
    const minsLeft = Math.ceil((MIN_INTERVAL_BETWEEN_POSTS_MS - (now - state.lastContentPostTime)) / 60000);
    console.log(`[ContentEngine] chat ${chatId}: недавно постил, подожди ${minsLeft} мин`);
    return false;
  }

  // Post if chat is idle (no messages for 1 hour)
  const idleMin = Math.round((now - state.lastMessageTime) / 60000);
  const isIdle = now - state.lastMessageTime >= IDLE_THRESHOLD_MS;

  if (isIdle) {
    console.log(`[ContentEngine] chat ${chatId}: тишина ${idleMin} мин, можно постить`);
    return true;
  }

  console.log(`[ContentEngine] chat ${chatId}: активность ${idleMin} мин назад, молчу`);
  return false;
}

async function checkAllChats(): Promise<void> {
  const chatIds = getAllChatIds();
  if (chatIds.length === 0) return;

  for (const chatId of chatIds) {
    if (isQuietTime(chatId)) {
      console.log(`[ContentEngine] chat ${chatId}: тихие часы, пропускаю`);
      continue;
    }
    if (!shouldPostToChat(chatId)) continue;

    try {
      const item = await generateContent(chatId);
      if (!item) continue;

      await postContent(chatId, item);
      recordContentPost(chatId, item.type);
      recordPostedContent(chatId, item.type, item.text, item.link);
      recordBotActivity(chatId);
      console.log(`[ContentEngine] chat ${chatId}: запостил ${item.type}`);
    } catch (e) {
      console.error(`[ContentEngine] Failed to post to chat ${chatId}:`, e);
    }
  }
}

const INTROS: Record<string, string[]> = {
  news: [
    'Смотрите, вот нашёл новость:',
    'Кое-что интересное из ленты:',
    'Вот это прилетело в мою ленту:',
    'Наткнулся на это, зацените:',
  ],
  joke: [
    'Хочу поделиться шуткой:',
    'Вспомнил анекдот:',
    'Расскажу по секрету:',
    'Вот это меня рассмешило:',
  ],
  quiz: [
    'Давайте поиграем?',
    'Кто хочет тест?',
    'Проверим мозги?',
    'Вопрос на засыпку:',
  ],
  challenge: [
    'Давайте разомнёмся:',
    'Небольшая пауза на здоровье:',
    'Отвлекитесь на минутку:',
    'Рекомендую сделать вот это:',
  ],
};

function pickIntro(type: string): string {
  const pool = INTROS[type] || ['Вот кое-что:'];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function postContent(chatId: number, item: ContentItem): Promise<void> {
  const intro = pickIntro(item.type);
  let messageText = `${intro}\n\n${item.text}`;
  if (item.link) {
    messageText += `\n\n👉 ${item.link}`;
  }

  // Quiz handling — native Telegram quiz poll
  if (item.type === 'quiz' && item.options && item.correctIndex !== undefined) {
    const question = item.text.replace(/^🧠\s*/, '').replace(/<[^>]+>/g, '');
    await bot.telegram.sendPoll(chatId, `${intro}\n\n${question}`, item.options, {
      type: 'quiz',
      correct_option_id: item.correctIndex,
      is_anonymous: false,
      explanation_parse_mode: 'HTML',
    });
    return;
  }

  await bot.telegram.sendMessage(chatId, messageText, {
    parse_mode: 'HTML',
    disable_web_page_preview: item.type === 'joke',
  });
}

// Called from message handler to track activity
export function onGroupMessage(chatId: number): void {
  registerChat(chatId);
}
