# 7. Web Search for Fact-Checking

The bot can search the web before answering factual questions. This eliminates hallucinations — the AI sees real data and sources.

## When search is triggered

Search does **NOT** happen on every message. It only triggers when **all** conditions are met simultaneously:

1. **Direct address** — the bot is personally addressed (reply, mention, or DM). Regular group messages do not trigger it
2. **Message looks like a question** — contains `?` or question words (what, how, why, which, where, what, how...)
3. **Enabled in config** — `webSearch.enabled: true` for this chat
4. **API key present** — `SERPER_API_KEY` or `BRAVE_API_KEY` in `.env`

Greetings, jokes, discussions, small talk — none of these trigger search. Only direct questions.

## Scenario: legal consultant

Imagine a lawyers' chat where the bot acts as a consulting colleague. Without fact-checking, AI might fabricate an article number or a non-existent link. With search — it first finds the real article, then formulates the answer.

### 1. Get an API key

Sign up at [Serper.dev](https://serper.dev) (Google results) or [Brave Search](https://brave.com/search/api/) (free tier: 2000/month).

Add the key to `.env`:

```env
SERPER_API_KEY=your_key_here
```

### 2. Create a chat config

File `data/chats/{chatId}.json` for the lawyers' chat:

```json
{
  "name": "Legal Advisor",
  "language": "Russian",
  "specialization": "Practicing lawyer with 15 years of experience. Specializing in civil and labor law",
  "interests": "Legal practice, court precedents, legislative changes",
  "views": "The law is paramount. Arguments are based on legal norms, not emotions",
  "style": "Professional, precise, but not overly dry. Can explain complex things in simple language",
  "webSearch": {
    "enabled": true,
    "provider": "serper"
  },
  "contentSources": {
    "feeds": [
      { "url": "https://rg.ru/rss/", "type": "rss", "comment": true, "weight": 7 },
      { "url": "https://pravo.ru/rss/", "type": "rss", "comment": true, "weight": 6 }
    ],
    "quiz": {
      "topics": [
        "Civil Code — key articles",
        "Labor Code — rights and obligations",
        "Criminal law — elements of crimes",
        "Administrative law — fines and violations",
        "Court practice — interesting rulings",
        "Inheritance law — succession orders, wills",
        "Family Code — marriage, divorce, alimony",
        "Housing law — rights of owners and tenants"
      ]
    },
    "challenges": {
      "topics": [
        "screen break — eye exercises",
        "neck and back stretches",
        "reminder to drink water",
        "fresh air walk"
      ]
    }
  },
  "schedule": {
    "activeHours": { "start": "09:00", "end": "20:00" },
    "activeDays": [1, 2, 3, 4, 5],
    "idleThresholdMin": 120,
    "minIntervalMin": 180
  }
}
```

### 3. How it works in practice

User asks: *"What is the liability for delayed salary?"*

1. Bot determines: direct address + question → trigger search
2. Search: `"liability for delayed salary"` → top 3 results from ConsultantPlus, Garant, pravo.ru
3. Results are added to the prompt: *"Web search results: Article 236 of the Labor Code..."*
4. AI formulates the answer based on real data and naturally weaves in a link

User asks: *"How are you?"* — search does **not** trigger, the bot responds as usual.

### 4. Two providers

| Provider | Results | Price | Key in .env |
|---|---|---|---|
| `serper` | Google | $50/50k requests | `SERPER_API_KEY` |
| `brave` | Brave Search | 2000/month free | `BRAVE_API_KEY` |

Specify the provider in the config: `"provider": "serper"` or `"provider": "brave"`.

---

**Next:** [Persona in DMs →](08-personal-chats.md)