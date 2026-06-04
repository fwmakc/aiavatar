import { getAllMemories } from '@/memory/store';

const TIER_DISPLAY: Record<string, string> = {
  month: 'Last month',
  week: 'Last week',
  short: 'Last 3 days',
  day: 'Recently',
};

export function getMemoryContext(chatId: number): string {
  const memories = getAllMemories(chatId);
  if (memories.length === 0) return '';

  const lines = memories.map(m => {
    const label = TIER_DISPLAY[m.tier] || m.tier;
    return `${label}: ${m.summary}`;
  });

  return `Your memory of past conversations in this chat:\n${lines.join('\n')}`;
}
