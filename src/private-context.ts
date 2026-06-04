import { db } from '@/db';
import type { PrivateMessage } from '@/types';
import { bufferMessage } from '@/memory/store';

const stmtInsert = db.prepare(
  'INSERT INTO private_context (user_id, role, content, timestamp) VALUES (?, ?, ?, ?)'
);

const stmtSelect = db.prepare('SELECT role, content FROM private_context WHERE user_id = ? ORDER BY timestamp ASC');

const stmtSelectTrimmed = db.prepare(
  `SELECT role, content, timestamp FROM private_context WHERE user_id = ? ORDER BY timestamp DESC LIMIT -1 OFFSET ?`
);

const stmtTrim = db.prepare(
  `DELETE FROM private_context WHERE user_id = ? AND id NOT IN (
    SELECT id FROM private_context WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?
  )`
);

const stmtCount = db.prepare('SELECT COUNT(*) as cnt FROM private_context WHERE user_id = ?');

const MAX_MESSAGES = 10;

export function addPrivateMessage(userId: number, text: string, isBot = false): void {
  stmtInsert.run(userId, isBot ? 'Assistant' : 'User', text, Date.now());
  const countRow = stmtCount.get(userId) as { cnt: number } | undefined;
  if (countRow && countRow.cnt > MAX_MESSAGES) {
    const trimmed = stmtSelectTrimmed.all(userId, MAX_MESSAGES) as { role: string; content: string; timestamp: number }[];
    for (const m of trimmed) {
      const author = m.role === 'Assistant' ? 'Bot' : 'User';
      bufferMessage(userId, author, m.content, Math.floor(m.timestamp / 1000));
    }
    stmtTrim.run(userId, userId, MAX_MESSAGES);
  }
}

export function getPrivateContext(userId: number): string {
  const rows = stmtSelect.all(userId) as { role: string; content: string }[];
  if (!rows.length) return '';
  return rows.map(m => `${m.role}: ${m.content}`).join('\n');
}

export function getPrivateMessages(userId: number): PrivateMessage[] {
  return (stmtSelect.all(userId) as { role: string; content: string }[]).map(m => ({
    role: m.role as 'User' | 'Assistant',
    text: m.content,
  }));
}

// Backward-compatible singleton wrapper
class PrivateContextManager {
  addMessage(userId: number, text: string, isBot = false): void {
    addPrivateMessage(userId, text, isBot);
  }

  getContext(userId: number): string {
    return getPrivateContext(userId);
  }

  getMessages(userId: number): PrivateMessage[] {
    return getPrivateMessages(userId);
  }
}

export const privateContextManager = new PrivateContextManager();
