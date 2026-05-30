import { config } from '@/config/env';

interface ReplyWindow {
  count: number;
  windowStart: number;
}

const windows = new Map<number | string, ReplyWindow>();
const SLEEP_DURATION_MS = 60 * 60 * 1000; // 1 hour sleep after limit

export function canReplyInGroup(chatId: number | string): { allowed: boolean; remaining: number; sleeping: boolean } {
  const limit = config.groupReplyLimitPerHour;
  const now = Date.now();

  const win = windows.get(chatId);

  // No window yet — fresh start
  if (!win) {
    return { allowed: true, remaining: limit - 1, sleeping: false };
  }

  // If we're past the sleep window, reset
  if (now - win.windowStart >= SLEEP_DURATION_MS) {
    windows.set(chatId, { count: 0, windowStart: now });
    return { allowed: true, remaining: limit - 1, sleeping: false };
  }

  // Within the hour window
  if (win.count >= limit) {
    const minsLeft = Math.ceil((SLEEP_DURATION_MS - (now - win.windowStart)) / 60000);
    console.log(`[RateLimit] chat ${chatId}: спит ещё ${minsLeft} мин (${win.count}/${limit} ответов за час)`);
    return { allowed: false, remaining: 0, sleeping: true };
  }

  return { allowed: true, remaining: limit - win.count - 1, sleeping: false };
}

export function recordGroupReply(chatId: number | string): void {
  const now = Date.now();
  const limit = config.groupReplyLimitPerHour;
  const win = windows.get(chatId);

  if (!win || now - win.windowStart >= 60 * 60 * 1000) {
    windows.set(chatId, { count: 1, windowStart: now });
    console.log(`[RateLimit] chat ${chatId}: ответ 1/${limit}`);
  } else {
    win.count++;
    if (win.count >= limit) {
      console.log(`[RateLimit] chat ${chatId}: лимит исчерпан (${win.count}/${limit}), ухожу спать на 60 мин`);
    } else {
      console.log(`[RateLimit] chat ${chatId}: ответ ${win.count}/${limit}`);
    }
  }
}

// Test helper
export function resetRateLimiter(): void {
  windows.clear();
}
