import 'dotenv/config';
import { config } from '@/config/env';
import { bot } from '@/telegram/bot';
import { setupMessageHandler } from '@/telegram/handlers/message-handler';
import { startContentScheduler } from '@/content/scheduler';
import { startPeopleWatcher } from '@/people/loader';
import { startPersonaWatcher } from '@/config/persona';
import { runMigrations } from '@/db/migrate';
import { setMaxConcurrency } from '@/ai/queue';

console.log('=== Старт ===');
console.log('Bot username:', config.botUsername);
console.log('Proxy:', config.proxyUrl ? config.proxyUrl.replace(/:\/\/[^:]+:[^@]+@/, '://***@') : 'none');
console.log('AI URL:', config.aiBaseUrl);

setMaxConcurrency(config.aiConcurrency);

// Migrate old JSON databases to SQLite before anything else touches them
runMigrations();

setupMessageHandler();
startPeopleWatcher();
startPersonaWatcher();

// Test connection before launch
console.log('Проверяю соединение с Telegram...');
bot.telegram.getMe()
  .then(me => {
    console.log('getMe OK:', me.username, me.id);
    console.log('Запускаю polling...');
    bot.launch(() => {
      console.log('Цифровой двойник запущен!');
      startContentScheduler();
    });
  })
  .catch(err => {
    console.error('ОШИБКА подключения к Telegram:', err.message);
    console.error('Проверь PROXY_URL и TELEGRAM_BOT_TOKEN в .env');
    process.exit(1);
  });

process.once('SIGINT', () => {
  try { bot.stop('SIGINT'); } catch { /* already stopped */ }
});
process.once('SIGTERM', () => {
  try { bot.stop('SIGTERM'); } catch { /* already stopped */ }
});
