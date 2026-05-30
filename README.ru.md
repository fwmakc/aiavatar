# AIAvatar

[🇷🇺 Русский](README.ru.md) | [🇬🇧 English](README.md) | [🇨🇳 中文](README.zh.md)

Telegram-бот с модульной персоной, социальным интеллектом и контентным движком. Цифровой двойник, который помнит людей, адаптируется под чаты, постит контент по расписанию и вмешивается в споры — всё через JSON-конфиги без правки кода.

## Что умеет

### 🎭 Модульная персона
Вся личность бота — в JSON-файлах, не в коде. Меняй имя, стиль, интересы, взгляды и источники контента без перезапуска.

- **`data/default.json`** — базовая личность
- **`data/chats/{chatId}.json`** — переопределение для конкретного чата
- **`data/personal_chats/{userId}.json`** — особая личность для ЛС с конкретным человеком

### 👥 Социальный интеллект
- **Профили людей** — `data/users/{userId}.json`: как обращаться, что о человеке знать
- **Система отношений** — динамический score (−5..+5) per-chat per-user. Бот помнит, кто друг, а кто недруг
- **Анализ тона** — AI определяет настроение собеседника и подстраивает ответ
- **TIT FOR TAT** — чем хуже отношения, тем более саркастичен бот. Хорошие отношения — тепло и дружба
- **Режим примирения** — в ЛС при отрицательном score бот предлагает помириться
- **Психологический портрет** — команда `/profile` строит профиль пользователя на основе истории общения

### 📰 Контентный движок
Адаптивный планировщик постит контент только когда чат пустует:
- **Новости** — RSS-ленты, настраиваемые per-chat
- **Шутки** — Bash.im + JokeAPI + fallback на AI-генерацию
- **Викторины** — AI-генерация вопросов по заданным темам
- **Wellness-напоминания** — лёгкие челленджи для здоровья
- **Дедупликация** — не постит один и тот же контент дважды
- **Тихие часы** — не спамит ночью и в выходные

### 🛡️ Модерация и защита
- **Topic guard** — в ЛС блокирует оффтопик-запросы
- **Guard check** — в группах проверяет, уместен ли запрос по теме чата
- **Ban system** — 2 отказа guard'ом = 24-часовой локальный бан
- **Rate limiting** — лимит proactive-ответов в группе (не распространяется на reply/mention)

### 💬 Общение в группах
- **Screening** — AI решает, интересен ли разговор, чтобы вмешаться
- **Intervention** — вмешивается при нарастании конфликта (2+ негативных сообщения подряд)
- **Реакции** — 25% шанс поставить эмодзи на сообщение
- **Контекст** — AI видит историю последних сообщений, а не только текущее

### ⚙️ Техническое
- **Hot reload** — изменения в `data/` подхватываются без перезапуска
- **Anthropic-compatible API** — работает с Kimi, Claude и другими через `/messages`
- **HTTP-прокси** — поддержка прокси для Telegram API в заблокированных регионах
- **TypeScript + Vite** — сборка в единый SSR-бандл
- **Два формата AI API** — поддержка Anthropic `/messages` и OpenAI `/chat/completions`

## Быстрый старт

```bash
# 1. Клонируй
npm install

# 2. Настрой окружение
cp .env.example .env
# отредактируй .env — вставь токены

# 3. Заполни конфиги
cp data/users/example.json data/users/123456789.json      # свой профиль
cp data/personal_chats/example.json data/personal_chats/123456789.json  # персона для ЛС

# 4. Собери и запусти
npm run build
npm start

# Или для разработки
npm run dev
```

## Docker

```bash
# Собрать и запустить через docker-compose
docker-compose up -d

# Или вручную
docker build -t aiavatar .
docker run -d --env-file .env -v ./data:/app/data aiavatar
```

## Структура конфигов

