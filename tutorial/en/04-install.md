# 4. Installation and configuration

## Step 1. Clone the repository

```bash
git clone https://github.com/fwmakc/aiavatar.git
cd aiavatar
```

## Step 2. Install dependencies

```bash
npm install
```

## Step 3. Create .env

```bash
cp .env.example .env
```

## Step 4. Fill in .env

Open `.env` in any editor and fill in:

```env
# === Required ===

# Token from @BotFather (chapter 2)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# Bot username without @ (chapter 2)
BOT_USERNAME=my_dev_max_bot

# AI service (chapter 3)
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-your-key
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic

# === Optional ===

# Response temperature (0.0 - formal, 1.0 - creative)
AI_TEMPERATURE=0.7

# Token limit per response
AI_MAX_TOKENS=4096

# Proxy (if Telegram is blocked)
# PROXY_URL=http://user:pass@host:port

# Allowed users (user IDs separated by commas, empty = no one has access)
ALLOWED_USERS=

# === Group behavior ===

# Enable proactive responses in groups
GROUP_ACTIVE_MODE=true

# Group screening interval (minutes)
GROUP_SCREENING_INTERVAL_MIN=60

# Message context depth
GROUP_CONTEXT_LIMIT=10

# Proactive response limit per hour
GROUP_REPLY_LIMIT_PER_HOUR=5

# === Features ===

# Enable guard/topic checks
GUARD_ENABLED=true

# Enable dynamic relationships
TIT_FOR_TAT_MODE=true

# Enable content engine (news, jokes, quizzes)
CONTENT_ENGINE_ENABLED=true

# Ban duration (hours)
BAN_DURATION_HOURS=24
```

### Minimal .env for first run

It's enough to fill in only the required fields:

```env
TELEGRAM_BOT_TOKEN=your_token
BOT_USERNAME=your_username
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-your-key
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
```

Leave the rest as is — the default values work for most cases.

---

**Next:** [Scenario: work assistant →](05-scenario-dev.md)
