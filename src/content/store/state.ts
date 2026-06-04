import { db } from '@/db';
import type { ChatEngagementState, ContentType, PostedContent } from '@/content/types';

const MAX_POSTED_HISTORY = 50;

const stmtGet = db.prepare('SELECT * FROM chat_engagement WHERE chat_id = ?');

const stmtUpsert = db.prepare(
  `INSERT INTO chat_engagement
   (chat_id, last_message_time, last_content_post_time, content_history, posted_content, active_quiz)
   VALUES (?, ?, ?, ?, ?, ?)
   ON CONFLICT(chat_id) DO UPDATE SET
     last_message_time = excluded.last_message_time,
     last_content_post_time = excluded.last_content_post_time,
     content_history = excluded.content_history,
     posted_content = excluded.posted_content,
     active_quiz = excluded.active_quiz`
);

const stmtAllChats = db.prepare('SELECT chat_id FROM chat_engagement');

function getRow(chatId: number): any {
  return stmtGet.get(chatId);
}

function defaultState(chatId: number): ChatEngagementState {
  return {
    chatId,
    lastMessageTime: Date.now(),
    lastContentPostTime: 0,
    contentHistory: [],
    postedContent: [],
  };
}

function rowToState(row: any): ChatEngagementState {
  const state: ChatEngagementState = {
    chatId: row.chat_id,
    lastMessageTime: row.last_message_time ?? Date.now(),
    lastContentPostTime: row.last_content_post_time ?? 0,
    contentHistory: JSON.parse(row.content_history || '[]'),
    postedContent: JSON.parse(row.posted_content || '[]'),
  };
  if (row.active_quiz) {
    const q = JSON.parse(row.active_quiz);
    state.activeQuiz = {
      ...q,
      participants: new Map(q.participants || []),
    };
  }
  return state;
}

function saveState(state: ChatEngagementState): void {
  const activeQuiz = state.activeQuiz
    ? JSON.stringify({
        question: state.activeQuiz.question,
        options: state.activeQuiz.options,
        correctIndex: state.activeQuiz.correctIndex,
        participants: Array.from(state.activeQuiz.participants.entries()),
      })
    : null;

  stmtUpsert.run(
    state.chatId,
    state.lastMessageTime,
    state.lastContentPostTime,
    JSON.stringify(state.contentHistory),
    JSON.stringify(state.postedContent),
    activeQuiz
  );
}

export function getChatState(chatId: number): ChatEngagementState {
  const row = getRow(chatId);
  if (row) return rowToState(row);
  const state = defaultState(chatId);
  saveState(state);
  return state;
}

export function updateLastMessageTime(chatId: number): void {
  const state = getChatState(chatId);
  state.lastMessageTime = Date.now();
  saveState(state);
}

export function recordContentPost(chatId: number, type: ContentType): void {
  const state = getChatState(chatId);
  state.lastContentPostTime = Date.now();
  state.contentHistory.push(type);
  if (state.contentHistory.length > 20) {
    state.contentHistory.shift();
  }
  saveState(state);
}

export function recordBotActivity(chatId: number): void {
  const state = getChatState(chatId);
  state.lastMessageTime = Date.now();
  saveState(state);
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
  saveState(state);
}

export function clearActiveQuiz(chatId: number): void {
  const state = getChatState(chatId);
  state.activeQuiz = undefined;
  saveState(state);
}

export function recordQuizAnswer(chatId: number, userId: number, chosenIndex: number): void {
  const state = getChatState(chatId);
  if (state.activeQuiz) {
    state.activeQuiz.participants.set(userId, chosenIndex);
    saveState(state);
  }
}

export function getAllChatIds(): number[] {
  return (stmtAllChats.all() as { chat_id: number }[]).map(r => r.chat_id);
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
  saveState(state);
}

// === Scheduled feed tracking ===

const SCHEDULED_TTL = 60 * 60 * 1000;
const scheduledPosts = new Map<string, number>();

function scheduledKey(chatId: number, feedUrl: string, scheduledTime: string): string {
  return `${chatId}:${feedUrl}:${scheduledTime}`;
}

export function wasScheduledPosted(chatId: number, feedUrl: string, scheduledTime: string): boolean {
  const ts = scheduledPosts.get(scheduledKey(chatId, feedUrl, scheduledTime));
  if (!ts) return false;
  return Date.now() - ts < SCHEDULED_TTL;
}

export function recordScheduledPost(chatId: number, feedUrl: string, scheduledTime: string): void {
  scheduledPosts.set(scheduledKey(chatId, feedUrl, scheduledTime), Date.now());
}
