# 3. 连接 AI

机器人使用神经网络进行对话、语气分析和内容生成。本教程使用 **Kimi**（Moonshot AI）——一个性价比高且中文质量优秀的服务。

## Kimi (Moonshot AI)

### 注册

1. 访问 [platform.moonshot.cn](https://platform.moonshot.cn/)
2. 注册账号（支持 Google 登录）
3. 进入 **API Keys** 页面
4. 点击 **Create New Key**
5. 复制密钥——以 `sk-` 开头

### 配置

在 `.env` 中为 Kimi 使用以下参数：

```env
AI_BASE_URL=https://api.kimi.com/coding/v1
AI_API_KEY=sk-你的密钥
AI_MODEL=kimi-latest
AI_API_FORMAT=anthropic
AI_TEMPERATURE=0.7
AI_MAX_TOKENS=4096
```

### 费用

Kimi 是最经济实惠的服务商之一。截至本教程编写时：
- 输入 token：非常便宜
- 输出 token：非常便宜
- 一个机器人在一个聊天中的月费用通常不超过几美元

## 替代方案

### Anthropic Claude

如果你追求最高质量的回答：

1. 在 [console.anthropic.com](https://console.anthropic.com/) 注册
2. 创建 API 密钥
3. 配置：

```env
AI_BASE_URL=https://api.anthropic.com/v1
AI_API_KEY=sk-ant-你的密钥
AI_MODEL=claude-sonnet-4-20250514
AI_API_FORMAT=anthropic
```

### OpenAI GPT-4o

1. 在 [platform.openai.com](https://platform.openai.com/) 注册
2. 创建 API 密钥
3. 配置：

```env
AI_BASE_URL=https://api.openai.com/v1
AI_API_KEY=sk-你的密钥
AI_MODEL=gpt-4o
AI_API_FORMAT=openai
```

注意：`AI_API_FORMAT=openai`——使用 OpenAI 时必须指定格式为 `openai`。

### 任意 OpenAI 兼容代理

如果你使用 LiteLLM、OpenRouter 或其他代理：

```env
AI_BASE_URL=https://你的代理.com/v1
AI_API_KEY=你的密钥
AI_MODEL=模型名称
AI_API_FORMAT=openai
```

---

**下一步：** [安装与配置 →](04-install.md)
