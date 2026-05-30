import { askAI } from '@/ai/client';
import type { ContentItem } from '@/content/types';
import { getChatPersonaConfig } from '@/config/persona';
import { wasContentPosted } from '@/content/store/state';

const DEFAULT_TOPICS = [
  'JavaScript / TypeScript — тонкости языка, замыкания, прототипы, асинхронность',
  'Python — особенности языка, GIL, менеджеры контекста, генераторы',
  'Алгоритмы и структуры данных — сложность, хеш-таблицы, деревья, графы, сортировки',
  'Сети и протоколы — TCP/IP, HTTP/2, WebSocket, DNS, TLS',
  'DevOps — Docker, Kubernetes, CI/CD, мониторинг, IaC',
  'Паттерны проектирования — SOLID, GoF, микросервисные паттерны',
  'Архитектура highload — кэширование, шардирование, очереди, репликация, CAP-теорема',
  'Базы данных — индексы, транзакции, уровни изоляции, NoSQL vs SQL',
  'Linux и системное администрирование — процессы, файловые дескрипторы, systemd, bash',
  'Безопасность — OWASP, JWT, CORS, XSS, CSRF, шифрование',
];

async function generateQuiz(topic: string): Promise<ContentItem | null> {
  const prompt = `Придумай один короткий тест-вопрос по теме: ${topic}.
Вопрос должен быть интересным для опытных разработчиков, не слишком простым.

Формат ответа СТРОГО такой (без лишнего текста):
ВОПРОС: <вопрос>
A) <вариант>
B) <вариант>
C) <вариант>
D) <вариант>
ПРАВИЛЬНЫЙ: <A/B/C/D>`;

  const text = await askAI(prompt, undefined, 'friendly');

  const questionMatch = text.match(/ВОПРОС:\s*(.+)/);
  const aMatch = text.match(/A\)\s*(.+)/);
  const bMatch = text.match(/B\)\s*(.+)/);
  const cMatch = text.match(/C\)\s*(.+)/);
  const dMatch = text.match(/D\)\s*(.+)/);
  const correctMatch = text.match(/ПРАВИЛЬНЫЙ:\s*(A|B|C|D)/);

  if (!questionMatch || !aMatch || !bMatch || !cMatch || !dMatch || !correctMatch) {
    return null;
  }

  const options = [aMatch[1].trim(), bMatch[1].trim(), cMatch[1].trim(), dMatch[1].trim()];
  const correctLetter = correctMatch[1];
  const correctIndex = ['A', 'B', 'C', 'D'].indexOf(correctLetter);

  return {
    type: 'quiz',
    text: `🧠 ${questionMatch[1].trim()}`,
    options,
    correctIndex,
    tags: ['quiz'],
  };
}

export async function getQuizContent(chatId?: number): Promise<ContentItem | null> {
  const cfg = getChatPersonaConfig(chatId);
  const topics = cfg.contentSources?.quiz?.topics ?? DEFAULT_TOPICS;

  if (topics.length === 0) return null;

  const chatIdNum = chatId ?? 0;
  const topic = topics[Math.floor(Math.random() * topics.length)];

  // Try up to 2 times to avoid duplicates
  for (let attempt = 0; attempt < 2; attempt++) {
    const item = await generateQuiz(topic);
    if (!item) continue;
    if (!wasContentPosted(chatIdNum, 'quiz', item.text)) {
      return item;
    }
    console.log(`[Quiz] Duplicate on attempt ${attempt + 1} for chat ${chatIdNum}, retrying...`);
  }

  console.log(`[Quiz] Could not generate fresh quiz for chat ${chatIdNum}`);

  // Fallback — базовый вопрос про JS (check if already posted)
  const fallbackText = 'Что выведет этот код?\n\n```js\nconsole.log(typeof NaN);\n```';
  if (!wasContentPosted(chatIdNum, 'quiz', fallbackText)) {
    return {
      type: 'quiz',
      text: fallbackText,
      options: ['"number"', '"NaN"', '"undefined"', '"object"'],
      correctIndex: 0,
      tags: ['quiz'],
    };
  }

  return null;
}
