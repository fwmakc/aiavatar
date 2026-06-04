# 3. Подключаем AI

Бот использует нейросеть для общения, анализа тона и генерации контента. В этом руководстве мы используем **Kimi** (Moonshot AI) — бюджетный сервис с хорошим русским языком.

## Kimi (Moonshot AI)

### Регистрация

1. Перейдите на [platform.moonshot.cn](https://platform.moonshot.cn/)
2. Зарегистрируйтесь (поддерживается вход через Google)
3. Перейдите в раздел **API Keys**
4. Нажмите **Create New Key**
5. Скопируйте ключ — он начинается с `sk-`

### Настройка

Для Kimi используйте следующие параметры в `.env`:

```env
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-ваш-ключ-здесь
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4096
```

### Стоимость

Kimi — один из самых доступных провайдеров. На момент написания руководства:
- Входящие токены: очень дёшево
- Исходящие токены: очень дёшево
- Для одного бота в одном чате расходы обычно не превышают несколько долларов в месяц

## Альтернативы

### Anthropic Claude

Если вы хотите максимальное качество ответов:

1. Зарегистрируйтесь на [console.anthropic.com](https://console.anthropic.com/)
2. Создайте API-ключ
3. Настройка:

```env
AI_BASE_URL=https://api.anthropic.com/v1
AI_API_KEY=sk-ant-ваш-ключ
AI_MODEL=claude-sonnet-4-20250514
AI_API_FORMAT=anthropic
```

### OpenAI GPT-4o

1. Зарегистрируйтесь на [platform.openai.com](https://platform.openai.com/)
2. Создайте API-ключ
3. Настройка:

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-ваш-ключ
AI_MODEL=gpt-4o
AI_API_FORMAT=openai
```

Обратите внимание: `AI_API_FORMAT=openai` — для OpenAI нужно обязательно указать формат `openai`.

### Любой OpenAI-совместимый прокси

Если вы используете LiteLLM, OpenRouter или другой прокси:

```env
AI_BASE_URL=https://ваш-прокси.com/v1
AI_API_KEY=ваш-ключ
AI_MODEL=имя-модели
AI_API_FORMAT=openai
```

---

**Далее:** [Установка и настройка →](04-install.md)
