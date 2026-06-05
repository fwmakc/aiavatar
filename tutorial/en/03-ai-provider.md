# 3. Connecting AI

The bot uses a neural network for conversation, tone analysis, and content generation. In this guide we'll use **Kimi** (Moonshot AI) — an affordable service with good Russian language support.

## Kimi (Moonshot AI)

### Registration

1. Go to [platform.moonshot.cn](https://platform.moonshot.cn/)
2. Sign up (Google login is supported)
3. Go to the **API Keys** section
4. Click **Create New Key**
5. Copy the key — it starts with `sk-`

### Configuration

Use the following settings for Kimi in `.env`:

```env
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-your-key-here
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4096
```

### Pricing

Kimi is one of the most affordable providers. At the time of writing:
- Input tokens: very cheap
- Output tokens: very cheap
- For a single bot in a single chat, costs typically don't exceed a few dollars per month

## Alternatives

### Anthropic Claude

If you want the highest response quality:

1. Sign up at [console.anthropic.com](https://console.anthropic.com/)
2. Create an API key
3. Configuration:

```env
AI_BASE_URL=https://api.anthropic.com/v1
AI_API_KEY=sk-ant-your-key
AI_MODEL=claude-sonnet-4-20250514
AI_API_FORMAT=anthropic
```

### OpenAI GPT-4o

1. Sign up at [platform.openai.com](https://platform.openai.com/)
2. Create an API key
3. Configuration:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-your-key
AI_MODEL=gpt-4o
AI_API_FORMAT=openai
```

Note: `AI_API_FORMAT=openai` — for OpenAI you must specify the `openai` format.

### Any OpenAI-compatible proxy

If you're using LiteLLM, OpenRouter, or another proxy:

```env
AI_BASE_URL=https://your-proxy.com/v1
AI_API_KEY=your-key
AI_MODEL=model-name
AI_API_FORMAT=openai
```

---

**Next:** [Installation and configuration →](04-install.md)
