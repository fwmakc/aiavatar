import { config } from '@/config/env';

export function mockAIResponse(text: string, format?: 'anthropic' | 'openai'): void {
  const apiFormat = format ?? config.aiApiFormat;

  const responseBody =
    apiFormat === 'openai'
      ? {
          choices: [{ message: { content: text } }],
        }
      : {
          content: [{ text }],
        };

  vi.mocked(global.fetch).mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(responseBody),
  } as Response);
}

export function mockAIFailure(status = 500): void {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: false,
    status,
    text: () => Promise.resolve('Internal Server Error'),
  } as Response);
}
