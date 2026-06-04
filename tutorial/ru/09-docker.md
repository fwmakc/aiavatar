# 9. Docker

В проекте есть готовый `Dockerfile` и `docker-compose.yml` — можно запустить бота в контейнере без установки Node.js на сервер.

## Что внутри

**Dockerfile** — multi-stage сборка:
1. `builder` — ставит зависимости и собирает проект (`npm run build`)
2. `production` — минимальный образ только с runtime-зависимостями и `dist/`

**docker-compose.yml** — запускает контейнер с:
- Монтированием `data/` как volume (конфиги и база данных сохраняются)
- Чтением `.env` для переменных окружения
- Автоматическим перезапуском (`restart: unless-stopped`)

## Быстрый старт

### 1. Убедитесь что Docker установлен

```bash
docker --version
docker compose version
```

### 2. Запустите

```bash
docker compose up -d
```

Это соберёт образ и запустит контейнер в фоне.

### 3. Проверьте

```bash
docker compose logs -f
```

Вы увидите логи бота в реальном времени. Нажмите `Ctrl+C` чтобы выйти из просмотра (бот продолжит работать).

## Управление

```bash
# Статус контейнера
docker compose ps

# Логи
docker compose logs -f

# Перезапуск
docker compose restart

# Остановка
docker compose down

# Полная пересборка (после обновления)
docker compose up -d --build
```

## Обновление бота

```bash
git pull
docker compose up -d --build
```

Контейнер пересоберётся с новыми зависимостями и кодом. Данные в `data/` сохранятся — они примонтированы как volume.

## Структура volumes

```
./data/              → /app/data/      (конфиги, база данных)
```

Что это значит:
- `data/default.json`, `data/chats/`, `data/users/` — редактируете на хосте, бот видит изменения (hot reload)
- `data/bot.db` — база данных SQLite, сохраняется на хосте
- `.env` — читается docker-compose и передаётся как переменные окружения

## Настройка

Все настройки — через `.env` файл (как описано в [главе 4](04-install.md)). Docker-compose автоматически читает его.

Если нужно переопределить отдельные переменные без изменения `.env`:

```bash
AI_MODEL=gpt-4o docker compose up -d
```

---

**Далее:** [Профили людей →](10-users.md)
