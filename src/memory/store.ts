import { db } from '@/db';

export interface BufferedMessage {
  id: number;
  chat_id: number;
  author: string;
  content: string;
  timestamp: number;
}

export interface ChatMemory {
  id: number;
  chat_id: number;
  tier: 'day' | 'short' | 'week' | 'month';
  summary: string;
  period_start: number;
  period_end: number;
  msg_count: number;
  created_at: number;
  updated_at: number;
}

const stmtBufferInsert = db.prepare(
  'INSERT INTO memory_buffer (chat_id, author, content, timestamp) VALUES (?, ?, ?, ?)'
);

const stmtBufferSelect = db.prepare(
  'SELECT id, chat_id, author, content, timestamp FROM memory_buffer WHERE chat_id = ? ORDER BY timestamp ASC'
);

const stmtBufferDelete = db.prepare(
  'DELETE FROM memory_buffer WHERE chat_id = ? AND id <= ?'
);

const stmtBufferChats = db.prepare(
  'SELECT DISTINCT chat_id FROM memory_buffer'
);

const stmtMemorySelect = db.prepare(
  'SELECT id, chat_id, tier, summary, period_start, period_end, msg_count, created_at, updated_at FROM chat_memories WHERE chat_id = ? AND tier = ?'
);

const stmtMemoryInsert = db.prepare(
  `INSERT INTO chat_memories (chat_id, tier, summary, period_start, period_end, msg_count, created_at, updated_at)
   VALUES (?, ?, ?, ?, ?, ?, unixepoch(), unixepoch())`
);

const stmtMemoryUpdate = db.prepare(
  `UPDATE chat_memories SET summary = ?, period_start = ?, period_end = ?, msg_count = ?, updated_at = unixepoch() WHERE id = ?`
);

const stmtMemoryDelete = db.prepare(
  'DELETE FROM chat_memories WHERE id = ?'
);

const stmtMemoryOldTier = db.prepare(
  'SELECT id, chat_id, tier, summary, period_start, period_end, msg_count, created_at, updated_at FROM chat_memories WHERE tier = ? AND updated_at < ?'
);

const stmtMemoryMonthExpired = db.prepare(
  "DELETE FROM chat_memories WHERE tier = 'month' AND updated_at < unixepoch() - 30 * 86400"
);

export function bufferMessage(chatId: number, author: string, content: string, timestamp?: number): void {
  stmtBufferInsert.run(chatId, author, content, timestamp ?? Math.floor(Date.now() / 1000));
}

export function getBufferedMessages(chatId: number): BufferedMessage[] {
  return stmtBufferSelect.all(chatId) as BufferedMessage[];
}

export function deleteBufferedMessages(chatId: number, upToId: number): void {
  stmtBufferDelete.run(chatId, upToId);
}

export function getBufferedChatIds(): number[] {
  return (stmtBufferChats.all() as { chat_id: number }[]).map(r => r.chat_id);
}

export function getMemory(chatId: number, tier: ChatMemory['tier']): ChatMemory | undefined {
  return stmtMemorySelect.get(chatId, tier) as ChatMemory | undefined;
}

export function saveMemory(
  chatId: number,
  tier: ChatMemory['tier'],
  summary: string,
  periodStart: number,
  periodEnd: number,
  msgCount: number
): void {
  const existing = getMemory(chatId, tier);
  if (existing) {
    stmtMemoryUpdate.run(summary, periodStart, periodEnd, msgCount, existing.id);
  } else {
    stmtMemoryInsert.run(chatId, tier, summary, periodStart, periodEnd, msgCount);
  }
}

export function getMemoriesOlderThan(tier: ChatMemory['tier'], maxUpdated: number): ChatMemory[] {
  return stmtMemoryOldTier.all(tier, maxUpdated) as ChatMemory[];
}

export function deleteMemory(id: number): void {
  stmtMemoryDelete.run(id);
}

export function deleteExpiredMonthMemories(): number {
  const result = stmtMemoryMonthExpired.run();
  return result.changes;
}

export function getAllMemories(chatId: number): ChatMemory[] {
  const tiers: ChatMemory['tier'][] = ['month', 'week', 'short', 'day'];
  const result: ChatMemory[] = [];
  for (const tier of tiers) {
    const m = getMemory(chatId, tier);
    if (m) result.push(m);
  }
  return result;
}
