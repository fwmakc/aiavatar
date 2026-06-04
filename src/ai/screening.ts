import { groupContextManager } from '@/group/context';
import { privateContextManager } from '@/private-context';
import { buildSystemPrompt } from '@/config/persona';
import { callSimpleAI } from '@/ai/client';

export async function shouldAnswerGroup(chatId: number | string): Promise<boolean> {
  const context = groupContextManager.formatContext(chatId);
  if (!context.trim()) return false;

  const screeningPrompt = `You are an AI avatar in a group chat. Here are the latest messages:\n\n${context}\n\nShould you say something in this conversation? Answer with ONLY one word: YES or NO. Always respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(screeningPrompt, undefined, 10);
    const clean = answer.trim().toUpperCase();
    const should = clean.includes('YES') || clean.includes('ДА');
    console.log(`[Screening] chat ${chatId}: ${should ? 'INTERESTING' : 'skip'} (AI: ${clean})`);
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
  const guardPrompt = `You are the gatekeeper of the chat "${chatTitle || 'Untitled'}".\n\nRecent messages in the chat:\n${context || '(no history)'}\n\nNew query: "${userQuery}"\n\nDoes this query fit the chat topic and discussion context? Answer with ONLY one word: YES or NO. Always respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(guardPrompt, undefined, 10);
    const clean = answer.trim().toUpperCase();
    return clean.includes('YES') || clean.includes('ДА');
  } catch {
    return true;
  }
}

export async function guardCheckPrivate(userId: number, userQuery: string): Promise<boolean> {
  const context = privateContextManager.getContext(userId);
  const systemPrompt = buildSystemPrompt();
  const guardPrompt = context
    ? `You are an AI avatar with the following role: "${systemPrompt}"\n\nDialog history:\n${context}\n\nNew query: "${userQuery}"\n\nIs this query appropriate for your role? Answer with ONLY: YES or NO. Always respond in English for this specific question.`
    : `You are an AI avatar with the following role: "${systemPrompt}"\n\nQuery: "${userQuery}"\n\nIs this query appropriate for your role? Answer with ONLY: YES or NO. Always respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(guardPrompt, undefined, 10);
    const clean = answer.trim().toUpperCase();
    return clean.includes('YES') || clean.includes('ДА');
  } catch {
    return true;
  }
}

export async function topicGuard(userQuery: string): Promise<boolean> {
  const systemPrompt = buildSystemPrompt();
  const prompt = `You are a topic filter. Your role: "${systemPrompt}"\n\nDetermine whether the following query is related to your area of expertise.\n\nQuery: "${userQuery}"\n\nAnswer with ONLY one word: YES or NO. Always respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 10);
    const clean = answer.trim().toUpperCase();
    return clean.includes('YES') || clean.includes('ДА');
  } catch {
    return true;
  }
}

export async function generateDenial(userQuery: string, reason: 'role' | 'topic' = 'role'): Promise<string> {
  const reasonText = reason === 'topic'
    ? 'This query is outside your area of expertise.'
    : 'This query does not fit your role at all.';

  const systemPrompt = buildSystemPrompt();
  const denialPrompt = `You are an AI avatar with the following role: "${systemPrompt}\n\nThe user made a query: "${userQuery}"\n\n${reasonText} Politely (or sarcastically — depending on your character) refuse to answer. Do not explain why. Just one short response (1-2 sentences), in your style. Respond in the language specified in your role.`;

  try {
    return await callSimpleAI(denialPrompt, undefined, 150);
  } catch {
    return 'Nope, not for me.';
  }
}
