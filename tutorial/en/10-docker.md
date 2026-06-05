# 10. Docker

The project includes a ready-to-use `Dockerfile` and `docker-compose.yml` — you can run the bot in a container without installing Node.js on your server.

## What's inside

**Dockerfile** — multi-stage build:
1. `builder` — installs dependencies and builds the project (`npm run build`)
2. `production` — minimal image with only runtime dependencies and `dist/`

**docker-compose.yml** — launches the container with:
- `data/` mounted as a volume (configs and database are persisted)
- `.env` read for environment variables
- Automatic restart (`restart: unless-stopped`)

## Quick start

### 1. Make sure Docker is installed

```bash
docker --version
docker compose version
```

### 2. Launch

```bash
docker compose up -d
```

This will build the image and start the container in the background.

### 3. Check

```bash
docker compose logs -f
```

You'll see the bot's logs in real time. Press `Ctrl+C` to exit the log view (the bot will keep running).

## Management

```bash
# Container status
docker compose ps

# Logs
docker compose logs -f

# Restart
docker compose restart

# Stop
docker compose down

# Full rebuild (after an update)
docker compose up -d --build
```

## Updating the bot

```bash
git pull
docker compose up -d --build
```

The container will be rebuilt with the new dependencies and code. Data in `data/` is preserved — it's mounted as a volume.

## Volume structure

```
./data/              → /app/data/      (configs, database)
```

What this means:
- `data/default.json`, `data/chats/`, `data/users/` — edit on the host, the bot sees changes (hot reload)
- `data/bot.db` — SQLite database, persisted on the host
- `.env` — read by docker-compose and passed as environment variables

## Configuration

All settings are configured via the `.env` file (as described in [chapter 4](04-install.md)). Docker-compose reads it automatically.

If you need to override individual variables without modifying `.env`:

```bash
AI_MODEL=gpt-4o docker compose up -d
```

---

**Next:** [User profiles →](11-users.md)
