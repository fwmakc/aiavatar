import type { Context } from 'telegraf';

export function createMockContext(overrides: {
  chatType?: 'private' | 'group' | 'supergroup';
  chatId?: number | string;
  userId?: number;
  username?: string;
  text?: string;
  replyToMessage?: { from?: { username?: string; id?: number } } | null;
  messageThreadId?: number;
} = {}): Partial<Context> & { reply: ReturnType<typeof vi.fn>; sendChatAction: ReturnType<typeof vi.fn> } {
  const {
    chatType = 'private',
    chatId = 123456,
    userId = 789012,
    username = 'testuser',
    text = 'hello',
    replyToMessage = null,
    messageThreadId,
  } = overrides;

  return {
    chat: { type: chatType, id: chatId } as any,
    from: { id: userId, username, first_name: 'Test' } as any,
    message: {
      text,
      message_id: 1,
      reply_to_message: replyToMessage as any,
      message_thread_id: messageThreadId,
      date: Math.floor(Date.now() / 1000),
    } as any,
    reply: vi.fn().mockResolvedValue(undefined),
    sendChatAction: vi.fn().mockResolvedValue(undefined),
  };
}
