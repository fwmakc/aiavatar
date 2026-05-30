import type { ChatEngagementState, ContentType, PostedContent } from '@/content/types';

const states = new Map<number, ChatEngagementState>();

const MAX_POSTED_HISTORY = 50;

export function getChatState(chatId: number): ChatEngagementState {
  if (!states.has(chatId)) {
    states.set(chatId, {
      chatId,
      lastMessageTime: Date.now(),
      lastContentPostTime: 0,
      contentHistory: [],
      postedContent: [],
    });
  }
  return states.get(chatId)!;
}

export function updateLastMessageTime(chatId: number): void {
  const state = getChatState(chatId);
  state.lastMessageTime = Date.now();
}

export function recordContentPost(chatId: number, type: ContentType): void {
  const state = getChatState(chatId);
  state.lastContentPostTime = Date.now();
  state.contentHistory.push(type);
  if (state.contentHistory.length > 20) {
    state.contentHistory.shift();
  }
}

export function recordBotActivity(chatId: number): void {
  const state = getChatState(chatId);
  state.lastMessageTime = Date.now();
}

export function getRecentContentTypes(chatId: number, count = 5): ContentType[] {
  const state = getChatState(chatId);
  return state.contentHistory.slice(-count);
}

export function getActiveQuiz(chatId: number) {
  return getChatState(chatId).activeQuiz;
}

export function setActiveQuiz(
  chatId: number,
  quiz: { question: string; options: string[]; correctIndex: number }
): void {
  const state = getChatState(chatId);
  state.activeQuiz = {
    ...quiz,
    participants: new Map(),
  };
}

export function clearActiveQuiz(chatId: number): void {
  const state = getChatState(chatId);
  state.activeQuiz = undefined;
}

export function recordQuizAnswer(chatId: number, userId: number, chosenIndex: number): void {
  const state = getChatState(chatId);
  if (state.activeQuiz) {
    state.activeQuiz.participants.set(userId, chosenIndex);
  }
}

export function getAllChatIds(): number[] {
  return Array.from(states.keys());
}

export function registerChat(chatId: number): void {
  getChatState(chatId);
}

// === Deduplication ===

function normalizeText(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ').slice(0, 100);
}

function makeContentId(item: { type: ContentType; text: string; link?: string }): string {
  if (item.link) return `${item.type}:${item.link}`;
  return `${item.type}:${normalizeText(item.text)}`;
}

export function wasContentPosted(chatId: number, type: ContentType, text: string, link?: string): boolean {
  const state = getChatState(chatId);
  const id = link ? `${type}:${link}` : `${type}:${normalizeText(text)}`;
  return state.postedContent.some(p => p.id === id);
}

export function recordPostedContent(chatId: number, type: ContentType, text: string, link?: string): void {
  const state = getChatState(chatId);
  const id = makeContentId({ type, text, link });
  state.postedContent.push({ id, text: text.slice(0, 200), type, time: Date.now() });
  if (state.postedContent.length > MAX_POSTED_HISTORY) {
    state.postedContent.shift();
  }
}
