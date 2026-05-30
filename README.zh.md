# AIAvatar

[🇷🇺 Русский](README.ru.md) | [🇬🇧 English](README.md) | [🇨🇳 中文](README.zh.md)

一个具有模块化人格、社交智能和内容引擎的 Telegram 机器人。数字分身，能够记住用户、适应聊天环境、按计划发布内容并介入争论——全部通过 JSON 配置文件实现，无需修改代码。

## 功能

### 🎭 模块化人格
机器人的全部人格存在于 JSON 文件中，而非代码中。无需重启即可更改姓名、风格、兴趣、观点和内容来源。

- **`data/default.json`** — 基础人格
- **`data/chats/{chatId}.json`** — 特定聊天的覆盖配置
- **`data/personal_chats/{userId}.json`** — 与特定用户私聊时的特殊人格

### 👥 社交智能
- **用户档案** — `data/users/{userId}.json`：如何称呼、需要了解什么
- **关系系统** — 按聊天和用户维度的动态分数（−5..+5），映射到 5 个命名情感阶段。机器人记得谁是朋友，谁不是
- **语气分析** — AI 识别对话者情绪并调整回复
- **以牙还牙** — 关系越差，机器人越讽刺；关系越好，越温暖友好
- **和解模式** — 私聊中分数为负时，机器人主动提议和解
- **心理画像** — `/profile` 命令基于聊天历史生成用户画像

### 📰 内容引擎
自适应调度器仅在聊天空闲时发布内容：
- **新闻** — 可按聊天配置的 RSS 源
- **笑话** — Bash.im + JokeAPI + AI 后备生成
- **测验** — 按给定主题由 AI 生成问题
- **健康提醒** — 轻度健康挑战
- **去重** — 同一内容不会发布两次
- **安静时段** — 夜间和周末不打扰

### 🛡️ 审核与保护
- **主题守护** — 私聊中拦截离题请求
- **守护检查** — 验证请求是否符合聊天主题
- **封禁系统** — 2 次守护拒绝 = 24 小时本地封禁
- **速率限制** — 限制群组中的主动回复（不限制回复/提及）

### 💬 群组聊天行为
- **筛选** — AI 判断对话是否有趣到值得参与
- **介入** — 冲突升级时介入（连续 2+ 条负面消息）
- **表情反应** — 25% 概率添加表情反应
- **上下文** — AI 看到最近 N 条消息，而非仅当前消息

### ⚙️ 技术特性
- **热重载** — `data/` 中的更改无需重启即可生效
- **Anthropic 兼容 API** — 通过 `/messages` 支持 Kimi、Claude 等
- **HTTP 代理** — 支持在受限地区通过代理访问 Telegram API
- **TypeScript + Vite** — 构建为单个 SSR 包
- **双 AI API** — 支持 Anthropic `/messages` 和 OpenAI `/chat/completions`

## 快速开始

```bash
# 1. 克隆
npm install

# 2. 配置环境
cp .env.example .env
# 编辑 .env — 添加你的令牌

# 3. 填写配置
cp data/users/example.json data/users/123456789.json
cp data/personal_chats/example.json data/personal_chats/123456789.json

# 4. 构建并运行
npm run build
npm start

# 或用于开发
npm run dev
```

## Docker

```bash
# 使用 docker-compose 构建并运行
docker-compose up -d

# 或手动构建
docker build -t aiavatar .
docker run -d --env-file .env -v ./data:/app/data aiavatar
```

## 配置结构

```
data/
  default.json              # 机器人基础人格
  chats/
    1001234567890.json      # 聊天覆盖配置（ID 不带减号）
  users/
    123456789.json          # 用户的社交档案
  personal_chats/
    123456789.json          # 与该用户私聊时的人格
  relationships.json        # 动态关系（不要提交）
```

### `data/default.json`

| 字段 | 描述 |
|---|---|
| `name` | 机器人姓名 |
| `language` | 交流语言——机器人始终用此语言回复 |
| `specialization` | 职业/生活中的身份 |
| `interests` | 文化代码、爱好 |
| `views` | 世界观、争论中的立场 |
| `style` | 交流风格（友好、讽刺、正式……） |
| `contentSources.news` | 新闻 RSS 源列表 |
| `contentSources.jokes.bashRss` | Bash.im RSS |
| `contentSources.jokes.jokeApiUrl` | JokeAPI URL |
| `contentSources.jokes.fallbackPrompt` | AI 笑话提示词 |
| `contentSources.quiz.topics` | 测验主题 |
| `contentSources.challenges.topics` | 健康提醒主题 |
| `schedule.quietHours` | 安静时段（开始/结束 HH:MM） |
| `schedule.quietDays` | 安静日期（0 = 周日） |
| `personaStages` | 关系动态的情感阶段（见下文） |

