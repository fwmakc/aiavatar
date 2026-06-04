import { callSimpleAI } from '@/ai/client';

const AVAILABLE_REACTIONS = [
  { emoji: '👍', label: 'agree, approve, useful' },
  { emoji: '👎', label: 'disagree, useless, disapprove' },
  { emoji: '❤️', label: 'love, awesome, delight' },
  { emoji: '🔥', label: 'fire, strong, amazing' },
  { emoji: '😂', label: 'funny, lol, absurd' },
  { emoji: '🤔', label: 'interesting, doubtful, thoughtful' },
  { emoji: '🤯', label: 'mind blown, wow, unexpected' },
  { emoji: '😡', label: 'angry, outrage, indignation' },
  { emoji: '💩', label: 'nonsense, trash, ew' },
  { emoji: '👀', label: 'watching, scandalous, intrigue' },
  { emoji: '🙈', label: 'shame, cringe, do not want to see' },
  { emoji: '🎉', label: 'congratulations, hooray, victory' },
];

export async function pickReaction(messageText: string): Promise<string | null> {
  if (messageText.length < 5) return null;

  const list = AVAILABLE_REACTIONS.map(r => `${r.emoji} — ${r.label}`).join('\n');

  const prompt = `You are reacting to a message in a chat. Choose ONE emoji reaction that best conveys your attitude toward the message.\n\nAvailable reactions:\n${list}\n\nIf you don't want to react — answer: NO.\n\nMessage: "${messageText.slice(0, 300)}"\n\nAnswer with ONLY: one reaction from the list or NO. Always respond in English for this specific question.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 10);
    const clean = answer.trim();

    if (clean.toUpperCase().includes('NO') || clean.toUpperCase().includes('НЕТ')) return null;

    for (const r of AVAILABLE_REACTIONS) {
      if (clean.includes(r.emoji)) return r.emoji;
    }
    return null;
  } catch {
    return null;
  }
}
