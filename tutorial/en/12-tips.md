# 12. Useful tips

## Hot reload — change config without restarting

The bot automatically picks up changes in JSON files:

- `data/default.json` — base personality
- `data/chats/{chatId}.json` — chat config
- `data/personal_chats/{userId}.json` — personal personality
- `data/users/{userId}.json` — user profiles

**Just edit the file and save** — the bot applies changes within 300 ms.

`.env` **does not support** hot reload — changing environment variables requires a restart.

## Proxy — if Telegram is blocked

Add to `.env`:

```env
PROXY_URL=http://user:password@host:port
```

HTTP and SOCKS5 proxies are supported. Formats:
- HTTP: `http://user:pass@proxy.example.com:8080`
- SOCKS5: `socks5://user:pass@proxy.example.com:1080`

## Updating the bot

```bash
git pull
npm install
npm run build
```

Then restart the bot. The database (`data/bot.db`) and JSON configs are not affected.

## Logging

The bot logs all its actions to the console:

```
[Persona] default.json loaded
[ContentEngine] Started (adaptive)
[DM] 123456789: Hello!
[AI] Response sent to 123456789
[Group] chat -1001234567890: screening...
[ContentEngine] chat 1001234567890: posted feed
```

To save logs to a file:
```bash
npm start 2>&1 | tee bot.log
```

Or via systemd (if running as a service) — the journal is automatically saved to `journalctl`.

## Access control

### Restrict by users

In `.env`, specify allowed user IDs separated by commas:

```env
ALLOWED_USERS=123456789,987654321
```

An empty value means the bot responds to everyone.

The bot automatically registers chats it's added to. The content engine only runs in registered chats.

## How to disable individual features

Everything is controlled via `.env`:

| Variable | What it disables |
|---|---|
| `CONTENT_ENGINE_ENABLED=false` | Stops posting content (news, jokes, quizzes) |
| `GROUP_ACTIVE_MODE=false` | Stops intervening in group conversations |
| `GUARD_ENABLED=false` | Stops checking request topics |
| `TIT_FOR_TAT_MODE=false` | Relationships no longer affect communication style |

## How to find the perfect content sources

The README includes an AI prompt that helps you find RSS feeds and APIs suited to your persona. Copy it, fill in the parameters — and paste the result into the config.

---

**This concludes the tutorial.** Good luck with your bot!
