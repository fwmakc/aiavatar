import { bot } from '@/telegram/bot';
import { config } from '@/config/env';
import { generateContent } from '@/content/engine';
import { isActiveTime } from '@/schedule/checker';
import { getChatPersonaConfig } from '@/config/persona';
import {
  getChatState,
  getAllChatIds,
  registerChat,
  recordContentPost,
  recordBotActivity,
  recordPostedContent,
} from '@/content/store/state';
import type { ContentItem } from '@/content/types';

const DEFAULT_IDLE_THRESHOLD_MIN = 60;
const DEFAULT_MIN_INTERVAL_MIN = 120;

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

  if (shortestIdle < 10 * 60 * 1000) {
    return CHECK_5_MIN;
  }
  if (shortestIdle < 30 * 60 * 1000) {
    return CHECK_10_MIN;
  }
  if (shortestIdle < 60 * 60 * 1000) {
    return CHECK_30_MIN;
  }
  return CHECK_60_MIN;
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
  const cfg = getChatPersonaConfig(chatId);
  const idleThreshold = (cfg.schedule?.idleThresholdMin ?? DEFAULT_IDLE_THRESHOLD_MIN) * 60 * 1000;
  const minInterval = (cfg.schedule?.minIntervalMin ?? DEFAULT_MIN_INTERVAL_MIN) * 60 * 1000;

  const state = getChatState(chatId);
  const now = Date.now();

  if (state.lastContentPostTime > 0 && now - state.lastContentPostTime < minInterval) {
    const minsLeft = Math.ceil((minInterval - (now - state.lastContentPostTime)) / 60000);
    console.log(`[ContentEngine] chat ${chatId}: recently posted, wait ${minsLeft} min`);
    return false;
  }

  const idleMin = Math.round((now - state.lastMessageTime) / 60000);
  const isIdle = now - state.lastMessageTime >= idleThreshold;

  if (isIdle) {
    console.log(`[ContentEngine] chat ${chatId}: idle ${idleMin} min, can post`);
    return true;
  }

  console.log(`[ContentEngine] chat ${chatId}: activity ${idleMin} min ago, staying quiet`);
  return false;
}

async function checkAllChats(): Promise<void> {
  const chatIds = getAllChatIds();
  if (chatIds.length === 0) return;

  for (const chatId of chatIds) {
    if (!isActiveTime(chatId)) {
      console.log(`[ContentEngine] chat ${chatId}: outside active hours, skipping`);
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
      console.log(`[ContentEngine] chat ${chatId}: posted ${item.type}`);
    } catch (e) {
      console.error(`[ContentEngine] Failed to post to chat ${chatId}:`, e);
    }
  }
}

const INTROS: Record<string, string[]> = {
  feed: [
    'Вот кое-что интересное:',
    'Смотрите, нашёл:',
    'Поделюсь с вами:',
    'Наткнулся на это:',
    'Зацените:',
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
  });
}

export function onGroupMessage(chatId: number): void {
  registerChat(chatId);
}
