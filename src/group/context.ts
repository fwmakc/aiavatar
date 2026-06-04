import { config } from '@/config/env';
import type { GroupContext, GroupMessage } from '@/types';
import { bufferMessage } from '@/memory/store';

interface ReplyChainEntry {
  userId: number;
  author: string;
  tone: string;
  text: string;
}

export class GroupContextManager {
  private contexts = new Map<number | string, GroupContext>();
  private replyChains = new Map<number | string, ReplyChainEntry[]>();

  get(chatId: number | string): GroupContext {
    if (!this.contexts.has(chatId)) {
      this.contexts.set(chatId, {
        messages: [],
        lastScreening: 0,
        lastBotReplyIndex: -1,
      });
    }
    return this.contexts.get(chatId)!;
  }

  addMessage(chatId: number | string, author: string, text: string): void {
    const ctx = this.get(chatId);
    ctx.messages.push({ author, text, timestamp: Date.now() });
    if (ctx.lastBotReplyIndex >= 0) {
      const trimmed = ctx.messages.slice(0, ctx.lastBotReplyIndex + 1);
      ctx.messages = ctx.messages.slice(ctx.lastBotReplyIndex + 1);
      ctx.lastBotReplyIndex = -1;
      const numChatId = typeof chatId === 'string' ? parseInt(chatId.replace('-', '')) || 0 : chatId;
      for (const m of trimmed) {
        bufferMessage(-numChatId, m.author, m.text, Math.floor(m.timestamp / 1000));
      }
    }
    const limit = config.groupContextLimit * 2;
    if (ctx.messages.length > limit) {
      const trimmed = ctx.messages.slice(0, ctx.messages.length - config.groupContextLimit);
      ctx.messages = ctx.messages.slice(-config.groupContextLimit);
      const numChatId = typeof chatId === 'string' ? parseInt(chatId.replace('-', '')) || 0 : chatId;
      for (const m of trimmed) {
        bufferMessage(-numChatId, m.author, m.text, Math.floor(m.timestamp / 1000));
      }
    }
  }

  markBotReply(chatId: number | string): void {
    const ctx = this.get(chatId);
    ctx.lastBotReplyIndex = ctx.messages.length - 1;
    ctx.lastScreening = Date.now();
  }

  shouldScreen(chatId: number | string): boolean {
    const ctx = this.get(chatId);
    const timePassed = Date.now() - ctx.lastScreening >= config.groupScreeningIntervalMs;
    const enoughMessages = ctx.messages.length >= config.groupContextLimit;
    return timePassed || enoughMessages;
  }

  formatContext(chatId: number | string): string {
    return this.get(chatId).messages.map(m => `${m.author}: ${m.text}`).join('\n');
  }

  formatTruncated(chatId: number | string, maxLen = 150): string {
    return this.get(chatId).messages.map(m => {
      const text = m.text.length > maxLen ? m.text.slice(0, maxLen) + '...' : m.text;
      return `${m.author}: ${text}`;
    }).join('\n');
  }

  getMessagesByAuthor(chatId: number | string, author: string): GroupMessage[] {
    return this.get(chatId).messages.filter(m => m.author === author);
  }

  // === Reply chains для социального вмешательства ===
  addReplyChain(chatId: number | string, userId: number, author: string, tone: string, text: string): void {
    if (!this.replyChains.has(chatId)) {
      this.replyChains.set(chatId, []);
    }
    const chain = this.replyChains.get(chatId)!;
    chain.push({ userId, author, tone, text });
    if (chain.length > 20) chain.shift();
  }

  getReplyChain(chatId: number | string): ReplyChainEntry[] {
    return this.replyChains.get(chatId) || [];
  }

  getLastReplyChain(chatId: number | string, count = 4): ReplyChainEntry[] {
    const chain = this.getReplyChain(chatId);
    return chain.slice(-count);
  }

  clearReplyChain(chatId: number | string): void {
    this.replyChains.delete(chatId);
  }
}

export const groupContextManager = new GroupContextManager();
