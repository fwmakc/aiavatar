# 12. 实用技巧

## 热重载——无需重启即可修改配置

机器人会自动检测 JSON 文件的变更：

- `data/default.json`——基础人格
- `data/chats/{chatId}.json`——聊天配置
- `data/personal_chats/{userId}.json`——个性化人格
- `data/users/{userId}.json`——人物档案

**只需编辑文件并保存**——机器人将在 300 毫秒内应用更改。

`.env` **不支持**热重载——修改环境变量需要重启。

## 代理——如果 Telegram 被屏蔽

在 `.env` 中添加：

```env
PROXY_URL=http://user:password@host:port
```

支持 HTTP 和 SOCKS5 代理。格式：
- HTTP：`http://user:pass@proxy.example.com:8080`
- SOCKS5：`socks5://user:pass@proxy.example.com:1080`

## 更新机器人

```bash
git pull
npm install
npm run build
```

然后重启机器人。数据库（`data/bot.db`）和 JSON 配置不受影响。

## 日志

机器人会在控制台输出所有操作：

```
[Persona] default.json loaded
[ContentEngine] Started (adaptive)
[DM] 123456789: 你好！
[AI] Response sent to 123456789
[Group] chat -1001234567890: screening...
[ContentEngine] chat 1001234567890: posted feed
```

将日志保存到文件：
```bash
npm start 2>&1 | tee bot.log
```

或通过 systemd（如果作为服务运行）——日志自动保存到 `journalctl`。

## 访问控制

### 按用户限制

在 `.env` 中指定允许的 user ID，以逗号分隔：

```env
ALLOWED_USERS=123456789,987654321
```

留空 = 机器人回复所有人。

机器人会自动注册被添加到的聊天。内容引擎仅在已注册的聊天中运行。

## 如何禁用特定功能

全部通过 `.env` 控制：

| 变量 | 禁用内容 |
|---|---|
| `CONTENT_ENGINE_ENABLED=false` | 不发布内容（新闻、笑话、问答） |
| `GROUP_ACTIVE_MODE=false` | 不参与群组对话 |
| `GUARD_ENABLED=false` | 不检查请求主题 |
| `TIT_FOR_TAT_MODE=false` | 关系不影响交流风格 |

## 如何选择最佳内容源

README 中有一个 AI 提示词，可以帮助你为角色挑选合适的 RSS 源和 API。复制该提示词，填入参数——然后将结果粘贴到配置中。

---

**教程到此结束。** 祝你的机器人顺利运行！