import { callSimpleAI } from '@/ai/client';

const AVAILABLE_REACTIONS = [
  { emoji: '👍', label: 'согласен, одобряю, полезно' },
  { emoji: '👎', label: 'не согласен, бесполезно, не одобряю' },
  { emoji: '❤️', label: 'круто, люблю, восторг' },
  { emoji: '🔥', label: 'огонь, сильно, имба' },
  { emoji: '😂', label: 'смешно, рофл, абсурд' },
  { emoji: '🤔', label: 'интересно, сомнительно, задумчиво' },
  { emoji: '🤯', label: 'взрыв мозга, wow, неожиданно' },
  { emoji: '😡', label: 'бесит, возмущение, негодование' },
  { emoji: '💩', label: 'полный бред, треш, фу' },
  { emoji: '👀', label: 'слежу, скандально, интрига' },
  { emoji: '🙈', label: 'стыд, кринж, не хочу это видеть' },
  { emoji: '🎉', label: 'поздравляю, ура, победа' },
];

export async function pickReaction(messageText: string): Promise<string | null> {
  // Skip too short messages
  if (messageText.length < 5) return null;

  const list = AVAILABLE_REACTIONS.map(r => `${r.emoji} — ${r.label}`).join('\n');

  const prompt = `Ты реагируешь на сообщение в чате. Выбери ОДНУ эмодзи-реакцию, которая лучше всего передаёт твоё отношение к сообщению.\n\nДоступные реакции:\n${list}\n\nЕсли не хочешь реагировать — ответь: НЕТ.\n\nСообщение: "${messageText.slice(0, 300)}"\n\nОтветь ТОЛЬКО: одна реакция из списка или НЕТ.`;

  try {
    const answer = await callSimpleAI(prompt, undefined, 10);
    const clean = answer.trim();

    if (clean.includes('НЕТ')) return null;

    for (const r of AVAILABLE_REACTIONS) {
      if (clean.includes(r.emoji)) return r.emoji;
    }
    return null;
  } catch {
    return null;
  }
}
