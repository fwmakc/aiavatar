import { config } from '@/config/env';

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

  const prompt = `Ты реагируешь на сообщение в рабочем чате программистов. Выбери ОДНУ эмодзи-реакцию, которая лучше всего передаёт твоё отношение к сообщению.

Доступные реакции:
${list}

Если не хочешь реагировать — ответь: НЕТ.

Сообщение: "${messageText.slice(0, 300)}"

Ответь ТОЛЬКО: одна реакция из списка или НЕТ.`;

  try {
    const res = await fetch(`${config.aiBaseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.aiApiKey}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: config.aiModel,
        max_tokens: 10,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const answer = data.content?.[0]?.text?.trim() || '';

    if (answer.includes('НЕТ')) return null;

    // Find which reaction emoji was returned
    for (const r of AVAILABLE_REACTIONS) {
      if (answer.includes(r.emoji)) return r.emoji;
    }
    return null;
  } catch {
    return null;
  }
}
