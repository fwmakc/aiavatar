import { db } from '@/db';
import { getPersonaStages } from '@/config/persona';
import type { RelationshipRecord, RelationshipHistoryEntry } from '@/types';

function scoreToStage(score: number): 'hostile' | 'cold' | 'neutral' | 'warm' | 'intimate' {
  if (score <= -4) return 'hostile';
  if (score <= -2) return 'cold';
  if (score <= 1) return 'neutral';
  if (score <= 3) return 'warm';
  return 'intimate';
}

const stmtGet = db.prepare('SELECT score, history FROM relationships WHERE chat_id = ? AND user_id = ?');

const stmtUpsert = db.prepare(
  `INSERT INTO relationships (chat_id, user_id, score, history, updated_at)
   VALUES (?, ?, ?, ?, unixepoch())
   ON CONFLICT(chat_id, user_id) DO UPDATE SET
     score = excluded.score,
     history = excluded.history,
     updated_at = excluded.updated_at`
);

function getRecord(chatId: number | string, userId: number): RelationshipRecord {
  const row = stmtGet.get(String(chatId), userId) as { score: number; history: string } | undefined;
  if (!row) return { score: 0, history: [] };
  try {
    const history = JSON.parse(row.history) as RelationshipHistoryEntry[];
    return { score: row.score, history };
  } catch {
    return { score: row.score, history: [] };
  }
}

export function getRelationship(chatId: number | string, userId: number): RelationshipRecord {
  return getRecord(chatId, userId);
}

export function addRelationshipScore(
  chatId: number | string,
  userId: number,
  delta: number,
  reason = ''
): number {
  const current = getRecord(chatId, userId);
  const oldScore = current.score;
  current.score = Math.max(-5, Math.min(5, current.score + delta));
  current.history.push({ time: Date.now(), delta, reason, score: current.score });
  if (current.history.length > 20) current.history.shift();

  stmtUpsert.run(String(chatId), userId, current.score, JSON.stringify(current.history));
  console.log(`Relationship [${chatId}:${userId}]: ${oldScore} -> ${current.score} (${reason})`);
  return current.score;
}

export function getRelationshipPromptAddon(chatId: number | string, userId: number): string {
  const { score } = getRecord(chatId, userId);
  const stageKey = scoreToStage(score);
  const stages = getPersonaStages(chatId, userId);
  const stage = stages?.[stageKey];
  if (!stage) {
    switch (stageKey) {
      case 'intimate': return 'Пользователь — твой близкий друг. Можешь быть максимально неформальным, использовать сленг, мемы, подкалывать. Вы на короткой ноге.';
      case 'warm': return 'Пользователь — хороший знакомый. Общайся тепло, на "ты", можешь шутить и слегка поддразнивать.';
      case 'neutral': return 'Пользователь — нейтральный собеседник. Общайся вежливо, без лишней эмоциональности.';
      case 'cold': return 'Пользователь тебе не особо симпатичен. Ты сдержан, слегка саркастичен, можешь осторожно подколоть, но не переходи на грубость.';
      case 'hostile': return 'Пользователь тебе крайне неприятен. Ты максимально саркастичен, едко подкалываешь, стебёшь, но прямых оскорблений избегай.';
    }
  }
  const parts: string[] = [];
  if (stage.style) parts.push(stage.style);
  if (stage.restrictions) parts.push(stage.restrictions);
  if (stage.interests) parts.push(stage.interests);
  return parts.join(' ') || '';
}

// Backward-compatible singleton wrapper
class RelationshipManager {
  get(chatId: number | string, userId: number): RelationshipRecord {
    return getRecord(chatId, userId);
  }

  addScore(chatId: number | string, userId: number, delta: number, reason = ''): number {
    return addRelationshipScore(chatId, userId, delta, reason);
  }

  getPromptAddon(chatId: number | string, userId: number): string {
    return getRelationshipPromptAddon(chatId, userId);
  }
}

export const relationships = new RelationshipManager();
