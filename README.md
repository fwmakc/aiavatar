# AIAvatar

[🇷🇺 Русский](README.ru.md) | [🇬🇧 English](README.md) | [🇨🇳 中文](README.zh.md)

[![CI](https://github.com/fwmakc/aiavatar/actions/workflows/ci.yml/badge.svg)](https://github.com/fwmakc/aiavatar/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-Apache%202.0-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D24-green.svg)](https://nodejs.org/)

A Telegram bot with a modular persona, social intelligence, and a content engine. A digital twin that remembers people, adapts to chats, posts content on schedule, and intervenes in arguments — all via JSON configs without touching the code.

## Who is this for?

**Designed for small to medium Telegram groups (3–50 people) with low to moderate activity.**

A single bot instance can serve multiple chats, each with its own personality — a cynical senior dev in one chat, a caring family helper in another.

### Perfect for

- **Reviving quiet chats** — posts news, quizzes, and challenges when the chat goes idle, sparking discussion and engagement
- **Digital twin with memory** — remembers past conversations via tiered memory (day → week → month), recognizes people, tracks relationships
- **Moderating toxicity** — detects escalating conflicts, intervenes with humor, mirrors bad behavior back at offenders (tit-for-tat mode)
- **Different personas per chat** — configure personality, interests, content sources, and schedule independently for each group via JSON overrides
- **Niche communities** — developer teams, family chats, friend circles, interest groups where a generic bot feels out of place

### Not designed for

- High-throughput groups with thousands of active users sending hundreds of messages per minute
- Enterprise-grade support automation or customer service
- Replacement for full RAG / vector database / knowledge management systems

## Features

### 🎭 Modular Persona
The bot's entire personality lives in JSON files, not code. Change name, style, interests, views, and content sources without restarting.

- **`data/default.json`** — base persona
- **`data/chats/{chatId}.json`** — override for a specific chat
- **`data/personal_chats/{userId}.json`** — special persona for DMs with a specific person

### 👥 Social Intelligence
- **User profiles** — `data/users/{userId}.json`: how to address them, what to know
- **Relationship system** — dynamic score (−5..+5) per-chat per-user, mapped to 5 named emotional stages. The bot remembers who is a friend and who is not
- **Tone analysis** — AI detects the interlocutor's mood and adjusts the response
- **TIT FOR TAT** — worse relationship = more sarcastic bot. Good relationship = warmth and friendship
- **Reconciliation mode** — in DMs with negative score the bot suggests making peace
- **Psychological profile** — `/profile` command builds a user profile from chat history

### 📰 Content Engine
An adaptive scheduler posts content only when the chat is idle:
- **Feeds** — unified content sources: RSS feeds, JSON APIs, or any URL. Each source can be configured to translate, add AI commentary, or post as-is
- **Quizzes** — AI-generated questions on given topics
- **Wellness reminders** — light challenges for health
- **Deduplication** — never posts the same content twice
- **Active hours** — configurable posting window and days

### 🛡️ Moderation & Protection
- **Topic guard** — blocks off-topic requests in DMs
- **Guard check** — validates whether a request fits the chat topic
- **Ban system** — 2 guard denials = 24-hour local ban
- **Rate limiting** — limits proactive replies in groups (not replies/mentions)

### 💬 Group Chat Behavior
- **Screening** — AI decides if the conversation is interesting enough to join
- **Intervention** — steps in when conflict escalates (2+ negative messages in a row)
- **Reactions** — 25% chance to add an emoji reaction
- **Context** — AI sees the last N messages plus tiered memory summaries of past conversations

### 🧠 Tiered Memory
The bot doesn't forget conversations when messages scroll out of the context window. Instead, it builds layered memories — like a human:

- **Day memory** — detailed summary of the last 24 hours
- **Short memory** — compressed summary of the last 3 days
- **Week memory** — key points from the last week
- **Month memory** — only the essentials from the last month
- **Older than 30 days** — forgotten

Every `GROUP_SCREENING_INTERVAL_MIN` minutes, AI consolidates: new messages → day memory, then older tiers are compressed into the next level. Works for both groups and DMs. All memories survive bot restarts (stored in SQLite).

### ⚙️ Technical
- **SQLite database** — all dynamic data (relationships, profiles, bans, engagement) lives in a single ACID-compliant `data/bot.db`. No race conditions, no JSON corruption, no data loss on restart
- **Hot reload** — persona JSON configs are picked up without restart (300ms debounced, granular per-file invalidation)
- **Anthropic-compatible API** — works with Kimi, Claude and others via `/messages`
- **HTTP proxy** — proxy support for Telegram API in blocked regions
- **TypeScript + Vite** — built into a single SSR bundle
- **Dual AI API** — supports both Anthropic `/messages` and OpenAI `/chat/completions`

## Requirements

- Node.js 18+

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/fwmakc/aiavatar.git
   cd aiavatar
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy and fill in `.env`:
   ```bash
   cp .env.example .env
   ```

4. Build and run:
   ```bash
   npm run build
   npm start
   ```

For development:
```bash
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
  default.json              # Base bot persona (read-only, hot-reloadable)
  chats/
    1001234567890.json      # Chat overrides (ID without the minus)
  users/
    123456789.json          # Social profile of a person (read-only, hot-reloadable)
  personal_chats/
    123456789.json          # Persona for DMs with this person (read-only, hot-reloadable)
  bot.db                    # SQLite: relationships, profiles, bans, engagement, DM context
  bot.db-shm                # SQLite WAL shared-memory file
  bot.db-wal                # SQLite WAL journal
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
| `contentSources.feeds` | Array of feed sources (see below) |
| `contentSources.fallbackPrompt` | AI prompt when all feeds fail |
| `contentSources.quiz.topics` | Topics for quizzes |
| `contentSources.challenges.topics` | Topics for wellness reminders |
| `schedule.activeHours` | Active posting window (start/end in HH:MM) |
| `schedule.activeDays` | Active days (0 or 7 = Sunday, 1 = Monday, ..., 6 = Saturday) |
| `schedule.idleThresholdMin` | Minutes of silence before posting (required if contentSources set) |
| `schedule.minIntervalMin` | Minimum minutes between posts (required if contentSources set) |
| `personaStages` | Emotional stages for relationship dynamics (see below) |

#### `personaStages`

Each stage defines how the bot behaves toward a user at a given relationship score. If a stage is missing from the config, a built-in fallback is used.

| Score | Stage | Meaning |
|---|---|---|
| −5..−4 | `hostile` | Enemy. Maximum sarcasm, cold distance, no help |
| −3..−2 | `cold` | Unfriendly. Short replies, restrained, slight sarcasm |
| −1..+1 | `neutral` | Neutral. Default base prompt, polite, no familiarity |
| +2..+3 | `warm` | Acquaintance. Warm, informal, can joke and tease lightly |
| +4..+5 | `intimate` | Friend. Maximum informality, slang, memes, close tone |

Each stage is an object with optional fields:

```json
{
  "personaStages": {
    "hostile": {
      "style": "Maximum sarcasm, cold distance",
      "restrictions": "Do not help or explain. Only barbs and detachment."
    },
    "cold": {
      "style": "Restrained, slightly sarcastic",
      "restrictions": "Do not initiate conversation. Short replies, no enthusiasm."
    },
    "neutral": {
      "style": "Base communication style",
      "restrictions": "No familiarity, no teasing. Just answer the question."
    },
    "warm": {
      "style": "Warm, informal, can joke and tease lightly",
      "restrictions": "Be informal but don't cross into close-friend territory."
    },
    "intimate": {
      "style": "Maximum informality, slang, memes, teasing",
      "restrictions": "Be yourself, but avoid personal insults."
    }
  }
}
```

Priority: `chats` > `personal_chats` > `default`.

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
  "specialization": "Grandson who helps with the phone",
  "style": "Patient, gentle",
  "interests": "Gardening, cooking, Soviet movies",
  "views": "Respect the older generation"
}
```

Applied **only in DMs**. Priority: `chats` > `personal_chats` > `default`.

## Feed Sources

Each entry in `contentSources.feeds` is an object:

```json
{
  "url": "https://example.com/rss",
  "type": "rss",
  "weight": 5,
  "comment": true,
  "translate": true
}
```

| Field | Description |
|---|---|
| `url` | Feed URL |
| `type` | `rss` or `json` |
| `path` | (json only) dot-notation path to extract text, e.g. `"data.joke"` |
| `weight` | Selection weight 1–10 (default 5). Higher = more likely to be picked |
| `comment` | `true` = AI adds a casual commentary in bot's style |
| `translate` | `true` = translate if content language differs from bot's `language` |

If both `comment` and `translate` are omitted (or `false`), content is posted as-is.

## Choosing Content Sources

Copy this prompt into an AI chat, replacing the parameters to get ideal feed sources for your persona:

> Suggest RSS feeds and JSON APIs for a Telegram bot with these characteristics:
> - Language: `<language>`
> - Specialization: `<specialization>`
> - Interests: `<interests>`
> - Communication style: `<style>`
> - Topics the audience cares about: `<topics>`
>
> For each source provide: URL, type (rss or json), whether it needs translation, and whether AI commentary would add value.
> Format the response as a JSON array ready to paste into `contentSources.feeds`.

## Database

All **dynamic** data is stored in `data/bot.db` (SQLite, WAL mode). The bot never writes to JSON files.

| Table | Purpose |
|---|---|
| `relationships` | Per-chat per-user scores (−5..+5) with history |
| `user_profiles` | Aggregated user stats (message count, aggression rate, emoji usage, etc.) |
| `social_graph` | Directed weighted edges between users (conflict / friendship) |
| `bans` | Guard denials and ban expiry timestamps |
| `chat_engagement` | Last message time, content history, deduplication cache, active quiz |
| `private_context` | DM conversation history (last 10 messages per user) |
| `memory_buffer` | Staging area for messages pushed out of context window, awaiting summarization |
| `chat_memories` | Tiered conversation summaries (day / short / week / month) |

On first startup, legacy JSON files (`relationships.json`, `user-profiles.json`, `social-graph.json`) are automatically imported into SQLite and renamed to `*.bak`.

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
| `GROUP_SCREENING_INTERVAL_MIN` | Group screening interval (also used for memory consolidation) |
| `GROUP_CONTEXT_LIMIT` | Message context depth |
| `GROUP_REPLY_LIMIT_PER_HOUR` | Proactive reply limit per hour |
| `GUARD_ENABLED` | Enable guard/topic checks |
| `TIT_FOR_TAT_MODE` | Enable dynamic relationships |
| `CONTENT_ENGINE_ENABLED` | Enable content engine |
| `BAN_DURATION_HOURS` | Ban duration (hours) |

## DM Commands

- `/profile` — show psychological profile
- `/reconcile` — reconciliation mode (auto-enabled when score < 0)

## License

Apache 2.0 — see [LICENSE](LICENSE).
