import type { PrivateMessage } from '@/types';

export class PrivateContextManager {
  private contexts = new Map<number, PrivateMessage[]>();

  addMessage(userId: number, text: string, isBot = false): void {
    if (!this.contexts.has(userId)) {
      this.contexts.set(userId, []);
    }
    const msgs = this.contexts.get(userId)!;
    msgs.push({ role: isBot ? 'Assistant' : 'User', text });
    if (msgs.length > 10) msgs.shift();
  }

  getContext(userId: number): string {
    const msgs = this.contexts.get(userId);
    if (!msgs || msgs.length === 0) return '';
    return msgs.map(m => `${m.role}: ${m.text}`).join('\n');
  }

  getMessages(userId: number): PrivateMessage[] {
    return this.contexts.get(userId) || [];
  }
}

export const privateContextManager = new PrivateContextManager();
