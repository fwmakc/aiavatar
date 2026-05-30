import { Telegraf } from 'telegraf';
import HttpsProxyAgent from 'https-proxy-agent';
import { config } from '@/config/env';

const proxyAgent = config.proxyUrl
  ? new HttpsProxyAgent(config.proxyUrl)
  : undefined;

export const bot = new Telegraf(config.telegramBotToken, {
  telegram: {
    agent: proxyAgent,
  },
});
