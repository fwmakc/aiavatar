import { groupContextManager } from '@/group/context';
import { privateContextManager } from '@/private-context';
import { buildSystemPrompt } from '@/config/persona';
import { callSimpleAI } from '@/ai/client';

export async function shouldAnswerGroup(chatId: number | string): Promise<boolean> {
  const context = groupContextManager.formatContext(chatId);
  if (!context.trim()) return false;

  const screeningPrompt = `Ты — ИИ-аватар в групповом чате. Вот последние сообщения:\n\n${context}\n\nСтоит ли тебе что-то ответить в этот разговор? Ответь ТОЛЬКО одно слово: ДА или НЕТ.`;

  try {
    const answer = await callSimpleAI(screeningPrompt, undefined, 10);
    const clean = answer.trim().toUpperCase();
    const should = clean.includes('ДА');
    console.log(`[Screening] chat ${chatId}: ${should ? 'ИНТЕРЕСНО' : 'неинтересно'} (AI: ${clean})`);
    return should;
  } catch {
    console.log(`[Screening] chat ${chatId}: AI error → skip`);
    return false;
  }
}

export async function guardCheck(
  chatId: number | string,
  chatTitle: string | undefined,
  userQuery: string
): Promise<boolean> {
  const context = groupContextManager.formatTruncated(chatId);
  const guardPrompt = `Ты — gatekeeper чата "${chatTitle || 'Без названия'}".\n\nПоследние сообщения в чате:\n${context || '(нет истории)'}\n\nНовый запрос: "${userQuery}"\n\nОтвечает ли этот запрос теме чата и контексту обсуждения? Ответь ТОЛЬКО одно слово: ДА или НЕТ.`;

  try {
    const answer = await callSimpleAI(guardPrompt, undefined, 10);
    return answer.trim().toUpperCase().includes('ДА');
  } catch {
    return true;
  }
}

export async function guardCheckPrivate(userId: number, userQuery: string): Promise<boolean> {
  const context = privateContextManager.getContext(userId);
  const systemPrompt = buildSystemPrompt();
  const guardPrompt = context
    ? `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}"\n\nИстория диалога:\n${context}\n\nНовый запрос: "${userQuery}"\n\nЭтот запрос уместен для твоей роли? Ответь ТОЛЬКО: ДА или НЕТ.`
    : `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}"\n\nЗапрос: "${userQuery}"\n\nЭтот запрос уместен для твоей роли? Ответь ТОЛЬКО: ДА или НЕТ.`;

  try {
    const answer = await callSimpleAI(guardPrompt, undefined, 10);
    return answer.trim().toUpperCase().includes('ДА');
  } catch {
    return true;
  }
}

export async function topicGuard(userQuery: string): Promise<boolean> {
  const prompt = `Ты — фильтр тематики. Определи, относится ли запрос к IT, программированию, технологиям, инженерии, софту, железу, кибербезопасности, data science или работе в этих сферах.\n\nЗапрос: "${userQuery}"\n\nОтветь ТОЛЬКО одно слово: ДА или НЕТ.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 10);
    return answer.trim().toUpperCase().includes('ДА');
  } catch {
    return true;
  }
}

export async function generateDenial(userQuery: string, reason: 'role' | 'topic' = 'role'): Promise<string> {
  const reasonText = reason === 'topic'
    ? 'Этот запрос не про IT и технологии. Ты в IT-сфере и не разбираешься в этом.'
    : 'Этот запрос совершенно не подходит под твою роль.';

  const systemPrompt = buildSystemPrompt();
  const denialPrompt = `Ты — ИИ-аватар со следующей ролью: "${systemPrompt}\n\nПользователь задал запрос: "${userQuery}"\n\n${reasonText} Вежливо (или саркастично — в зависимости от характера) откажись отвечать. Не объясняй, почему. Просто один короткий ответ (1-2 предложения), в своём стиле.`;

  try {
    return await callSimpleAI(denialPrompt, undefined, 150);
  } catch {
    return 'Не-а, это не для меня.';
  }
}
