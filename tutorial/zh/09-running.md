# 9. 启动与测试

## 首次启动（测试）

首次启动并检查运行状态：

```bash
npm run build
npm start
```

控制台中你会看到：
```
[Persona] default.json loaded
[ContentEngine] Started (adaptive)
Bot @my_dev_max_bot is running
```

如果出现错误——请检查：
- `.env` 是否已填写（特别是 `TELEGRAM_BOT_TOKEN` 和 `AI_API_KEY`）
- `AI_API_FORMAT` 格式是否正确（对于 Kimi——使用 `anthropic`）

**这不是后台模式**——关闭终端后机器人会停止。如需长期运行，请使用 PM2（见下方）或 Docker（[第 10 章](10-docker.md)）。

## 在私聊中测试

1. 在 Telegram 中搜索你的机器人：输入 `@your_username_bot`
2. 点击 **Start** 或发送任意消息
3. 机器人应该以其设定的风格回复

如果机器人没有响应：
- 检查 `ALLOWED_USERS` 是否包含你的 user ID，或留空
- 查看控制台——是否有 AI 请求的错误

## 添加到群组

1. 打开群聊
2. 点击**添加成员** → 通过 username 搜索机器人
3. 机器人将出现在聊天中

### 重要：Group Privacy

如果你没有在[第 2 章](02-telegram-bot.md)中关闭 Group Privacy，机器人只能看到：
- 以 `/` 开头的消息
- @提及机器人的消息（`@username`）
- 回复机器人消息的消息

要让机器人在群组中正常工作，**必须关闭 Group Privacy**。

## 如何确认一切正常

### 在私聊中
- 机器人以其设定的风格回复消息
- `/profile` 命令显示心理画像

### 在群组中
- 机器人能看到所有消息（如果 Group Privacy 已关闭）
- 机器人偶尔参与对话（筛选触发）
- 机器人对某些消息以表情回应
- 安静 45-60 分钟后机器人发布内容（如果 `CONTENT_ENGINE_ENABLED` 已启用）

## 使用 PM2 长期运行

[PM2](https://pm2.keymetrics.io/) 是 Node.js 的进程管理器。在后台启动机器人，崩溃时自动重启，并记录日志。

### 安装

```bash
npm install -g pm2
```

### 启动

```bash
npm run build
pm2 start npm --name aiavatar -- start
```

### 常用命令

```bash
# 查看状态
pm2 status

# 实时查看日志
pm2 logs aiavatar

# 重启
pm2 restart aiavatar

# 停止
pm2 stop aiavatar

# 从 PM2 中删除
pm2 delete aiavatar
```

### 服务器重启后自动启动

```bash
pm2 startup
pm2 save
```

PM2 会输出一条类似 `sudo env PATH=... pm2 startup ...` 的命令——执行它。之后：
- `pm2 save`——保存当前进程列表
- 服务器重启时 PM2 会自动启动所有保存的进程

### 更新机器人

```bash
git pull
npm install
npm run build
pm2 restart aiavatar
```

## systemd

PM2 的替代方案——使用 systemd（大多数 Linux 发行版内置）。

创建文件 `/etc/systemd/system/aiavatar.service`：

```ini
[Unit]
Description=AIAvatar Telegram Bot
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/aiavatar
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
EnvironmentFile=/path/to/aiavatar/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable aiavatar
sudo systemctl start aiavatar
sudo journalctl -u aiavatar -f
```

## 开发模式运行

如果你想修改代码并实时看到变化而无需重新构建：

```bash
npm run dev
```

机器人将通过 `tsx watch` 启动，当 `src/` 目录中的文件发生变化时会自动重新加载。

---

**下一篇：** [Docker →](10-docker.md)