import type { ContentItem, ContentType } from '@/content/types';

import { getNewsContent } from '@/content/sources/news';
import { getJokeContent } from '@/content/sources/jokes';

import { getQuizContent } from '@/content/sources/quiz';
import { getChallengeContent, getChallengeNeedsTargets } from '@/content/sources/challenges';
import { getRecentContentTypes } from '@/content/store/state';

const CONTENT_GENERATORS: Record<ContentType, (chatId: number) => Promise<ContentItem | null>> = {
  news: (chatId) => getNewsContent(chatId),
  joke: (chatId) => getJokeContent(chatId),
  quiz: (chatId) => getQuizContent(chatId),
  challenge: (chatId) => getChallengeContent(chatId),
};

const DAYTIME_WEIGHTS: Record<string, ContentType[]> = {
  morning: ['news', 'challenge'],
  day: ['news', 'quiz', 'challenge'],
  evening: ['joke', 'quiz', 'challenge'],
  night: ['joke', 'challenge'],
};

function getTimeOfDay(): 'morning' | 'day' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'day';
  if (hour >= 18 && hour < 23) return 'evening';
  return 'night';
}

function pickContentType(chatId: number): ContentType {
  const recent = getRecentContentTypes(chatId, 3);
  const timeOfDay = getTimeOfDay();
  const candidates = DAYTIME_WEIGHTS[timeOfDay];

  // Filter out recent types to avoid repetition
  const available = candidates.filter(t => !recent.includes(t));
  const pool = available.length > 0 ? available : candidates;

  return pool[Math.floor(Math.random() * pool.length)];
}

export async function generateContent(chatId: number): Promise<ContentItem | null> {
  const type = pickContentType(chatId);
  const generator = CONTENT_GENERATORS[type];

  try {
    const item = await generator(chatId);
    if (!item) {
      // Fallback to joke if primary source failed
      return getJokeContent();
    }
    return item;
  } catch (e) {
    console.error(`Content generation failed for type ${type}:`, e);
    // Fallback
    try {
      return await getJokeContent();
    } catch {
      return null;
    }
  }
}

export { getChallengeNeedsTargets };
