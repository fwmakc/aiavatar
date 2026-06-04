import type { ContentItem, ContentType } from '@/content/types';

import { getFeedContent } from '@/content/sources/feeds';
import { getQuizContent } from '@/content/sources/quiz';
import { getChallengeContent, getChallengeNeedsTargets } from '@/content/sources/challenges';
import { getRecentContentTypes } from '@/content/store/state';

const CONTENT_GENERATORS: Record<ContentType, (chatId: number) => Promise<ContentItem | null>> = {
  feed: (chatId) => getFeedContent(chatId),
  quiz: (chatId) => getQuizContent(chatId),
  challenge: (chatId) => getChallengeContent(chatId),
};

const TYPE_WEIGHTS: Record<ContentType, number> = {
  feed: 6,
  quiz: 2,
  challenge: 2,
};

function pickContentType(chatId: number): ContentType {
  const recent = getRecentContentTypes(chatId, 3);
  const allTypes: ContentType[] = ['feed', 'quiz', 'challenge'];
  const available = allTypes.filter(t => !recent.includes(t));
  const pool = available.length > 0 ? available : allTypes;

  const totalWeight = pool.reduce((sum, t) => sum + TYPE_WEIGHTS[t], 0);
  let roll = Math.random() * totalWeight;
  for (const type of pool) {
    roll -= TYPE_WEIGHTS[type];
    if (roll <= 0) return type;
  }
  return pool[pool.length - 1];
}

export async function generateContent(chatId: number): Promise<ContentItem | null> {
  const type = pickContentType(chatId);
  const generator = CONTENT_GENERATORS[type];

  try {
    const item = await generator(chatId);
    if (!item) {
      return getFeedContent(chatId);
    }
    return item;
  } catch (e) {
    console.error(`Content generation failed for type ${type}:`, e);
    try {
      return await getFeedContent(chatId);
    } catch {
      return null;
    }
  }
}

export { getChallengeNeedsTargets };
