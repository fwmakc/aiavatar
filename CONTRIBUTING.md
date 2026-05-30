# Contributing

Thank you for your interest in AIAvatar! This document will help you get started.

## Development Setup

```bash
# Clone the repository
git clone https://github.com/fwmakc/aiavatar.git
cd aiavatar

# Install dependencies
npm install

# Copy and fill environment variables
cp .env.example .env
# Edit .env with your tokens

# Start in development mode
npm run dev
```

## Project Structure

```
src/
  ai/           # AI client, tone analysis, screening
  config/       # Persona and environment configuration
  content/      # Content engine, scheduler, sources
  group/        # Group context and rate limiting
  people/       # User profiles and loader
  relationship/ # Relationship manager
  schedule/     # Activity schedule checker
  social/       # Intervention and personal profiles
  telegram/     # Bot handlers
  types/        # TypeScript types

data/
  default.json              # Base persona
  chats/                    # Per-chat overrides
  users/                    # Social profiles
  personal_chats/           # DM persona overrides
```

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` — new feature
- `fix:` — bug fix
- `docs:` — documentation changes
- `style:` — formatting, missing semicolons, etc.
- `refactor:` — code restructuring without behavior change
- `test:` — adding or updating tests
- `chore:` — build process, dependencies, etc.

Example: `feat: add wellness challenges to content engine`

## Before Submitting a PR

1. Make sure your code passes checks:
   ```bash
   npm run lint
   npm run format
   npm run build
   ```

2. Update relevant documentation if needed

3. Add a clear description of what and why changed

## Code Style

- TypeScript with strict mode
- Prettier for formatting
- ESLint for linting
- Single quotes, trailing commas (ES5), 120 print width

## Questions?

Open an issue or discussion on GitHub.
