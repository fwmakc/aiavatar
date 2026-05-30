import { config } from '@/config/env';
import type { GroupMessage, PrivateMessage } from '@/types';

export async function analyzeTone(
  messages: Array<Pick<GroupMessage, 'text'> | PrivateMessage>
): Promise<string> {
  if (!messages || messages.length === 0) return 'нейтральный';
  const text = messages.map(m => m.text).join('\n');
  const prompt = `Определи эмоциональный тон сообщений. Ответь ТОЛЬКО одним словом из списка: агрессивный, весёлый, формальный, льстивый, грустный, саркастичный, нейтральный, возбуждённый, обиженный, оскорбительный.

Сообщения:
${text}`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 5,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return 'нейтральный';
  const data = await res.json();
  return data.content?.[0]?.text?.trim().toLowerCase() || 'нейтральный';
}

export async function analyzeAttitudeTowardsBot(messageText: string): Promise<string> {
  const prompt = `Определи, какое отношение к тебе (к собеседнику, боту) выражено в этом сообщении.

Важно: если автор ругается на код, погоду, жизнь, работу, политику — это НЕ агрессия в твой адрес. Оценивай только отношение конкретно к тебе.

Ответь ТОЛЬКО одним словом из списка: дружелюбное, агрессивное, нейтральное, льстивое, оскорбительное, ироничное, холодное.

Сообщение: "${messageText}"`;

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: 5,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!res.ok) return 'нейтральное';
  const data = await res.json();
  return data.content?.[0]?.text?.trim().toLowerCase() || 'нейтральное';
}
