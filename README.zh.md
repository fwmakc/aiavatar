# AIAvatar

[🇷🇺 Русский](README.ru.md) | [🇬🇧 English](README.md) | [🇨🇳 中文](README.zh.md)

一个具有模块化人格、社交智能和内容引擎的 Telegram 机器人。数字分身，能够记住用户、适应聊天环境、按计划发布内容并介入争论——全部通过 JSON 配置文件实现，无需修改代码。

## 适用场景

**专为中小型 Telegram 群组（3–50人）设计，适合低到中等活跃度的聊天场景。**

一个机器人实例可以同时服务多个群组，每个群组拥有独立人格——在一个群里是毒舌资深开发者，在另一个群里是贴心的家庭助手。

### 最适合

- **激活沉寂群组** — 在群组空闲时发布新闻、测验和挑战，引发讨论和互动
- **拥有记忆的数字分身** — 通过分层记忆（日→周→月）记住过往对话，识别用户，追踪关系变化
- **缓解毒性行为** — 检测冲突升级，以幽默方式介入，对恶意行为以牙还牙（镜像回应模式）
- **每个群组独立人格** — 通过 JSON 覆盖配置，为每个群组独立设置性格、兴趣、内容来源和发布计划
- **垂直社群** — 开发团队、家庭群、朋友圈、兴趣小组等通用机器人显得格格不入的场景

### 不适用于

- 每分钟数百条消息的大型高吞吐量群组
- 企业级客服自动化
- 替代完整的 RAG / 向量数据库 / 知识管理系统

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
- **内容源** — 统一的内容来源：RSS订阅、JSON API或任何URL。每个源可配置翻译、AI评论或原样发布
- **测验** — 按给定主题由AI生成问题
- **健康提醒** — 轻度健康挑战
- **去重** — 同一内容不会发布两次
- **活跃时段** — 可配置的发布窗口和日期

### 🛡️ 审核与保护
- **主题守护** — 私聊中拦截离题请求
- **守护检查** — 验证请求是否符合聊天主题
- **封禁系统** — 2 次守护拒绝 = 24 小时本地封禁
- **速率限制** — 限制群组中的主动回复（不限制回复/提及）

### 💬 群组聊天行为
- **筛选** — AI 判断对话是否有趣到值得参与
- **介入** — 冲突升级时介入（连续 2+ 条负面消息）
- **表情反应** — 25% 概率添加表情反应
- **上下文** — AI 看到最近 N 条消息以及过往对话的分层记忆摘要

### 🧠 分层记忆
当消息超出上下文窗口时，机器人不会忘记对话。它会像人类一样构建分层记忆：

- **日记忆** — 最近 24 小时的详细摘要
- **短期记忆** — 最近 3 天的压缩摘要
- **周记忆** — 最近一周的要点
- **月记忆** — 最近一个月的精华
- **超过 30 天** — 遗忘

每隔 `GROUP_SCREENING_INTERVAL_MIN` 分钟，AI 会进行整合：新消息 → 日记忆，然后将较旧的层级压缩到下一级。群组和私聊均适用。所有记忆在机器人重启后保留（存储在 SQLite 中）。

### ⚙️ 技术特性
- **SQLite 数据库** — 所有动态数据（关系、档案、封禁、参与度）存储在单个符合 ACID 的 `data/bot.db` 中。无竞态条件、无 JSON 损坏、重启不丢数据
- **热重载** — 人格 JSON 配置无需重启即可生效（300 毫秒防抖，仅使更改的文件缓存失效）
- **Anthropic 兼容 API** — 通过 `/messages` 支持 Kimi、Claude 等
- **HTTP 代理** — 支持在受限地区通过代理访问 Telegram API
- **TypeScript + Vite** — 构建为单个 SSR 包
- **双 AI API** — 支持 Anthropic `/messages` 和 OpenAI `/chat/completions`

## 系统要求

- Node.js 18+

## 安装

