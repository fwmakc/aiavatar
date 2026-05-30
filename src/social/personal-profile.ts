import { buildSystemPrompt } from '@/config/persona';
import { askAI } from '@/ai/client';
import { relationships } from '@/relationship/manager';
import { userProfileManager } from './user-profile';
import { privateContextManager } from '@/private-context';
import { relationshipGraph } from './relationship-graph';

export async function generatePersonalProfile(userId: number): Promise<string> {
  const rel = relationships.get(userId, userId); // ЛС чат = userId
  const profile = userProfileManager.getProfile(userId);
  const lsHistory = privateContextManager.getContext(userId);
  const graphEdges = relationshipGraph.getAllEdges(userId);

  // Топ тем
  const topics = profile
    ? Array.from(profile.topics.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  // Топ триггеров (по агрессивным сообщениям)
  const triggers = profile?.triggers?.length ? profile.triggers.slice(0, 5) : ['нет данных'];

  // Топ эмодзи
  const emojis = profile
    ? Array.from(profile.emojiTop.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  const prompt = `Ты — проницательный психолог и друг. Составь для человека его психологический портрет на основе данных. Будь честен, но мягок. Используй "ты". Не более 10 предложений.

Данные:
- Лояльность к боту: ${rel.score}/5 (${rel.score > 0 ? 'дружелюбен' : rel.score < 0 ? 'насторожен' : 'нейтрален'})
- Сообщений проанализировано: ${profile?.messageCount || 0}
- Средняя длина сообщения: ${profile?.avgMessageLength.toFixed(0) || '???'} символов
- Уровень агрессии: ${profile ? (profile.aggressionRate * 100).toFixed(0) : '???'}%
- Топ тем: ${topics.map(t => t[0]).join(', ') || 'нет данных'}
- Частые триггеры: ${triggers.join(', ')}
- Любимые эмодзи: ${emojis.map(e => e[0]).join(' ') || 'нет данных'}
- Связи в группах: ${graphEdges.length} человек
${graphEdges.filter(e => e.weight < -3).length > 0 ? `- Конфликты с: ${graphEdges.filter(e => e.weight < -3).map(e => e.targetUserId).join(', ')}` : '- Конфликтов не выявлено'}

История ЛС (последние 10 сообщений):
${lsHistory || '(мало данных)'}

Составь портрет. Можно с юмором, но без жести.`;

  try {
    return await askAI(prompt, buildSystemPrompt());
  } catch {
    return 'Пока недостаточно данных для портрета. Поболтай со мной побольше! 🙂';
  }
}

export function getReconciliationOpening(userId: number): string | null {
  const score = relationships.get(userId, userId).score;
  if (score >= -1) return null; // Нет необходимости

  const openings: Record<number, string> = {
    [-5]: 'Слушай, честно? Ты мне сильно надоел. Но я готов поговорить, если ты готов выслушать.',
    [-4]: 'Между нами не ладится. Но я не хочу держать зло — можем обсудить?',
    [-3]: 'Ты меня расстроил в последнее время. Но давай попробуем наладить контакт.',
    [-2]: 'У нас с тобой какая-то напряжённость. Давай разберёмся?',
  };

  return openings[score] || openings[-2];
}

export async function processReconciliation(userId: number, userText: string): Promise<string> {
  const score = relationships.get(userId, userId).score;

  const prompt = `Ты — ИИ-аватар. Пользователь хочет помириться/наладить отношения.
Текущий score: ${score}/5 (отрицательный = обида).
Пользователь написал: "${userText}"

Ответь естественно. Если он искренен — прими извинения/попытку. Если он троллит — холодно отвергни.
Не меняй score здесь, просто ответь. 1-3 предложения.`;

  try {
    return await askAI(prompt, buildSystemPrompt());
  } catch {
    return 'Посмотрим...';
  }
}
