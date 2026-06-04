import { callAI } from '@/ai/client';
import type { AIMessage } from '@/ai/client';

export type Priority = 'critical' | 'normal' | 'low';

const PRIORITY_ORDER: Record<Priority, number> = {
  critical: 0,
  normal: 1,
  low: 2,
};

interface QueueItem {
  messages: AIMessage[];
  system: string;
  maxTokens?: number;
  priority: Priority;
  resolve: (value: string) => void;
  reject: (reason: unknown) => void;
}

const queue: QueueItem[] = [];
let activeCount = 0;
let maxConcurrency = 2;

export function setMaxConcurrency(n: number): void {
  maxConcurrency = Math.max(1, n);
}

export function enqueueAI(
  messages: AIMessage[],
  system: string,
  priority: Priority,
  maxTokens?: number
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    queue.push({ messages, system, maxTokens, priority, resolve, reject });
    queue.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
    processQueue();
  });
}

function processQueue(): void {
  while (activeCount < maxConcurrency && queue.length > 0) {
    const item = queue.shift()!;
    activeCount++;
    executeWithRetry(item).finally(() => {
      activeCount--;
      processQueue();
    });
  }
}

const MAX_RETRIES = 3;
const BASE_DELAY_MS = 2000;

function isRateLimitError(e: unknown): boolean {
  if (e instanceof Error) {
    return e.message.includes('429') || e.message.includes('rate');
  }
  return false;
}

async function executeWithRetry(item: QueueItem): Promise<void> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await callAI(item.messages, item.system, item.maxTokens);
      item.resolve(result);
      return;
    } catch (e) {
      lastError = e;

      if (isRateLimitError(e) && attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt);
        console.warn(`[AI Queue] Rate limited, retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`);
        await new Promise(r => setTimeout(r, delay));
        continue;
      }

      break;
    }
  }

  item.reject(lastError);
}

export function getQueueStats(): { pending: number; active: number; maxConcurrency: number } {
  return { pending: queue.length, active: activeCount, maxConcurrency };
}
