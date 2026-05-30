import { db } from '@/db';
import type { PrivateMessage } from '@/types';

const stmtInsert = db.prepare(
  'INSERT INTO private_context (user_id, role, content, timestamp) VALUES (?, ?, ?, ?)'
);

const stmtSelect = db.prepare('SELECT role, content FROM private_context WHERE user_id = ? ORDER BY timestamp ASC');

const stmtTrim = db.prepare(
  `DELETE FROM private_context WHERE user_id = ? AND id NOT IN (
    SELECT id FROM private_context WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?
  )`
);

const stmtCount = db.prepare('SELECT COUNT(*) as cnt FROM private_context WHERE user_id = ?');

const MAX_MESSAGES = 10;

export function addPrivateMessage(userId: number, text: string, isBot = false): void {
  stmtInsert.run(userId, isBot ? 'Assistant' : 'User', text, Date.now());
  // Trim to keep only last MAX_MESSAGES
  const countRow = stmtCount.get(userId) as { cnt: number } | undefined;
  if (countRow && countRow.cnt > MAX_MESSAGES) {
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
