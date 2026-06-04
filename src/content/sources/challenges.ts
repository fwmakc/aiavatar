import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatPersonaConfig } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

export async function getChallengeContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const topics = cfg.contentSources?.challenges?.topics;
  if (!topics || topics.length === 0) return null;

  const chatIdNum = chatId ?? 0;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  const prompt = `You are a caring friend in a group chat. Write ONE short friendly health reminder about: ${topic}.

Requirements:
- Maximum 2-3 sentences
- No words like "challenge", "task", "mission" — just a friendly reminder
- Don't tag people
- You can use emojis
- Tone: warm, not preachy, slightly humorous
- No quotes at the beginning and end
- Start with a short inviting intro line. Examples: "Let's take a break:", "A quick health pause:", "Take a minute for this:", "I recommend doing this:"
- Respond in the language from your system prompt

Example tone:
"Hey, have you gotten up from your chair at all today? Your back will thank you later — stretch a bit"
"Eyes getting square? Blink 10 times and look out the window for 20 seconds. Seriously, right now"

Topic: ${topic}`;

  // Try up to 2 times to avoid duplicates
  for (let attempt = 0; attempt < 2; attempt++) {
    const text = await askAI(prompt, undefined, 'friendly', [], 'low');
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
