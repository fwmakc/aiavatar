# 2. Создаём Telegram-бота

Бот создаётся через официального бота @BotFather в Telegram.

## Шаг 1. Создаём бота

1. Откройте [@BotFather](https://t.me/BotFather) в Telegram
2. Отправьте команду `/newbot`
3. BotFather спросит **имя бота** — это отображаемое имя (можно любое, например «Макс» или «Кузя»)
4. BotFather спросит **username** — должно заканчиваться на `bot`, например `my_dev_max_bot` или `family_kuzya_bot`
5. BotFather пришлёт **токен** — длинная строка вида `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

**Запишите токен** — он понадобится в `.env` файле. Не показывайте его никому.

## Шаг 2. Отключаем Group Privacy

По умолчанию бот видит в группах только:
- Сообщения, где бот упомянут (@username)
- Ответы на сообщения бота
- Команды (/start и т.д.)

Нам нужно, чтобы бот видел **все сообщения** — для анализа разговоров, скрининга и реакций.

1. В @BotFather отправьте `/mybots`
2. Выберите вашего бота
3. **Bot Settings** → **Group Privacy**
4. Переключите в **Disabled**
5. BotFather подтвердит: «Privacy mode is disabled»

## Шаг 3. Записываем данные

Вам понадобятся два значения:

| Что | Пример | Куда |
|---|---|---|
| Токен | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` | `TELEGRAM_BOT_TOKEN` в `.env` |
| Username | `my_dev_max_bot` | `BOT_USERNAME` в `.env` (без @) |

---

**Далее:** [Подключаем AI →](03-ai-provider.md)
