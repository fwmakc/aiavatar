import { config } from '@/config/env';
import { buildSystemPrompt } from '@/config/persona';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  userText: string,
  customSystemPrompt: string | null = null,
  tone: string | null = null,
  history: AIMessage[] = []
): Promise<string> {
  let system = customSystemPrompt ?? buildSystemPrompt();
  if (tone) {
    system += `\n\nВажно: пользователь сейчас в ${tone}-настроении. Подстрой свой тон ответа под это настроение, но оставайся в рамках своей роли.`;
  }

  const messages: AIMessage[] = [
    ...history,
    { role: 'user', content: userText },
  ];

  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: config.aiMaxTokens,
      temperature: config.aiTemperature,
      system,
      messages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API ${res.status}: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? '';
}
