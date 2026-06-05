# 2. Creating a Telegram bot

The bot is created through the official @BotFather bot in Telegram.

## Step 1. Create the bot

1. Open [@BotFather](https://t.me/BotFather) in Telegram
2. Send the command `/newbot`
3. BotFather will ask for the **bot name** — this is the display name (can be anything, e.g. "Max" or "Kuzya")
4. BotFather will ask for the **username** — it must end with `bot`, e.g. `my_dev_max_bot` or `family_kuzya_bot`
5. BotFather will send you the **token** — a long string like `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

**Save the token** — you'll need it in the `.env` file. Don't share it with anyone.

## Step 2. Disable Group Privacy

By default, the bot only sees the following in groups:
- Messages where the bot is mentioned (@username)
- Replies to the bot's messages
- Commands (/start, etc.)

We need the bot to see **all messages** — for conversation analysis, screening, and reactions.

1. Send `/mybots` to @BotFather
2. Select your bot
3. **Bot Settings** → **Group Privacy**
4. Switch to **Disabled**
5. BotFather will confirm: "Privacy mode is disabled"

## Step 3. Write down the details

You'll need two values:

| What | Example | Where |
|---|---|---|
| Token | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` | `TELEGRAM_BOT_TOKEN` in `.env` |
| Username | `my_dev_max_bot` | `BOT_USERNAME` in `.env` (without @) |

---

**Next:** [Connecting AI →](03-ai-provider.md)
