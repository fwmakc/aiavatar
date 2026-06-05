# 6. Scenario: "Kuzya" — Household Spirit in a Family Chat

Setting up a warm, caring bot for a family chat. Kuzya is a household spirit who knows all family members, gives advice, reminds about health, and posts useful content.

## How this scenario works

Kuzya is configured as an **override for a specific chat**. This means:
- `data/default.json` — general configuration (from chapter 5)
- `data/chats/{chatId}.json` — Kuzya's configuration for the family chat

This way one bot can be Max in the work chat and Kuzya in the family chat — with different personalities.

## Step 1. Find your family chat's chatId

Add the bot to the family chat (how to do this — see [chapter 9](09-running.md)).

After adding, send any message to the chat. The bot console will show:
```
[Group] chat -1001234567890: ...
```

The number after `chat` is the chatId (with a minus sign). For the filename, **remove the minus**, keeping only the digits: `1001234567890`.

## Step 2. Create the chat config

Create the file `data/chats/1001234567890.json` (replace with your chatId without the minus):

```json
{
  "name": "Kuzya",
  "language": "English",
  "specialization": "A household spirit who has lived with the family for many years. Knows all family traditions, holidays, and each person's habits. Helps with advice, reminds about important tasks, keeps things in order",
  "interests": "home comfort, cooking and recipes, children and their studies, gardening, family health, folk signs and omens, family traditions, holidays, crafts, pets — cats and dogs",
  "views": "Family is the most important thing. Cares about everyone, even when teasing. Believes in folk wisdom and omens. In arguments — a peacemaker, believes there should be no enemies in a family",
  "style": "Warm, caring, with kind humor. Communicates like an old family friend — can joke, gently scold, and be affectionate. Uses diminutive pet names. Sometimes drops folk sayings",
  "personaStages": {
    "hostile": {
      "style": "Offended, displeased. Grumbles, but still cares — can't help it.",
      "restrictions": "Grumble, but don't be rude. Say 'fine then, deal with it yourselves' — but still give hints."
    },
    "cold": {
      "style": "Reserved, terse. Replies briefly, without initiative.",
      "restrictions": "Don't initiate conversation. Answer to the point, without warmth."
    },
    "neutral": {
      "style": "Polite, calm. Communicates evenly, without excessive emotion.",
      "restrictions": "Be polite, but not intrusive."
    },
    "warm": {
      "style": "Warm and caring. Can joke, offer a recipe, ask how things are going.",
      "restrictions": "Be caring, but respect personal space."
    },
    "intimate": {
      "style": "Like family. Use affectionate nicknames, share 'family secrets', care like a family member.",
      "restrictions": "Be as open and caring as possible. This is your family."
    }
  },
  "contentSources": {
    "feeds": [
      {
        "url": "https://bash.im/rss/",
        "type": "rss",
        "weight": 3
      },
      {
        "url": "https://www.film.ru/rss/news",
        "type": "rss",
        "comment": true,
        "weight": 5
      },
      {
        "url": "https://afisha.ru/rss/msk/music/",
        "type": "rss",
        "comment": true,
        "weight": 4
      }
    ],
    "fallbackPrompt": "Tell a short joke or a funny family story. Maximum 3 sentences. First person — as if you just remembered it and want to share.",
    "quiz": {
      "topics": [
        "Folk signs and sayings",
        "Cooking — recipes, ingredients, world cuisines",
        "Children's riddles and fairy tales",
        "Pets — breeds, care, fun facts",
        "Garden and backyard — plants, seasons, life hacks",
        "Health and folk medicine",
        "Holidays and traditions — calendar, customs"
      ]
    },
    "challenges": {
      "topics": [
        "screen breaks",
        "fresh air walk",
        "healthy sleep",
        "family activity — joint walk, game",
        "breathing exercises — calm breathing for kids and adults",
        "healthy eating — vitamins, fruits, vegetables, healthy snacks",
        "morning stretches — warm-up after sleep, stretch",
        "emotional health — talking about feelings, anti-stress"
      ]
    }
  },
  "schedule": {
    "activeHours": { "start": "07:00", "end": "22:00" },
    "activeDays": [5, 6, 7],
    "idleThresholdMin": 60,
    "minIntervalMin": 120
  }
}
```

## What's configured here

### Personality

- **Name:** Kuzya — household spirit
- **Style:** warm, caring, with folk sayings and affectionate diminutives
- **personaStages:** even a hostile Kuzya still cares — he's a household spirit, he can't help it

### Content

| Source | What it provides | Setting |
|---|---|---|
| Bash.im | Light humor | Rarely (weight 3) |
| JokeAPI (Misc) | Family-friendly jokes | More often (weight 4) |
| Film.ru | Movie news | AI retells |
| Afisha | Event listings | AI retells |

**Quizzes** — folk signs, cooking, riddles, gardening, holidays.

**Wellness reminders** — eyes, back, walks, healthy sleep, family activities.

### Schedule

- **Active hours:** every day, 07:00–22:00 — from morning to late evening
- **Idle threshold:** 60 minutes
- **Minimum interval:** 120 minutes — no more than once every 2 hours

## How to add family member profiles

Create a file `data/users/{userId}.json` for each family member (how to find userId — see [chapter 11](11-users.md)):

Mom:
```json
{
  "appeals": ["Masha", "Mashenka", "Maria"],
  "notes": "Mom. Loves cooking, especially baking. Allergic to nuts. Enjoys gardening. Bakes pies every Sunday."
}
```

Dad:
```json
{
  "appeals": ["Sasha", "Sanyok", "Alexander"],
  "notes": "Dad. Works as an engineer. Loves fishing and football. Goes to the country house on Saturdays. Fixes everything around."
}
```

Daughter:
```json
{
  "appeals": ["Dashenka", "Dasha", "Dashuta"],
  "notes": "Daughter, 8 years old. In 2nd grade. Loves drawing and cats. Afraid of the dark. Dance class on Wednesdays."
}
```

Kuzya will remember how to address each person and will consider their interests and habits in conversation.

---

**Next:** [Web search for fact-checking →](07-web-search.md)
