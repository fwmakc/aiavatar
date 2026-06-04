import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatPersonaConfig } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

async function generateQuiz(topic: string): Promise<ContentItem | null> {
  const prompt = `Create one short quiz question on the topic: ${topic}.
The question should be interesting and not too easy for the chat audience.

Start with a short playful intro line on a separate line before the question.
Examples: "Let's play a game?", "Who wants a quiz?", "Test your knowledge?", "Pop quiz:"

Response format MUST be EXACTLY like this (no extra text):
INTRO: <your intro line>
QUESTION: <question>
A) <option>
B) <option>
C) <option>
D) <option>
CORRECT: <A/B/C/D>

Always respond in English for the question itself. The intro line must be in the language from your system prompt.`;

  const text = await askAI(prompt, undefined, 'friendly', [], 'low');

  const introMatch = text.match(/INTRO:\s*(.+)/);
  const questionMatch = text.match(/(?:ВОПРОС|QUESTION):\s*(.+)/);
  const aMatch = text.match(/A\)\s*(.+)/);
  const bMatch = text.match(/B\)\s*(.+)/);
  const cMatch = text.match(/C\)\s*(.+)/);
  const dMatch = text.match(/D\)\s*(.+)/);
  const correctMatch = text.match(/(?:ПРАВИЛЬНЫЙ|CORRECT):\s*(A|B|C|D)/);

  if (!questionMatch || !aMatch || !bMatch || !cMatch || !dMatch || !correctMatch) {
    return null;
  }

  const options = [aMatch[1].trim(), bMatch[1].trim(), cMatch[1].trim(), dMatch[1].trim()];
  const correctLetter = correctMatch[1];
  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);
  const intro = introMatch?.[1]?.trim() || '🧠 Quiz time!';

  return {
    type: 'quiz',
    text: `${intro}\n\n🧠 ${questionMatch[1].trim()}`,
    options,
    correctIndex,
    tags: ['quiz'],
  };
}

export async function getQuizContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const topics = cfg.contentSources?.quiz?.topics;
  if (!topics || topics.length === 0) return null;

  const chatIdNum = chatId ?? 0;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  for (let attempt = 0; attempt < 2; attempt++) {
    const item = await generateQuiz(topic);
    if (!item) continue;
    if (!wasContentPosted(chatIdNum, 'quiz', item.text)) {
      return item;
    }
    console.log(`[Quiz] Duplicate on attempt ${attempt + 1} for chat ${chatIdNum}, retrying...`);
  }

  console.log(`[Quiz] Could not generate fresh quiz for chat ${chatIdNum}`);
  return null;
}
