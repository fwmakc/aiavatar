import { config } from '@/config/env';
import { buildSystemPrompt } from '@/config/persona';
import { askAI } from '@/ai/client';
import { relationshipGraph } from './relationship-graph';
import { relationships } from '@/relationship/manager';

export interface ConflictContext {
  participants: Array<{
    userId: number;
    name: string;
    recentMessages: string[];
  }>;
  topic: string;
  escalationLevel: number; // 1..5
}

const FALLBACKS = [
  'Ребята, давайте не ссориться. Мы ж тут свои.',
  'Эй, эй, полегче. Дышим носом, выдыхаем ртом.',
  'Чё так накаляетесь? Выпейте чаю, отдохните.',
  'Давайте без мата, а? Мы же культурные люди.',
  'Ого, страсти-то какие. Может, передохнём?',
];

export async function generateIntervention(context: ConflictContext): Promise<string | null> {
  if (context.participants.length === 0) return null;

  let prompt: string;

  if (context.participants.length === 1) {
    const p = context.participants[0];
    const botScore = relationships.get(0, p.userId).score;
    const hint = botScore < -2
      ? `Ты не очень ладишь с ${p.name}, но всё равно попробуй успокоить.`
      : `Ты нормально относишься к ${p.name}, можешь подколоть, но не оскорбляй.`;

    prompt = `Ты — участник чата, один из своих. ${hint}

${p.name} пишет агрессивные/оскорбительные сообщения:
${p.recentMessages.map(m => `${p.name}: "${m}"`).join('\n')}

Тема: ${context.topic}
Накал: ${context.escalationLevel}/5

Вмешайся естественно. Используй имя. Не говори, что ты бот. Будь своим. 1-2 предложения. Можно с юмором.`;
  } else {
    const [p1, p2] = context.participants;
    const botScore1 = relationships.get(0, p1.userId).score;
    const botScore2 = relationships.get(0, p2.userId).score;
    const graphWeight = relationshipGraph.getWeight(p1.userId, p2.userId);

    let relationshipHint = '';
    if (botScore1 > botScore2 + 2) {
      relationshipHint = `Ты ближе к ${p1.name}, чем к ${p2.name}. Можешь слегка поддержать ${p1.name}, но не унижать ${p2.name}.`;
    } else if (botScore2 > botScore1 + 2) {
      relationshipHint = `Ты ближе к ${p2.name}, чем к ${p1.name}. Можешь слегка поддержать ${p2.name}, но не унижать ${p1.name}.`;
    } else {
      relationshipHint = `Ты нейтрален к обоим. Постарайся разрядить обстановку или переформулировать спор.`;
    }

    prompt = `Ты — участник чата, один из своих. ${relationshipHint}

В чате спор:
${p1.name}: "${p1.recentMessages.join('"\n' + p1.name + ': "')}"  
${p2.name}: "${p2.recentMessages.join('"\n' + p2.name + ': "')}"  

Тема спора: ${context.topic}
Накал: ${context.escalationLevel}/5

Вмешайся естественно. Используй имя того, к кому обращаешься. Не говори, что ты бот. Будь своим. 1-2 предложения. Можно с юмором.`;
  }

  try {
    const result = await askAI(prompt, buildSystemPrompt(), 'нейтральный');
    if (result && result.trim().length > 5) return result.trim();
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  } catch {
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }
}

export function shouldIntervene(
  chatId: number | string,
  replyChain: Array<{ userId: number; tone: string }>,
  groupActiveMode: boolean
): boolean {
  if (!groupActiveMode) return false;
  if (replyChain.length < 3) return false;

  // Проверяем нарастающий негатив в цепочке (последние 3 сообщения)
  const recent = replyChain.slice(-3);
  const negativeCount = recent.filter(m =>
    m.tone.includes('агрес') || m.tone.includes('оскорб') || m.tone.includes('злоб') || m.tone.includes('враж')
  ).length;

  // Если 2+ из последних 3 сообщений агрессивные — вмешиваемся ВСЕГДА
  if (negativeCount >= 2) {
    return true;
  }

  return false;
}
