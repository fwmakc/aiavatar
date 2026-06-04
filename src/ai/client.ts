import { config } from '@/config/env';
import { buildSystemPrompt } from '@/config/persona';
import { enqueueAI } from '@/ai/queue';
import type { Priority } from '@/ai/queue';

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
}

export async function askAI(
  userText: string,
  customSystemPrompt: string | null = null,
  tone: string | null = null,
  history: AIMessage[] = [],
  priority: Priority = 'critical'
): Promise<string> {
  let system = customSystemPrompt ?? buildSystemPrompt();
  if (tone) {
    system += `\n\nВажно: пользователь сейчас в ${tone}-настроении. Подстрой свой тон ответа под это настроение, но оставайся в рамках своей роли.`;
  }

  const messages: AIMessage[] = [
    ...history,
    { role: 'user', content: userText },
  ];

  return enqueueAI(messages, system, priority);
}

export async function callAI(
  messages: AIMessage[],
  system: string,
  maxTokens?: number
): Promise<string> {
  if (config.aiApiFormat === 'openai') {
    return callOpenAI(messages, system, maxTokens);
  }
  return callAnthropic(messages, system, maxTokens);
}

async function callAnthropic(
  messages: AIMessage[],
  system: string,
  maxTokens?: number
): Promise<string> {
  const res = await fetch(`${config.aiBaseUrl}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: maxTokens ?? config.aiMaxTokens,
      temperature: config.aiTemperature,
      system,
      messages: messages.map(m => ({ role: m.role, content: m.content })),
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API ${res.status}: ${err}`);
  }

  const data = await res.json() as { content?: Array<{ text?: string }> };
  return data.content?.[0]?.text ?? '';
}

async function callOpenAI(
  messages: AIMessage[],
  system: string,
  maxTokens?: number
): Promise<string> {
  const openaiMessages = [
    { role: 'system', content: system },
    ...messages.map(m => ({ role: m.role, content: m.content })),
  ];

  const res = await fetch(`${config.aiBaseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.aiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.aiModel,
      max_tokens: maxTokens ?? config.aiMaxTokens,
      temperature: config.aiTemperature,
      messages: openaiMessages,
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`AI API ${res.status}: ${err}`);
  }

  const data = await res.json() as { choices?: Array<{ message?: { content?: string } }> };
  return data.choices?.[0]?.message?.content ?? '';
}

/**
 * Universal AI call for simple prompts (screening, tone analysis, etc.)
 * Replaces direct fetch() calls across the codebase.
 */
export async function callSimpleAI(
  prompt: string,
  system?: string,
  maxTokens?: number,
  priority: Priority = 'normal'
): Promise<string> {
  return enqueueAI([{ role: 'user', content: prompt }], system ?? '', priority, maxTokens);
}
