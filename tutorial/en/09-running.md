# 9. Running and Testing

## First run (testing)

For the first run and to verify everything works:

```bash
npm run build
npm start
```

In the console you will see:
```
[Persona] default.json loaded
[ContentEngine] Started (adaptive)
Bot @my_dev_max_bot is running
```

If you see an error instead — check:
- Whether `.env` is filled in (especially `TELEGRAM_BOT_TOKEN` and `AI_API_KEY`)
- Whether `AI_API_FORMAT` is set correctly (for Kimi — `anthropic`)

**This is not a background mode** — the bot will stop when you close the terminal. For persistent operation use PM2 (below) or Docker ([chapter 10](10-docker.md)).

## Testing in DMs

1. Find your bot in Telegram: type `@your_username_bot` in the search
2. Press **Start** or send any message
3. The bot should respond in its own style

If the bot is silent:
- Check that `ALLOWED_USERS` contains your user ID or leave it empty
- Check the console — are there any AI request errors

## Adding to a group

1. Open the group chat
2. Click **Add member** → find the bot by username
3. The bot will appear in the chat

### Important: Group Privacy

If you did not disable Group Privacy in [chapter 2](02-telegram-bot.md), the bot will only see:
- Messages starting with `/`
- Messages where the bot is mentioned (`@username`)
- Replies to the bot's messages

For the bot to work fully in a group, **Group Privacy must be disabled**.

## How to verify everything works

### In DMs
- The bot responds to messages in its own style
- The `/profile` command shows a psychological portrait

### In a group
- The bot sees all messages (if Group Privacy is disabled)
- The bot occasionally chimes in on conversations (screening)
- The bot reacts with emojis to some messages
- After 45-60 minutes of silence, the bot posts content (if `CONTENT_ENGINE_ENABLED` is on)

## Persistent operation via PM2

[PM2](https://pm2.keymetrics.io/) is a process manager for Node.js. It runs the bot in the background, automatically restarts on crashes, and manages logs.

### Installation

```bash
npm install -g pm2
```

### Starting

```bash
npm run build
pm2 start npm --name aiavatar -- start
```

### Useful commands

```bash
# Status
pm2 status

# Real-time logs
pm2 logs aiavatar

# Restart
pm2 restart aiavatar

# Stop
pm2 stop aiavatar

# Remove from PM2
pm2 delete aiavatar
```

### Auto-start on server reboot

```bash
pm2 startup
pm2 save
```

PM2 will output a command like `sudo env PATH=... pm2 startup ...` — run it. After that:
- `pm2 save` — saves the current process list
- On server reboot, PM2 will automatically start all saved processes

### Updating the bot

```bash
git pull
npm install
npm run build
pm2 restart aiavatar
```

## systemd

An alternative to PM2 is using systemd (built into most Linux distributions).

Create the file `/etc/systemd/system/aiavatar.service`:

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

## Development mode

If you want to modify the code and see changes without rebuilding:

```bash
npm run dev
```

The bot will start via `tsx watch` and automatically reload when files in `src/` change.

---

**Next:** [Docker →](10-docker.md)