1. 克隆仓库：
   ```bash
   git clone https://github.com/fwmakc/aiavatar.git
   cd aiavatar
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 复制并填写 `.env`：
   ```bash
   cp .env.example .env
   ```

4. 构建并运行：
   ```bash
   npm run build
   npm start
   ```

开发模式：
```bash
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
  default.json              # 机器人基础人格（只读，可热重载）
  chats/
    1001234567890.json      # 聊天覆盖配置（ID 不带减号）
  users/
    123456789.json          # 用户的社交档案（只读，可热重载）
  personal_chats/
    123456789.json          # 与该用户私聊时的人格（只读，可热重载）
  bot.db                    # SQLite：关系、档案、封禁、参与度、私聊上下文
  bot.db-shm                # SQLite WAL 共享内存文件
  bot.db-wal                # SQLite WAL 日志文件
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
| `contentSources.feeds` | 内容源数组（见下文） |
| `contentSources.fallbackPrompt` | 所有源失败时的AI提示词 |
| `contentSources.quiz.topics` | 测验主题 |
| `contentSources.challenges.topics` | 健康提醒主题 |
| `schedule.activeHours` | 活跃发布时段（开始/结束，HH:MM） |
| `schedule.activeDays` | 活跃日期（0或7 = 周日，1 = 周一，...，6 = 周六） |
| `schedule.idleThresholdMin` | 发布前需要沉默的分钟数（设置了 contentSources 时必填） |
| `schedule.minIntervalMin` | 两次发布之间的最小分钟数（设置了 contentSources 时必填） |
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
  "specialization": "帮奶奶弄手机的孙子",
  "style": "耐心、温柔",
  "interests": "园艺、烹饪、苏联电影",
  "views": "尊重老一辈"
}
```

**仅在私聊中生效**。优先级：`chats` > `personal_chats` > `default`。

## 内容源

`contentSources.feeds` 中的每个条目是一个对象：

```json
{
  "url": "https://example.com/rss",
  "type": "rss",
  "weight": 5,
  "comment": true,
  "translate": true
}
```

| 字段 | 描述 |
|---|---|
| `url` | 源URL |
| `type` | `rss` 或 `json` |
| `path` | （仅json）点号路径提取文本，如 `"data.joke"` |
| `weight` | 选择权重 1–10（默认5）。越高越容易被选中 |
| `comment` | `true` = AI以机器人风格添加评论 |
| `translate` | `true` = 当内容语言与机器人 `language` 不同时进行翻译 |

如果 `comment` 和 `translate` 都未设置（或为 `false`），内容将原样发布。

## 选择内容源

将以下提示词复制到AI聊天中，替换参数以获取适合你角色的理想内容源：

> 为具有以下特征的Telegram机器人推荐RSS订阅和JSON API：
> - 语言：`<language>`
> - 专业领域：`<specialization>`
> - 兴趣：`<interests>`
> - 交流风格：`<style>`
> - 受众关心的话题：`<topics>`
>
> 对每个源提供：URL、类型（rss或json）、是否需要翻译、AI评论是否有价值。
> 将回答格式化为可直接粘贴到 `contentSources.feeds` 的JSON数组。

## 数据库

所有**动态**数据都存储在 `data/bot.db` 中（SQLite，WAL 模式）。机器人永远不会写入 JSON 文件。

| 表 | 用途 |
|---|---|
| `relationships` | 每个聊天中每个用户的评分（−5..+5）及历史记录 |
| `user_profiles` | 聚合的用户统计信息（消息数、攻击率、表情符号使用等） |
| `social_graph` | 用户之间的有向加权边（冲突 / 友谊） |
| `bans` | 守卫拒绝次数和封禁到期时间戳 |
| `chat_engagement` | 最后消息时间、内容历史、去重缓存、进行中的测验 |
| `private_context` | 私聊对话历史（每个用户保留最近 10 条消息） |
| `memory_buffer` | 超出上下文窗口的消息暂存区，等待摘要处理 |
| `chat_memories` | 分层对话摘要（日 / 3天 / 周 / 月） |

首次启动时，旧版 JSON 文件（`relationships.json`、`user-profiles.json`、`social-graph.json`）会自动导入 SQLite 并重命名为 `*.bak`。

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
| `GROUP_SCREENING_INTERVAL_MIN` | 群组筛选间隔（也用于记忆整合） |
| `GROUP_CONTEXT_LIMIT` | 消息上下文深度 |
| `GROUP_REPLY_LIMIT_PER_HOUR` | 每小时主动回复限制 |
| `GUARD_ENABLED` | 启用守护/主题检查 |
| `TIT_FOR_TAT_MODE` | 启用动态关系 |
| `CONTENT_ENGINE_ENABLED` | 启用内容引擎 |
| `BAN_DURATION_HOURS` | 封禁时长（小时） |

## 私聊命令

- `/profile` — 显示心理画像
- `/reconcile` — 和解模式（分数 < 0 时自动启用）

## 许可证

Apache 2.0 — 见 [LICENSE](LICENSE)。
