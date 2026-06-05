# 11. User profiles

Profiles allow the bot to remember who's who — how to address them, what to know, and the relationship.

## How to find a user ID

### Method 1: via a bot

Add [@userinfobot](https://t.me/userinfobot) to your chat with the bot. Forward a message from the person — it will show their user ID.

### Method 2: via the console

When someone messages the bot, the console displays:
```
[DM] 123456789: Hello!
```
The number after `[DM]` is the user ID.

### Method 3: via the Telegram API

Send any message to the bot, then open in your browser:
```
https://api.telegram.org/botYOUR_TOKEN/getUpdates
```
Find `"from":{"id":123456789}` — that's the user ID.

## How to find a group's chat ID

Send a message to the group where the bot is added, then:
```
https://api.telegram.org/botYOUR_TOKEN/getUpdates
```
Find `"chat":{"id":-1001234567890}` — that's the chat ID (with the minus sign).

For the config file name, **remove the minus**: `1001234567890`.

## Creating a profile

Create a file `data/users/{userId}.json`:

```json
{
  "appeals": ["Sasha", "Sashka"],
  "notes": "Frontend developer. Loves React and TypeScript. Drinks a lot of coffee. Plays board games on Fridays."
}
```

### Fields

| Field | Description | Example |
|---|---|---|
| `appeals` | How to address the person | `["Sasha", "Sashka", "Alexander"]` |
| `notes` | What to know about the person | `"Frontend dev, loves React"` |

The bot will use `appeals` for addressing and `notes` for context in conversations.

## Profile examples

### Colleague (for the "Max" scenario)

```json
{
  "appeals": ["Vanya", "Vanka"],
  "notes": "Backend developer in Python. Loves arguing about types. Linux fan. Starts every morning reading Hacker News."
}
```

### Family member (for the "Kuzya" scenario)

```json
{
  "appeals": "Dasha",
  "notes": "8-year-old daughter. In 2nd grade. Loves drawing and cats. Has dance class on Wednesdays. Afraid of the dark."
}
```

## Personal personality in DMs

This is covered in detail in [chapter 8](08-personal-chats.md) — there are examples for a child, a grandmother, and a colleague.

In short: create `data/personal_chats/{userId}.json` so the bot interacts with a specific person in DMs in a special way. This **does not affect** group conversations.

## Relationships

The bot automatically builds relationships with each person:

- **Score from −5 to +5** — depends on how the person interacts with the bot
- **TIT FOR TAT:** if you're rude to the bot, it responds coldly; if you help, it responds warmly
- **5 stages:** hostile → cold → neutral → warm → intimate

Relationships are stored in the database (`data/bot.db`) and require no manual configuration.

---

**Next:** [Useful tips →](12-tips.md)
