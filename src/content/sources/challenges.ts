import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatPersonaConfig } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

const DEFAULT_TOPICS = [
  'глаза и зрение',
  'спина и осанка',
  'запястья и руки',
  'шея и плечи',
  'гидратация и питьё воды',
  'перерывы от экрана',
  'сухость глаз',
  'стул и кресло',
  'разминка ног',
  'поза при работе',
  'синий свет и сон',
  'стресс и выгорание',
];

export async function getChallengeContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const topics = cfg.contentSources?.challenges?.topics ?? DEFAULT_TOPICS;

  if (topics.length === 0) return null;

  const chatIdNum = chatId ?? 0;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `Ты — заботливый друг в рабочем чате. Напиши ОДНО короткое дружеское напоминание про здоровье коллег: ${topic}.

Требования:
- Максимум 2-3 предложения
- Без слов "челлендж", "задание", "миссия" — просто напоминание от друга
- Без тегов людей
- Можно использовать эмодзи
- Тон: тёплый, не назидательный, слегка шутливый
- Не используй кавычки в начале и конце

Примеры тона:
"Слушайте, а вы вставали с кресла хоть раз сегодня? Спина потом скажет спасибо, а пока — потянитесь 🧘"
"Глаза уже квадратные? Поморгайте 10 раз и посмотрите в окно 20 секунд. Серьёзно, прямо сейчас 👀"

Тема: ${topic}`;

  // Try up to 2 times to avoid duplicates
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await askAI(prompt, undefined, 'friendly');
    const trimmed = text.trim();
    if (!wasContentPosted(chatIdNum, 'challenge', trimmed)) {
      return {
        type: 'challenge',
        text: trimmed,
        tags: ['wellness'],
      };
    }
    console.log(`[Challenge] Duplicate on attempt ${attempt + 1} for chat ${chatIdNum}, retrying...`);
  }

  console.log(`[Challenge] Could not generate fresh challenge for chat ${chatIdNum}`);
  return null;
}

export function getChallengeNeedsTargets(item: ContentItem): boolean {
  return false;
}
