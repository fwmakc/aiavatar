# 1. Prerequisites

Before you start, make sure you have:

## Node.js 18+

The bot is written in TypeScript and runs on Node.js. Version 18 or higher is required.

Check:
```bash
node --version
```

It should be `v18.x.x` or higher. If not installed — download it from [nodejs.org](https://nodejs.org/).

## Telegram account

You need a regular Telegram account. You'll use it to create a bot via @BotFather.

If Telegram is blocked in your region — you'll need a proxy or VPN. For proxy setup for the bot, see [chapter 12](12-tips.md).

## API key from an AI service

The bot uses a neural network for conversation, tone analysis, and content generation. Any service compatible with the Anthropic API or OpenAI API will work:

| Service | URL | Format | Price |
|---|---|---|---|
| **Kimi** (Moonshot AI) | `https://api.kimi.com/coding/v1` | `anthropic` | Cheap, good Russian |
| **Anthropic Claude** | `https://api.anthropic.com/v1` | `anthropic` | More expensive, higher quality |
| **OpenAI GPT-4o** | `https://api.openpi.com/v1` | `openai` | More expensive |
| Any OpenAI proxy | Your proxy URL | `openai` | Varies |

In [chapter 3](03-ai-provider.md) we'll walk through getting a Kimi API key in detail — it's the simplest and most affordable option.

## Git

For cloning the repository:
```bash
git --version
```

If not installed — download it from [git-scm.com](https://git-scm.com/).

---

**Next:** [Creating a Telegram bot →](02-telegram-bot.md)
