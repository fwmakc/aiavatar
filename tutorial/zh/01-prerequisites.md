# 1. 准备工作

开始之前，请确保你具备以下条件：

## Node.js 18+

机器人使用 TypeScript 编写，通过 Node.js 运行。需要 18 或更高版本。

检查版本：
```bash
node --version
```

应显示 `v18.x.x` 或更高版本。如未安装——请从 [nodejs.org](https://nodejs.org/) 下载。

## Telegram 账号

需要一个普通的 Telegram 账号。你将通过 @BotFather 创建机器人。

如果 Telegram 在你所在地区被封锁——需要使用代理或 VPN。关于为机器人配置代理——参见[第 12 章](12-tips.md)。

## AI 服务的 API 密钥

机器人使用神经网络进行对话、语气分析和内容生成。支持任何兼容 Anthropic API 或 OpenAI API 的服务：

| 服务 | URL | 格式 | 价格 |
|---|---|---|---|
| **Kimi** (Moonshot AI) | `https://api.kimi.com/coding/v1` | `anthropic` | 便宜，中文质量好 |
| **Anthropic Claude** | `https://api.anthropic.com/v1` | `anthropic` | 较贵，质量更高 |
| **OpenAI GPT-4o** | `https://api.openpi.com/v1` | `openai` | 较贵 |
| 任意 OpenAI 代理 | 你的代理 URL | `openai` | 视情况而定 |

在[第 3 章](03-ai-provider.md)中，我们将详细介绍如何获取 Kimi 的 API 密钥——这是最简单、最经济的选择。

## Git

用于克隆仓库：
```bash
git --version
```

如未安装——请从 [git-scm.com](https://git-scm.com/) 下载。

---

**下一步：** [创建 Telegram 机器人 →](02-telegram-bot.md)
