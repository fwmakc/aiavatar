import 'dotenv/config';
import type { AppConfig } from '@/types';

function getEnv(name: string, required = true): string {
  const value = process.env[name];
  if (required && !value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value || '';
}

export const config: AppConfig = {
  telegramBotToken: getEnv('TELEGRAM_BOT_TOKEN'),
  aiBaseUrl: getEnv('AI_BASE_URL'),
  aiApiKey: getEnv('AI_API_KEY'),
  aiModel: getEnv('AI_MODEL'),
  aiTemperature: parseFloat(process.env.AI_TEMPERATURE || '0.7'),
  aiMaxTokens: parseInt(process.env.AI_MAX_TOKENS || '4096', 10),
  aiApiFormat: (process.env.AI_API_FORMAT || 'anthropic') as 'anthropic' | 'openai',
  botUsername: getEnv('BOT_USERNAME'),
  proxyUrl: process.env.PROXY_URL,
  allowedUsers: (process.env.ALLOWED_USERS || '')
    .split(',')
    .map(u => u.trim())
    .filter(Boolean),
  groupActiveMode: process.env.GROUP_ACTIVE_MODE === 'true',
  groupScreeningIntervalMs: parseInt(process.env.GROUP_SCREENING_INTERVAL_MIN || '60', 10) * 60 * 1000,
  groupContextLimit: parseInt(process.env.GROUP_CONTEXT_LIMIT || '10', 10),
  guardEnabled: process.env.GUARD_ENABLED === 'true',
  banDurationMs: parseInt(process.env.BAN_DURATION_HOURS || '24', 10) * 60 * 60 * 1000,
  titForTatMode: process.env.TIT_FOR_TAT_MODE === 'true',
  contentEngineEnabled: process.env.CONTENT_ENGINE_ENABLED === 'true',
  groupReplyLimitPerHour: parseInt(process.env.GROUP_REPLY_LIMIT_PER_HOUR || '5', 10),
};
