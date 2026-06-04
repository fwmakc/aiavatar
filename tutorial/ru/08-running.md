# 8. Запуск и проверка

## Первый запуск (проверка)

Для первого запуска и проверки работоспособности:

```bash
npm run build
npm start
```

В консоли вы увидите:
```
[Persona] default.json loaded
[ContentEngine] Started (adaptive)
Bot @my_dev_max_bot is running
```

Если вместо этого ошибка — проверьте:
- Заполнен ли `.env` (особенно `TELEGRAM_BOT_TOKEN` и `AI_API_KEY`)
- Правильный ли формат `AI_API_FORMAT` (для Kimi — `anthropic`)

**Это не фоновый режим** — бот остановится, когда вы закроете терминал. Для постоянной работы используйте PM2 (ниже) или Docker ([глава 9](09-docker.md)).

## Проверка в личке

1. Найдите вашего бота в Telegram: введите `@ваш_username_bot` в поиск
2. Нажмите **Start** или отправьте любое сообщение
3. Бот должен ответить в своём стиле

Если бот молчит:
- Проверьте, что `ALLOWED_USERS` содержит ваш user ID или оставьте пустым
- Посмотрите консоль — есть ли ошибки AI-запросов

## Добавление в группу

1. Откройте групповой чат
2. Нажмите **Добавить участника** → найдите бота по username
3. Бот появится в чате

### Важно: Group Privacy

Если вы не отключили Group Privacy в [главе 2](02-telegram-bot.md), бот будет видеть только:
- Сообщения, начинающиеся с `/`
- Сообщения, где бот упомянут (`@username`)
- Ответы на сообщения бота

Для полноценной работы бота в группе **Group Privacy должен быть отключён**.

## Как убедиться, что всё работает

### В личке
- Бот отвечает на сообщения в своём стиле
- Команда `/profile` показывает психологический портрет

### В группе
- Бот видит все сообщения (если Group Privacy отключён)
- Бот иногда вмешивается в разговор (скрининг)
- Бот реагирует эмодзи на некоторые сообщения
- Через 45-60 минут тишины бот постит контент (если включён `CONTENT_ENGINE_ENABLED`)

## Постоянная работа через PM2

[PM2](https://pm2.keymetrics.io/) — менеджер процессов для Node.js. Запускает бота в фоне, автоматически перезапускает при падении, ведёт логи.

### Установка

```bash
npm install -g pm2
```

### Запуск

```bash
npm run build
pm2 start npm --name aiavatar -- start
```

### Полезные команды

```bash
# Статус
pm2 status

# Логи в реальном времени
pm2 logs aiavatar

# Перезапуск
pm2 restart aiavatar

# Остановка
pm2 stop aiavatar

# Удалить из PM2
pm2 delete aiavatar
```

### Автозапуск при перезагрузке сервера

```bash
pm2 startup
pm2 save
```

PM2 выведет команду вида `sudo env PATH=... pm2 startup ...` — выполните её. После этого:
- `pm2 save` — сохраняет текущий список процессов
- При перезагрузке сервера PM2 автоматически запустит все сохранённые процессы

### Обновление бота

```bash
git pull
npm install
npm run build
pm2 restart aiavatar
```

## systemd

Альтернатива PM2 — использовать systemd (встроен в большинство Linux-дистрибутивов).

Создайте файл `/etc/systemd/system/aiavatar.service`:

```ini
[Unit]
Description=AIAvatar Telegram Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/aiavatar
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
EnvironmentFile=/path/to/aiavatar/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable aiavatar
sudo systemctl start aiavatar
sudo journalctl -u aiavatar -f
```

## Запуск для разработки

Если вы хотите менять код и видеть изменения без пересборки:

```bash
npm run dev
```

Бот запустится через `tsx watch` и будет автоматически перезагружаться при изменении файлов в `src/`.

---

**Далее:** [Docker →](09-docker.md)
