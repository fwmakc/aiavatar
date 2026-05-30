import { config } from '@/config/env';
import { groupContextManager } from '@/group/context';
import { privateContextManager } from '@/private-context';
import { buildSystemPrompt } from '@/config/persona';

export async function shouldAnswerGroup(chatId: number | string): Promise<boolean> {
  const context = groupContextManager.formatContext(chatId);
  if (!context.trim()) return false;

  const screeningPrompt = `Ты — ИИ-аватар в групповом чате. Вот последние сообщения:\n\n${context}\n\nСтоит ли тебе что-то ответить в этот разговор? Ответь ТОЛЬКО одно слово: ДА или НЕТ.`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: screeningPrompt }],
    }),
  });

  if (!res.ok) {
    console.log(`[Screening] chat ${chatId}: AI error ${res.status} → skip`);
    return false;
  }
  const data = await res.json();
  const answer = data.content?.[0]?.text?.trim().toUpperCase() || '';
  const should = answer.includes('ДА');
  console.log(`[Screening] chat ${chatId}: ${should ? 'ИНТЕРЕСНО' : 'неинтересно'} (AI: ${answer})`);
  return should;
}

export async function guardCheck(
  chatId: number | string,
  chatTitle: string | undefined,
  userQuery: string
): Promise<boolean> {
  const context = groupContextManager.formatTruncated(chatId);
  const guardPrompt = `Ты — gatekeeper чата "${chatTitle || 'Без названия'}".

Последние сообщения в чате:
${context || '(нет истории)'}

Новый запрос: "${userQuery}"

Отвечает ли этот запрос теме чата и контексту обсуждения? Ответь ТОЛЬКО одно слово: ДА или НЕТ.`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: guardPrompt }],
    }),
  });

  if (!res.ok) return true;
  const data = await res.json();
  const answer = data.content?.[0]?.text?.trim().toUpperCase() || '';
  return answer.includes('ДА');
}

export async function guardCheckPrivate(userId: number, userQuery: string): Promise<boolean> {
  const context = privateContextManager.getContext(userId);
  const systemPrompt = buildSystemPrompt();
  const guardPrompt = context
    ? `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}"\n\nИстория диалога:\n${context}\n\nНовый запрос: "${userQuery}"\n\nЭтот запрос уместен для твоей роли? Ответь ТОЛЬКО: ДА или НЕТ.`
    : `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}"\n\nЗапрос: "${userQuery}"\n\nЭтот запрос уместен для твоей роли? Ответь ТОЛЬКО: ДА или НЕТ.`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: guardPrompt }],
    }),
  });

  if (!res.ok) return true;
  const data = await res.json();
  const answer = data.content?.[0]?.text?.trim().toUpperCase() || '';
  return answer.includes('ДА');
}

export async function topicGuard(userQuery: string): Promise<boolean> {
  const prompt = `Ты — фильтр тематики. Определи, относится ли запрос к IT, программированию, технологиям, инженерии, софту, железу, кибербезопасности, data science или работе в этих сферах.

Запрос: "${userQuery}"

Ответь ТОЛЬКО одно слово: ДА или НЕТ.`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 10,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return true;
  const data = await res.json();
  const answer = data.content?.[0]?.text?.trim().toUpperCase() || '';
  return answer.includes('ДА');
}

export async function generateDenial(userQuery: string, reason: 'role' | 'topic' = 'role'): Promise<string> {
  const reasonText = reason === 'topic'
    ? 'Этот запрос не про IT и технологии. Ты в IT-сфере и не разбираешься в этом.'
    : 'Этот запрос совершенно не подходит под твою роль.';

  const systemPrompt = buildSystemPrompt();
  const denialPrompt = `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}

Пользователь задал запрос: "${userQuery}"

${reasonText} Вежливо (или саркастично — в зависимости от характера) откажись отвечать. Не объясняй, почему. Просто один короткий ответ (1-2 предложения), в своём стиле.`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 150,
      messages: [{ role: 'user', content: denialPrompt }],
    }),
  });

  if (!res.ok) return 'Не-а, это не для меня.';
  const data = await res.json();
  return data.content?.[0]?.text?.trim() || 'Не-а, это не для меня.';
}
