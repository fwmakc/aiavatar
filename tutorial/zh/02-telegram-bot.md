# 2. 创建 Telegram 机器人

机器人通过 Telegram 中的官方机器人 @BotFather 创建。

## 步骤 1. 创建机器人

1. 在 Telegram 中打开 [@BotFather](https://t.me/BotFather)
2. 发送命令 `/newbot`
3. BotFather 会询问**机器人名称**——这是显示名称（可以是任何名字，例如"小马"或"库家"）
4. BotFather 会询问**用户名**——必须以 `bot` 结尾，例如 `my_dev_max_bot` 或 `family_kuzya_bot`
5. BotFather 会发送**令牌**——一串长字符，格式如 `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`

**请保存好令牌**——在 `.env` 文件中会用到。不要将其泄露给任何人。

## 步骤 2. 关闭群组隐私模式

默认情况下，机器人在群组中只能看到：
- 提及机器人的消息（@username）
- 回复机器人消息的内容
- 命令（/start 等）

我们需要机器人能看到**所有消息**——用于分析对话、筛选和回应。

1. 在 @BotFather 中发送 `/mybots`
2. 选择你的机器人
3. **Bot Settings** → **Group Privacy**
4. 切换为 **Disabled**
5. BotFather 会确认："Privacy mode is disabled"

## 步骤 3. 记录信息

你需要以下两个值：

| 内容 | 示例 | 写入位置 |
|---|---|---|
| 令牌 | `123456789:ABCdefGHIjklMNOpqrsTUVwxyz` | `.env` 中的 `TELEGRAM_BOT_TOKEN` |
| 用户名 | `my_dev_max_bot` | `.env` 中的 `BOT_USERNAME`（不带 @） |

---

**下一步：** [连接 AI →](03-ai-provider.md)
