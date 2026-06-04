import { callSimpleAI } from '@/ai/client';
import type { GroupMessage, PrivateMessage } from '@/types';

export async function analyzeTone(
  messages: Array<Pick<GroupMessage, 'text'> | PrivateMessage>
): Promise<string> {
  if (!messages || messages.length === 0) return 'neutral';
  const text = messages.map(m => m.text).join('\n');
  const prompt = `Determine the emotional tone of the messages. Answer with ONLY one word from this list: aggressive, cheerful, formal, flattering, sad, sarcastic, neutral, excited, offended, insulting.\n\nMessages:\n${text}\n\nAlways respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 5);
    return answer.trim().toLowerCase() || 'neutral';
  } catch {
    return 'neutral';
  }
}

export async function analyzeAttitudeTowardsBot(messageText: string): Promise<string> {
  const prompt = `Determine what attitude towards you (the interlocutor, the bot) is expressed in this message.\n\nImportant: if the author is cursing about code, weather, life, work, politics — this is NOT aggression towards you. Evaluate only the attitude specifically towards you.\n\nAnswer with ONLY one word from this list: friendly, aggressive, neutral, flattering, insulting, ironic, cold.\n\nMessage: "${messageText}"\n\nAlways respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 5);
    return answer.trim().toLowerCase() || 'neutral';
  } catch {
    return 'neutral';
  }
}
