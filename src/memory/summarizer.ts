import { callSimpleAI } from '@/ai/client';
import type { BufferedMessage, ChatMemory } from '@/memory/store';

const TIER_LABELS: Record<string, string> = {
  day: 'from the last 24 hours',
  short: 'from the last 3 days',
  week: 'from the last week',
  month: 'from the last month',
};

function formatMessages(messages: BufferedMessage[]): string {
  return messages.map(m => `${m.author}: ${m.content}`).join('\n');
}

export async function summarizeBuffer(
  messages: BufferedMessage[],
  existingSummary: string | null
): Promise<string> {
  const messagesText = formatMessages(messages);

  const prompt = `You are summarizing chat history for your own future memory.

${existingSummary ? `Existing summary:\n${existingSummary}\n` : 'No existing summary (this is new).'}

New messages to incorporate:
${messagesText}

Merge the new messages into ${existingSummary ? 'the existing summary' : 'a new summary'}.

Rules:
- Keep important facts: names, preferences, decisions, events, technical details
- Keep emotional context: conflicts, jokes, moods, who gets along with whom
- Discard: small talk, greetings, filler, repetitive info
- If something is contradicted by new info, update it
- Be concise but don't lose meaningful details
- Write in plain text, no bullet points or headers

Output only the merged summary, nothing else.`;

  try {
    const result = await callSimpleAI(prompt, undefined, 1024);
    return result.trim() || (existingSummary || '');
  } catch (e) {
    console.error('[Memory:Summarizer] Summarization failed:', e);
    return existingSummary || '';
  }
}

export async function consolidateTiers(
  memories: ChatMemory[],
  targetTier: string
): Promise<string> {
  if (memories.length === 0) return '';
  if (memories.length === 1) return memories[0].summary;

  const combined = memories
    .map(m => `[${TIER_LABELS[m.tier] || m.tier}]: ${m.summary}`)
    .join('\n\n');

  const prompt = `You are compressing multiple memory summaries into one shorter summary.

Memory blocks to merge:
${combined}

Rules:
- Merge all blocks into a single concise summary
- Prioritize: facts > events > emotional context > minor details
- Remove anything redundant or contradictory (keep the newer version)
- Be significantly shorter than the combined input
- Write in plain text, no bullet points or headers

Output only the merged summary, nothing else.`;

  try {
    const result = await callSimpleAI(prompt, undefined, 1024);
    return result.trim() || '';
  } catch (e) {
    console.error('[Memory:Summarizer] Tier consolidation failed:', e);
    return memories[0].summary;
  }
}
