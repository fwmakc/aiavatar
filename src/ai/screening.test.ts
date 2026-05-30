import { describe, it, expect, beforeEach } from 'vitest';
import { mockAIResponse } from '@/test/mocks/ai';
import { groupContextManager } from '@/group/context';
import { privateContextManager } from '@/private-context';
import {
  shouldAnswerGroup,
  guardCheck,
  guardCheckPrivate,
  topicGuard,
  generateDenial,
} from './screening';

describe('ai screening', () => {
  beforeEach(() => {
    // Reset in-memory contexts
    groupContextManager.clearReplyChain('chat1');
    // Note: groupContextManager messages cannot be easily cleared; we use specific chat IDs
  });

  describe('shouldAnswerGroup', () => {
    it('returns false when context is empty', async () => {
      const result = await shouldAnswerGroup('empty-chat');
      expect(result).toBe(false);
    });

    it('returns true when AI says ДА', async () => {
      groupContextManager.addMessage('chat1', 'Alice', 'hello everyone');
      mockAIResponse('ДА');
      const result = await shouldAnswerGroup('chat1');
      expect(result).toBe(true);
    });

    it('returns false when AI says НЕТ', async () => {
      groupContextManager.addMessage('chat1', 'Alice', 'hello everyone');
      mockAIResponse('НЕТ');
      const result = await shouldAnswerGroup('chat1');
      expect(result).toBe(false);
    });

    it('returns false on AI error', async () => {
      groupContextManager.addMessage('chat1', 'Alice', 'hello');
      vi.mocked(global.fetch).mockRejectedValue(new Error('network'));
      const result = await shouldAnswerGroup('chat1');
      expect(result).toBe(false);
    });
  });

  describe('guardCheck', () => {
    it('returns true when AI approves', async () => {
      mockAIResponse('ДА');
      const result = await guardCheck('chat1', 'Test Chat', 'How do I deploy Docker?');
      expect(result).toBe(true);
    });

    it('returns false when AI rejects', async () => {
      mockAIResponse('НЕТ');
      const result = await guardCheck('chat1', 'Test Chat', 'What is love?');
      expect(result).toBe(false);
    });

    it('returns true on AI error (fail-open)', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('network'));
      const result = await guardCheck('chat1', 'Test Chat', 'test');
      expect(result).toBe(true);
    });
  });

  describe('guardCheckPrivate', () => {
    it('returns true when AI approves', async () => {
      mockAIResponse('ДА');
      const result = await guardCheckPrivate(1, 'Explain TypeScript generics');
      expect(result).toBe(true);
    });

    it('returns false when AI rejects', async () => {
      mockAIResponse('НЕТ');
      const result = await guardCheckPrivate(1, 'Tell me a love poem');
      expect(result).toBe(false);
    });
  });

  describe('topicGuard', () => {
    it('returns true for IT-related queries', async () => {
      mockAIResponse('ДА');
      const result = await topicGuard('How does Kubernetes work?');
      expect(result).toBe(true);
    });

    it('returns false for non-IT queries', async () => {
      mockAIResponse('НЕТ');
      const result = await topicGuard('What is the meaning of life?');
      expect(result).toBe(false);
    });

    it('returns true on AI error (fail-open)', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('network'));
      const result = await topicGuard('test');
      expect(result).toBe(true);
    });
  });

  describe('generateDenial', () => {
    it('returns AI-generated denial text', async () => {
      mockAIResponse('Не моя тема, извини.');
      const text = await generateDenial('What is love?', 'topic');
      expect(text).toBe('Не моя тема, извини.');
    });

    it('returns fallback on AI error', async () => {
      vi.mocked(global.fetch).mockRejectedValue(new Error('network'));
      const text = await generateDenial('test');
      expect(text).toBe('Не-а, это не для меня.');
    });
  });
});
