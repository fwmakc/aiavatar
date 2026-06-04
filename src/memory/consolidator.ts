import {
  getBufferedChatIds,
  getBufferedMessages,
  deleteBufferedMessages,
  getMemory,
  saveMemory,
  getMemoriesOlderThan,
  deleteMemory,
  deleteExpiredMonthMemories,
} from '@/memory/store';
import { summarizeBuffer, consolidateTiers } from '@/memory/summarizer';
import type { ChatMemory } from '@/memory/store';

const HOUR = 3600;
const DAY = 86400;

const TIER_AGES: { tier: ChatMemory['tier']; maxAge: number; target: ChatMemory['tier'] }[] = [
  { tier: 'day', maxAge: DAY, target: 'short' },
  { tier: 'short', maxAge: 3 * DAY, target: 'week' },
  { tier: 'week', maxAge: 7 * DAY, target: 'month' },
];

export async function runMemoryConsolidation(): Promise<void> {
  const now = Math.floor(Date.now() / 1000);

  await consolidateBufferToDay(now);
  await consolidateTiersUp(now);
  const expired = deleteExpiredMonthMemories();
  if (expired > 0) {
    console.log(`[Memory] Deleted ${expired} expired month memories`);
  }
}

async function consolidateBufferToDay(now: number): Promise<void> {
  const chatIds = getBufferedChatIds();
  if (chatIds.length === 0) return;

  console.log(`[Memory] Consolidating buffer for ${chatIds.length} chats`);

  for (const chatId of chatIds) {
    const messages = getBufferedMessages(chatId);
    if (messages.length === 0) continue;

    const existing = getMemory(chatId, 'day');
    const existingSummary = existing?.summary || null;

    const summary = await summarizeBuffer(messages, existingSummary);
    if (!summary) continue;

    const earliestTs = existing?.period_start ?? messages[0].timestamp;
    const latestTs = now;
    const totalMsgs = (existing?.msg_count ?? 0) + messages.length;

    saveMemory(chatId, 'day', summary, earliestTs, latestTs, totalMsgs);
    deleteBufferedMessages(chatId, messages[messages.length - 1].id);

    console.log(`[Memory] chat ${chatId}: buffered ${messages.length} msgs → day memory`);
  }
}

async function consolidateTiersUp(now: number): Promise<void> {
  for (const { tier, maxAge, target } of TIER_AGES) {
    const cutoff = now - maxAge;
    const oldMemories = getMemoriesOlderThan(tier, cutoff);
    if (oldMemories.length === 0) continue;

    const byChat = new Map<number, typeof oldMemories>();
    for (const m of oldMemories) {
      if (!byChat.has(m.chat_id)) byChat.set(m.chat_id, []);
      byChat.get(m.chat_id)!.push(m);
    }

    for (const [chatId, memories] of byChat) {
      const existingTarget = getMemory(chatId, target);

      const merged = await consolidateTiers(
        existingTarget ? [...memories, existingTarget] : memories,
        target
      );

      if (!merged) continue;

      const earliest = Math.min(...memories.map(m => m.period_start), existingTarget?.period_start ?? Infinity);
      const latest = Math.max(...memories.map(m => m.period_end), existingTarget?.period_end ?? 0);
      const totalMsgs = memories.reduce((s, m) => s + m.msg_count, 0) + (existingTarget?.msg_count ?? 0);

      saveMemory(chatId, target, merged, earliest, latest, totalMsgs);

      for (const m of memories) {
        deleteMemory(m.id);
      }

      console.log(`[Memory] chat ${chatId}: ${memories.length} ${tier} → ${target}`);
    }
  }
}
