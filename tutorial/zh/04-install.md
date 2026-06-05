# 4. 安装与配置

## 步骤 1. 克隆仓库

```bash
git clone https://github.com/fwmakc/aiavatar.git
cd aiavatar
```

## 步骤 2. 安装依赖

```bash
npm install
```

## 步骤 3. 创建 .env 文件

```bash
cp .env.example .env
```

## 步骤 4. 填写 .env

用任意编辑器打开 `.env` 并填写：

```env
# === 必填项 ===

# 来自 @BotFather 的令牌（第 2 章）
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz

# 机器人的用户名，不带 @（第 2 章）
BOT_USERNAME=my_dev_max_bot

# AI 服务（第 3 章）
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-你的密钥
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic

# === 可选项 ===

# 回复温度（0.0 - 正式，1.0 - 有创意）
AI_TEMPERATURE=0.7

# 每次回复的 token 上限
AI_MAX_TOKENS=4096

# 代理（如果 Telegram 被封锁）
# PROXY_URL=http://user:pass@host:port

# 允许的用户（用逗号分隔的用户 ID，留空 = 无人有权访问）
ALLOWED_USERS=

# === 群组行为 ===

# 启用群组中的主动回复
GROUP_ACTIVE_MODE=true

# 群组筛选间隔（分钟）
GROUP_SCREENING_INTERVAL_MIN=60

# 消息上下文深度
GROUP_CONTEXT_LIMIT=10

# 每小时主动回复上限
GROUP_REPLY_LIMIT_PER_HOUR=5

# === 功能 ===

# 启用 guard/topic 检查
GUARD_ENABLED=true

# 启用动态关系
TIT_FOR_TAT_MODE=true

# 启用内容引擎（新闻、笑话、问答）
CONTENT_ENGINE_ENABLED=true

# 封禁时长（小时）
BAN_DURATION_HOURS=24
```

### 首次启动的最小 .env 配置

只需填写必填字段：

```env
TELEGRAM_BOT_TOKEN=你的令牌
BOT_USERNAME=你的用户名
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-你的密钥
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
```

其余保持默认值即可——默认值适用于大多数情况。

---

**下一步：** [场景：工作助手 →](05-scenario-dev.md)
