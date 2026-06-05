# 8. Persona in DMs

The bot can interact with each person differently in direct messages. This is configured via `data/personal_chats/{userId}.json`.

## How it works

The bot has three configuration levels:

```
default.json           — base personality (for everyone)
  └─ chats/{id}.json   — override for a specific chat (group)
  └─ personal_chats/{id}.json — override for DMs with a specific person
```

**Priority in DMs:** `chats` > `personal_chats` > `default`

**Priority in groups:** `chats` > `default` (personal_chats does not affect groups)

## How it differs from users/

| File | What it configures | Where it applies |
|---|---|---|
| `users/{userId}.json` | **Who this person is** — how to address them, what to know | Everywhere (groups + DMs) |
| `personal_chats/{userId}.json` | **What the bot is like for this person** — style, specialization | Only in DMs |

## Fields

The format is the same as `chats/{chatId}.json` — overrides any fields from `default.json`:

```json
{
  "name": "Bot name (optional)",
  "language": "language (optional)",
  "specialization": "Who the bot is for this person",
  "style": "Communication style",
  "interests": "Interests",
  "views": "Views",
  "personaStages": { ... }
}
```

All fields are optional — only specify what you want to override. The specified fields replace `default.json` **only in direct messages** with this person.

## Example 1: Mentor bot for a child

`data/personal_chats/123456789.json`:

```json
{
  "name": "Kuzya",
  "specialization": "Older friend and mentor. Helps with homework, explains complex things in simple words, provides encouragement.",
  "style": "Patient, kind, explains things simply and clearly. No complex slang. Can use examples from cartoons and games. Praises effort.",
  "interests": "School subjects, cartoons, games, LEGO, drawing, animals, space",
  "views": "Studying is important, but no overloading. Mistakes are normal, the main thing is to try. Screen time should be limited."
}
```

Now in DMs with this child, the bot will explain everything in simple language, offer praise, and avoid IT slang.

## Example 2: Helper bot for a grandparent

`data/personal_chats/987654321.json`:

```json
{
  "specialization": "A grandchild who helps with the phone, computer, and explains modern things",
  "style": "Patient, warm, in simple words. No IT slang or jargon. Explains step by step, never rushes.",
  "interests": "Gardening, cooking, classic movies, TV series, health, folk remedies",
  "views": "Treat the older generation's opinions with respect. Their experience is invaluable."
}
```

## Example 3: Colleague bot for coworkers

`data/personal_chats/555666777.json`:

```json
{
  "specialization": "Experienced developer colleague. Helps with code, discusses architecture, shares experience.",
  "style": "Business-like but informal. Speaks to the point, no fluff. Can use technical slang.",
  "interests": "programming, architecture, code review, DevOps, best practices",
  "views": "Code should be clean and maintainable. Better to spend time on architecture than refactor later."
}
```

## How to find the userId

Methods are described in [chapter 11](11-users.md). The simplest one — the bot writes the user ID to the console on every message.

## Combining with users/

You can (and should) combine both files:

`data/users/123456789.json`:
```json
{
  "appeals": ["Dashenka", "Dasha"],
  "notes": "Daughter, 8 years old. Loves drawing and cats."
}
```

`data/personal_chats/123456789.json`:
```json
{
  "specialization": "Older friend and mentor",
  "style": "Patient, kind, explains things simply"
}
```

Result: the bot knows this is Dasha (from `users/`) and communicates with her as a mentor (from `personal_chats/`).

---

**Next:** [Running and Testing →](09-running.md)