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
  escalationLevel: number;
}

const FALLBACKS = [
  'Guys, let\'s not fight. We\'re all friends here.',
  'Hey, hey, take it easy. Breathe.',
  'Why so heated? Take a break, have some tea.',
  'Let\'s keep it civil, alright?',
  'Whoa, intense. Maybe we should take a breather?',
];

export async function generateIntervention(context: ConflictContext): Promise<string | null> {
  if (context.participants.length === 0) return null;

  let prompt: string;

  if (context.participants.length === 1) {
    const p = context.participants[0];
    const botScore = relationships.get(0, p.userId).score;
    const hint = botScore < -2
      ? `You don't get along well with ${p.name}, but still try to calm them down.`
      : `You have a normal attitude toward ${p.name}, you can tease a bit, but don't insult.`;

    prompt = `You are a participant in the chat, one of the group. ${hint}

${p.name} is writing aggressive/insulting messages:
${p.recentMessages.map(m => `${p.name}: "${m}"`).join('\n')}

Topic: ${context.topic}
Escalation: ${context.escalationLevel}/5

Intervene naturally. Use their name. Don't say you're a bot. Be one of the group. 1-2 sentences. Humor is welcome. Respond in the language from your system prompt.`;
  } else {
    const [p1, p2] = context.participants;
    const botScore1 = relationships.get(0, p1.userId).score;
    const botScore2 = relationships.get(0, p2.userId).score;
    const graphWeight = relationshipGraph.getWeight(p1.userId, p2.userId);

    let relationshipHint = '';
    if (botScore1 > botScore2 + 2) {
      relationshipHint = `You are closer to ${p1.name} than to ${p2.name}. You can slightly support ${p1.name}, but don't humiliate ${p2.name}.`;
    } else if (botScore2 > botScore1 + 2) {
      relationshipHint = `You are closer to ${p2.name} than to ${p1.name}. You can slightly support ${p2.name}, but don't humiliate ${p1.name}.`;
    } else {
      relationshipHint = `You are neutral toward both. Try to defuse the situation or reframe the argument.`;
    }

    prompt = `You are a participant in the chat, one of the group. ${relationshipHint}

There is an argument in the chat:
${p1.name}: "${p1.recentMessages.join('"\n' + p1.name + ': "')}"
${p2.name}: "${p2.recentMessages.join('"\n' + p2.name + ': "')}"

Argument topic: ${context.topic}
Escalation: ${context.escalationLevel}/5

Intervene naturally. Use the name of whoever you're addressing. Don't say you're a bot. Be one of the group. 1-2 sentences. Humor is welcome. Respond in the language from your system prompt.`;
  }

  try {
    const result = await askAI(prompt, buildSystemPrompt(), 'neutral');
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

  const recent = replyChain.slice(-3);
  const negativeCount = recent.filter(m =>
    m.tone.includes('aggres') || m.tone.includes('insult') || m.tone.includes('hostile')
  ).length;

  if (negativeCount >= 2) {
    return true;
  }

  return false;
}
