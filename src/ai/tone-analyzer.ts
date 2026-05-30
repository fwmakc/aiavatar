import { callSimpleAI } from '@/ai/client';
import type { GroupMessage, PrivateMessage } from '@/types';

export async function analyzeTone(
  messages: Array<Pick<GroupMessage, 'text'> | PrivateMessage>
): Promise<string> {
  if (!messages || messages.length === 0) return 'нейтральный';
  const text = messages.map(m => m.text).join('\n');
  const prompt = `Определи эмоциональный тон сообщений. Ответь ТОЛЬКО одним словом из списка: агрессивный, весёлый, формальный, льстивый, грустный, саркастичный, нейтральный, возбуждённый, обиженный, оскорбительный.\n\nСообщения:\n${text}`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 5);
    return answer.trim().toLowerCase() || 'нейтральный';
  } catch {
    return 'нейтральный';
  }
}

export async function analyzeAttitudeTowardsBot(messageText: string): Promise<string> {
  const prompt = `Определи, какое отношение к тебе (к собеседнику, боту) выражено в этом сообщении.\n\nВажно: если автор ругается на код, погоду, жизнь, работу, политику — это НЕ агрессия в твой адрес. Оценивай только отношение конкретно к тебе.\n\nОтветь ТОЛЬКО одним словом из списка: дружелюбное, агрессивное, нейтральное, льстивое, оскорбительное, ироничное, холодное.\n\nСообщение: "${messageText}"`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 5);
    return answer.trim().toLowerCase() || 'нейтральное';
  } catch {
    return 'нейтральное';
  }
}
