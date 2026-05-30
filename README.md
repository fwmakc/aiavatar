# AIAvatar

[🇷🇺 Русский](README.ru.md) | [🇬🇧 English](README.md) | [🇨🇳 中文](README.zh.md)

[![CI](https://github.com/fwmakc/aiavatar/actions/workflows/ci.yml/badge.svg)](https://github.com/fwmakc/aiavatar/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-green.svg)](https://nodejs.org/)

A Telegram bot with a modular persona, social intelligence, and a content engine. A digital twin that remembers people, adapts to chats, posts content on schedule, and intervenes in arguments — all via JSON configs without touching the code.

## Features

### 🎭 Modular Persona
The bot's entire personality lives in JSON files, not code. Change name, style, interests, views, and content sources without restarting.

- **`data/default.json`** — base persona
- **`data/chats/{chatId}.json`** — override for a specific chat
- **`data/personal_chats/{userId}.json`** — special persona for DMs with a specific person

### 👥 Social Intelligence
- **User profiles** — `data/users/{userId}.json`: how to address them, what to know
- **Relationship system** — dynamic score (−5..+5) per-chat per-user. The bot remembers who is a friend and who is not
- **Tone analysis** — AI detects the interlocutor's mood and adjusts the response
- **TIT FOR TAT** — worse relationship = more sarcastic bot. Good relationship = warmth and friendship
- **Reconciliation mode** — in DMs with negative score the bot suggests making peace
- **Psychological profile** — `/profile` command builds a user profile from chat history

### 📰 Content Engine
An adaptive scheduler posts content only when the chat is idle:
- **News** — RSS feeds, configurable per-chat
- **Jokes** — Bash.im + JokeAPI + AI fallback
- **Quizzes** — AI-generated questions on given topics
- **Wellness reminders** — light challenges for health
- **Deduplication** — never posts the same content twice
- **Quiet hours** — no spam at night or on weekends

### 🛡️ Moderation & Protection
- **Topic guard** — blocks off-topic requests in DMs
- **Guard check** — validates whether a request fits the chat topic
- **Ban system** — 2 guard denials = 24-hour local ban
- **Rate limiting** — limits proactive replies in groups (not replies/mentions)

### 💬 Group Chat Behavior
- **Screening** — AI decides if the conversation is interesting enough to join
- **Intervention** — steps in when conflict escalates (2+ negative messages in a row)
- **Reactions** — 25% chance to add an emoji reaction
- **Context** — AI sees the last N messages, not just the current one

### ⚙️ Technical
- **Hot reload** — changes in `data/` are picked up without restart
- **Anthropic-compatible API** — works with Kimi, Claude and others via `/messages`
- **HTTP proxy** — proxy support for Telegram API in blocked regions
- **TypeScript + Vite** — built into a single SSR bundle
- **Dual AI API** — supports both Anthropic `/messages` and OpenAI `/chat/completions`

## Quick Start

```bash
# 1. Clone
npm install

# 2. Configure environment
cp .env.example .env
# edit .env — add your tokens

# 3. Fill configs
cp data/users/example.json data/users/123456789.json
cp data/personal_chats/example.json data/personal_chats/123456789.json

# 4. Build and run
npm run build
npm start

# Or for development
npm run dev
```

## Docker

```bash
# Build and run with docker-compose
docker-compose up -d

# Or build manually
docker build -t aiavatar .
docker run -d --env-file .env -v ./data:/app/data aiavatar
```

## Config Structure

```
data/
  default.json              # Base bot persona
  chats/
    1001234567890.json      # Chat overrides (ID without the minus)
  users/
    123456789.json          # Social profile of a person
  personal_chats/
    123456789.json          # Persona for DMs with this person
  relationships.json        # Dynamic relationships (do not commit)
```

### `data/default.json`

| Field | Description |
|---|---|
| `name` | Bot name |
| `language` | Language of communication — bot always replies in it |
| `specialization` | Who they are professionally / in life |
| `interests` | Cultural code, hobbies |
| `views` | Worldview, position in arguments |
| `style` | Communication style (friendly, sarcastic, formal...) |
| `contentSources.news` | List of RSS feeds for news |
| `contentSources.jokes.bashRss` | Bash.im RSS |
| `contentSources.jokes.jokeApiUrl` | JokeAPI URL |
| `contentSources.jokes.fallbackPrompt` | Prompt for AI jokes |
| `contentSources.quiz.topics` | Topics for quizzes |
| `contentSources.challenges.topics` | Topics for wellness reminders |
| `schedule.quietHours` | Quiet hours (start/end in HH:MM) |
| `schedule.quietDays` | Quiet days (0 = Sunday) |

### `data/chats/{chatId}.json`

Overrides any fields from `default.json` for a specific chat. Telegram chat IDs start with `-100...`, but the minus is **omitted** in the filename.

### `data/users/{userId}.json`

```json
{
  "appeals": ["Vanya", "Vanka"],
  "notes": "Friend from university. Likes to argue about types."
}
```

### `data/personal_chats/{userId}.json`

```json
{
  "persona": {
    "specialization": "Grandson who helps with the phone",
    "style": "Patient, gentle",
    "interests": "Gardening, cooking, Soviet movies",
    "views": "Respect the older generation"
  }
}
```

Applied **only in DMs**. Priority: `chats` > `personal_chats` > `default`.

## Environment Variables

See [`.env.example`](.env.example).

| Variable | Description |
|---|---|
| `TELEGRAM_BOT_TOKEN` | Token from @BotFather |
| `BOT_USERNAME` | Bot username without @ |
| `AI_BASE_URL` | Anthropic-compatible endpoint |
| `AI_API_KEY` | API key |
| `AI_MODEL` | Model name |
| `AI_TEMPERATURE` | Response temperature (0.0–1.0+) |
| `AI_MAX_TOKENS` | Token limit |
| `AI_API_FORMAT` | API format: `anthropic` (default) or `openai` |
| `PROXY_URL` | HTTP proxy for Telegram |
| `ALLOWED_USERS` | Allowed user IDs/usernames (comma-separated) |
| `GROUP_ACTIVE_MODE` | Enable proactive replies in groups |
| `GROUP_SCREENING_INTERVAL_MIN` | Group screening interval |
| `GROUP_CONTEXT_LIMIT` | Message context depth |
| `GROUP_REPLY_LIMIT_PER_HOUR` | Proactive reply limit per hour |
| `GUARD_ENABLED` | Enable guard/topic checks |
| `TIT_FOR_TAT_MODE` | Enable dynamic relationships |
| `CONTENT_ENGINE_ENABLED` | Enable content engine |
| `BAN_DURATION_HOURS` | Ban duration (hours) |

## DM Commands

- `/profile` — show psychological profile
- `/reconcile` — reconciliation mode (auto-enabled when score < 0)

## CI & Releases

- **CI** — checked on every PR: `npm ci` → `npm run build`
- **Release** — publish to npm on git tag `v*`. Requires `NPM_TOKEN` in GitHub Secrets.

```bash
npm version patch   # or minor / major
git push --follow-tags
```

## License

Apache 2.0 — see [LICENSE](LICENSE).
