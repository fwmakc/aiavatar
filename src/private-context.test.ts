import { describe, it, expect, beforeEach } from 'vitest';
import { db } from '@/db';
import { addPrivateMessage, getPrivateContext, getPrivateMessages } from './private-context';

function resetDb() {
  db.exec('DELETE FROM private_context');
}

describe('private context', () => {
  beforeEach(() => {
    resetDb();
  });

  describe('addPrivateMessage', () => {
    it('stores user message', () => {
      addPrivateMessage(1, 'hello');
      const msgs = getPrivateMessages(1);
      expect(msgs).toHaveLength(1);
      expect(msgs[0].role).toBe('User');
      expect(msgs[0].text).toBe('hello');
    });

    it('stores bot message', () => {
      addPrivateMessage(1, 'hi there', true);
      const msgs = getPrivateMessages(1);
      expect(msgs[0].role).toBe('Assistant');
    });

    it('keeps messages in order', () => {
      addPrivateMessage(1, 'first');
      addPrivateMessage(1, 'second', true);
      addPrivateMessage(1, 'third');
      const msgs = getPrivateMessages(1);
      expect(msgs.map(m => m.text)).toEqual(['first', 'second', 'third']);
    });

    it('trims to last 10 messages', () => {
      for (let i = 0; i < 15; i++) {
        addPrivateMessage(1, `msg ${i}`);
      }
      const msgs = getPrivateMessages(1);
      expect(msgs).toHaveLength(10);
      expect(msgs[0].text).toBe('msg 5');
      expect(msgs[9].text).toBe('msg 14');
    });
  });

  describe('getPrivateContext', () => {
    it('returns formatted context', () => {
      addPrivateMessage(1, 'hello');
      addPrivateMessage(1, 'hi', true);
      const ctx = getPrivateContext(1);
      expect(ctx).toContain('User: hello');
      expect(ctx).toContain('Assistant: hi');
    });

    it('returns empty string for unknown user', () => {
      expect(getPrivateContext(999)).toBe('');
    });
  });

  describe('multi-user isolation', () => {
    it('keeps separate contexts per user', () => {
      addPrivateMessage(1, 'user1 msg');
      addPrivateMessage(2, 'user2 msg');
      expect(getPrivateMessages(1)).toHaveLength(1);
      expect(getPrivateMessages(2)).toHaveLength(1);
    });
  });
});
