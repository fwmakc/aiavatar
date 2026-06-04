import { buildSystemPrompt } from '@/config/persona';
import { askAI } from '@/ai/client';
import { relationships } from '@/relationship/manager';
import { userProfileManager } from './user-profile';
import { privateContextManager } from '@/private-context';
import { relationshipGraph } from './relationship-graph';

export async function generatePersonalProfile(userId: number): Promise<string> {
  const rel = relationships.get(userId, userId);
  const profile = userProfileManager.getProfile(userId);
  const lsHistory = privateContextManager.getContext(userId);
  const graphEdges = relationshipGraph.getAllEdges(userId);

  const topics = profile
    ? Array.from(profile.topics.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5)
    : [];

  const triggers = profile?.triggers?.length ? profile.triggers.slice(0, 5) : ['no data'];

  const emojis = profile
    ? Array.from(profile.emojiTop.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3)
    : [];

  const prompt = `You are a perceptive psychologist and friend. Create a psychological portrait of a person based on data. Be honest but gentle. Use "you". No more than 10 sentences. Respond in the language from your system prompt.

Data:
- Loyalty to bot: ${rel.score}/5 (${rel.score > 0 ? 'friendly' : rel.score < 0 ? 'wary' : 'neutral'})
- Messages analyzed: ${profile?.messageCount || 0}
- Average message length: ${profile?.avgMessageLength.toFixed(0) || '???'} characters
- Aggression level: ${profile ? (profile.aggressionRate * 100).toFixed(0) : '???'}%
- Top topics: ${topics.map(t => t[0]).join(', ') || 'no data'}
- Frequent triggers: ${triggers.join(', ')}
- Favorite emojis: ${emojis.map(e => e[0]).join(' ') || 'no data'}
- Group connections: ${graphEdges.length} people
${graphEdges.filter(e => e.weight < -3).length > 0 ? `- Conflicts with: ${graphEdges.filter(e => e.weight < -3).map(e => e.targetUserId).join(', ')}` : '- No conflicts identified'}

DM history (last 10 messages):
${lsHistory || '(not enough data)'}

Create a portrait. You can use humor, but keep it light.`;

  try {
    return await askAI(prompt, buildSystemPrompt());
  } catch {
    return 'Not enough data for a portrait yet. Chat with me more!';
  }
}

export function getReconciliationOpening(userId: number): string | null {
  const score = relationships.get(userId, userId).score;
  if (score >= -1) return null;

  const openings: Record<number, string> = {
    [-5]: 'Honestly? You\'ve really annoyed me. But I\'m willing to talk if you\'re willing to listen.',
    [-4]: 'Things aren\'t going well between us. But I don\'t want to hold a grudge — can we discuss it?',
    [-3]: 'You\'ve upset me lately. But let\'s try to fix things.',
    [-2]: 'There\'s some tension between us. Shall we work it out?',
  };

  return openings[score] || openings[-2];
}

export async function processReconciliation(userId: number, userText: string): Promise<string> {
  const score = relationships.get(userId, userId).score;

  const prompt = `You are an AI avatar. The user wants to make peace / improve the relationship.
Current score: ${score}/5 (negative = resentment).
The user wrote: "${userText}"

Respond naturally. If they are sincere — accept the apology / attempt. If they are trolling — coldly reject.
Don't change the score here, just respond. 1-3 sentences. Respond in the language from your system prompt.`;

  try {
    return await askAI(prompt, buildSystemPrompt());
  } catch {
    return 'We\'ll see...';
  }
}
