# 4. Установка и настройка

## Шаг 1. Клонируем репозиторий

```bash
git clone https://github.com/fwmakc/aiavatar.git
cd aiavatar
```

## Шаг 2. Устанавливаем зависимости

```bash
npm install
```

## Шаг 3. Создаём .env

```bash
cp .env.example .env
```

## Шаг 4. Заполняем .env

Откройте `.env` в любом редакторе и заполните:

```env
# === Обязательные ===

# Токен от @BotFather (глава 2)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Username бота без @ (глава 2)
BOT_USERNAME=my_dev_max_bot

# AI-сервис (глава 3)
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-ваш-ключ
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic

# === Опциональные ===

# Температура ответов (0.0 - формальный, 1.0 - креативный)
AI_TEMPERATURE=0.7

# Лимит токенов на ответ
AI_MAX_TOKENS=4096

# Прокси (если Telegram заблокирован)
# PROXY_URL=http://user:pass@host:port

# Разрешённые пользователи (user ID через запятую, пусто = никто не имеет доступа)
ALLOWED_USERS=

# === Поведение в группах ===

# Включить proactive-ответы в группах
GROUP_ACTIVE_MODE=true

# Интервал скрининга групп (минуты)
GROUP_SCREENING_INTERVAL_MIN=60

# Глубина контекста сообщений
GROUP_CONTEXT_LIMIT=10

# Лимит proactive-ответов в час
GROUP_REPLY_LIMIT_PER_HOUR=5

# === Функции ===

# Включить guard/topic проверки
GUARD_ENABLED=true

# Включить динамические отношения
TIT_FOR_TAT_MODE=true

# Включить контентный движок (новости, шутки, викторины)
CONTENT_ENGINE_ENABLED=true

# Длительность бана (часы)
BAN_DURATION_HOURS=24
```

### Минимальный .env для первого запуска

Достаточно заполнить только обязательные поля:

```env
TELEGRAM_BOT_TOKEN=ваш_токен
BOT_USERNAME=ваш_username
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-ваш-ключ
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
```

Остальное оставьте как есть — значения по умолчанию подходят для большинства случаев.

---

**Далее:** [Сценарий: рабочий помощник →](05-scenario-dev.md)