```
data/
  default.json              # Базовая личность бота
  chats/
    1001234567890.json      # Переопределения для чата (ID без минуса)
  users/
    123456789.json          # Социальный профиль человека
  personal_chats/
    123456789.json          # Личность для ЛС с этим человеком
  relationships.json        # Динамические отношения (не коммитится)
```

### `data/default.json`

| Поле | Описание |
|---|---|
| `name` | Имя бота |
| `language` | Язык общения — бот всегда отвечает на нём |
| `specialization` | Кто он по профессии/жизни |
| `interests` | Культурный код, увлечения |
| `views` | Взгляды на мир, позиция в спорах |
| `style` | Стиль общения (дружелюбный, саркастичный, деловой...) |
| `contentSources.news` | Список RSS-лент для новостей |
| `contentSources.jokes.bashRss` | RSS Bash.im |
| `contentSources.jokes.jokeApiUrl` | URL JokeAPI |
| `contentSources.jokes.fallbackPrompt` | Промпт для AI-шуток |
| `contentSources.quiz.topics` | Темы для викторин |
| `contentSources.challenges.topics` | Темы wellness-напоминаний |
| `schedule.quietHours` | Тихие часы (start/end в HH:MM) |
| `schedule.quietDays` | Тихие дни недели (0 = воскресенье) |

### `data/chats/{chatId}.json`

Переопределяет любые поля из `default.json` для конкретного чата. Telegram chat ID начинается с `-100...`, но в имени файла минус **не пишется**.

### `data/users/{userId}.json`

```json
{
  "appeals": ["Ваня", "Ванька"],
  "notes": "Друг с универа. Любит спорить о типах."
}
```

### `data/personal_chats/{userId}.json`

```json
{
  "persona": {
    "specialization": "Внук, который помогает с телефоном",
    "style": "Терпеливый, ласковый",
    "interests": "Садоводство, кулинария, советские фильмы",
    "views": "С уважением относишься к старшему поколению"
  }
}
```

Применяется **только в ЛС**. Приоритет: `chats` > `personal_chats` > `default`.

## Переменные окружения

См. [`.env.example`](.env.example).

| Переменная | Описание |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Токен от @BotFather |
| `BOT_USERNAME` | Username бота без @ |
| `AI_BASE_URL` | Anthropic-compatible endpoint |
| `AI_API_KEY` | API-ключ |
| `AI_MODEL` | Название модели |
| `AI_TEMPERATURE` | Температура ответов (0.0–1.0+) |
| `AI_MAX_TOKENS` | Лимит токенов |
| `AI_API_FORMAT` | Формат API: `anthropic` (по умолчанию) или `openai` |
| `PROXY_URL` | HTTP-прокси для Telegram |
| `ALLOWED_USERS` | Разрешённые user IDs/username (через запятую) |
| `GROUP_ACTIVE_MODE` | Включить proactive-ответы в группах |
| `GROUP_SCREENING_INTERVAL_MIN` | Интервал скрининга групп |
| `GROUP_CONTEXT_LIMIT` | Глубина контекста сообщений |
| `GROUP_REPLY_LIMIT_PER_HOUR` | Лимит proactive-ответов в час |
| `GUARD_ENABLED` | Включить guard/topic проверки |
| `TIT_FOR_TAT_MODE` | Включить динамические отношения |
| `CONTENT_ENGINE_ENABLED` | Включить контентный движок |
| `BAN_DURATION_HOURS` | Длительность бана (часы) |

## Команды в ЛС

- `/profile` — показать психологический портрет
- `/reconcile` — режим примирения (работает автоматически при score < 0)

## CI и релизы

- **CI** — проверяется на каждый PR: `npm ci` → `npm run build`
- **Release** — публикация в npm по git-тегу `v*`. Требуется `NPM_TOKEN` в GitHub Secrets.

```bash
npm version patch   # или minor / major
git push --follow-tags
```

## Лицензия

Apache 2.0 — см. [LICENSE](LICENSE).