#### `personaStages`

每个阶段定义机器人在给定关系分数下对用户的行为方式。如果配置中缺少某个阶段，则使用内置回退。

| 分数 | 阶段 | 含义 |
|---|---|---|
| −5..−4 | `hostile` | 敌人。极致讽刺、冷漠疏离、不提供任何帮助 |
| −3..−2 | `cold` | 不友好。简短回复、克制、略带讽刺 |
| −1..+1 | `neutral` | 中立。基础提示词、礼貌、不套近乎 |
| +2..+3 | `warm` | 熟人。温暖、随意、可以开玩笑和轻微调侃 |
| +4..+5 | `intimate` | 朋友。极致随意、俚语、表情包、亲密语气 |

每个阶段是一个包含可选字段的对象：

```json
{
  "personaStages": {
    "hostile": {
      "style": "极致讽刺、冷漠疏离",
      "restrictions": "不帮助、不解释。只有刻薄话和冷漠。"
    },
    "cold": {
      "style": "克制、略带讽刺",
      "restrictions": "不主动发起对话。简短回复，没有热情。"
    },
    "neutral": {
      "style": "基础交流风格。礼貌，没有多余的情绪",
      "restrictions": "不套近乎，不调侃。只回答问题。"
    },
    "warm": {
      "style": "温暖、随意，可以开玩笑和轻微调侃",
      "restrictions": "可以非正式，但不要进入挚友级别的亲近。"
    },
    "intimate": {
      "style": "极致随意、俚语、表情包、调侃",
      "restrictions": "做自己，但避免人身侮辱。"
    }
  }
}
```

优先级：`chats` > `personal_chats` > `default`。

### `data/chats/{chatId}.json`

覆盖 `default.json` 中任何字段以适配特定聊天。Telegram 聊天 ID 以 `-100...` 开头，但文件名中**省略**减号。

### `data/users/{userId}.json`

```json
{
  "appeals": ["万尼亚", "万卡"],
  "notes": "大学朋友。喜欢争论类型学。"
}
```

### `data/personal_chats/{userId}.json`

```json
{
  "persona": {
    "specialization": "帮奶奶弄手机的孙子",
    "style": "耐心、温柔",
    "interests": "园艺、烹饪、苏联电影",
    "views": "尊重老一辈"
  }
}
```

**仅在私聊中生效**。优先级：`chats` > `personal_chats` > `default`。

## 环境变量

见 [`.env.example`](.env.example)。

| 变量 | 描述 |
|---|---|
| `TELEGRAM_BOT_TOKEN` | 来自 @BotFather 的令牌 |
| `BOT_USERNAME` | 不带 @ 的机器人用户名 |
| `AI_BASE_URL` | Anthropic 兼容端点 |
| `AI_API_KEY` | API 密钥 |
| `AI_MODEL` | 模型名称 |
| `AI_TEMPERATURE` | 回复温度（0.0–1.0+） |
| `AI_MAX_TOKENS` | 令牌上限 |
| `AI_API_FORMAT` | API 格式：`anthropic`（默认）或 `openai` |
| `PROXY_URL` | Telegram 的 HTTP 代理 |
| `ALLOWED_USERS` | 允许的用户 ID/用户名（逗号分隔） |
| `GROUP_ACTIVE_MODE` | 启用群组中的主动回复 |
| `GROUP_SCREENING_INTERVAL_MIN` | 群组筛选间隔 |
| `GROUP_CONTEXT_LIMIT` | 消息上下文深度 |
| `GROUP_REPLY_LIMIT_PER_HOUR` | 每小时主动回复限制 |
| `GUARD_ENABLED` | 启用守护/主题检查 |
| `TIT_FOR_TAT_MODE` | 启用动态关系 |
| `CONTENT_ENGINE_ENABLED` | 启用内容引擎 |
| `BAN_DURATION_HOURS` | 封禁时长（小时） |

## 私聊命令

- `/profile` — 显示心理画像
- `/reconcile` — 和解模式（分数 < 0 时自动启用）

## CI 与发布

- **CI** — 每个 PR 检查：`npm ci` → `npm run build`
- **发布** — 在 git 标签 `v*` 时发布到 npm。需要 GitHub Secrets 中的 `NPM_TOKEN`。

```bash
npm version patch   # 或 minor / major
git push --follow-tags
```

## 许可证

Apache 2.0 — 见 [LICENSE](LICENSE)。
