# 7. 网页搜索用于事实核查

机器人可以在回答事实性问题之前先进行网络搜索。这样可以避免幻觉——AI 可以看到真实的数据和来源。

## 搜索何时触发

搜索**不会**在每条消息时都触发。只有在**同时**满足以下所有条件时才会触发：

1. **直接对话**——机器人被直接提及（回复、@提及或私聊）。普通群组消息不会触发
2. **消息类似问题**——包含 `?` 或疑问词（什么、怎么、为什么、哪个、where、what、how...）
3. **配置中已启用**——该聊天设置了 `webSearch.enabled: true`
4. **有 API 密钥**——`.env` 中配置了 `SERPER_API_KEY` 或 `BRAVE_API_KEY`

问候、玩笑、讨论、闲聊——这些**不会**触发搜索。只有直接提问才会。

## 场景：法律顾问

想象一个律师聊天群，机器人在其中扮演顾问同事的角色。没有事实核查，AI 可能会编造法条编号或不存在的链接。有了搜索功能——它会先找到真实的法条，然后再组织回答。

### 1. 获取 API 密钥

在 [Serper.dev](https://serper.dev)（Google 搜索结果）或 [Brave Search](https://brave.com/search/api/)（免费额度 2000 次/月）注册。

将密钥添加到 `.env`：

```env
SERPER_API_KEY=your_key_here
```

### 2. 创建聊天配置

律师群的配置文件 `data/chats/{chatId}.json`：

```json
{
  "name": "法律顾问",
  "language": "中文",
  "specialization": "拥有15年从业经验的执业律师。专攻民法和劳动法",
  "interests": "法律实务、判例、法律法规变化",
  "views": "法律高于一切。以法律条文为依据论证观点，而非情绪",
  "style": "专业、准确，但不枯燥。能用通俗的语言解释复杂问题",
  "webSearch": {
    "enabled": true,
    "provider": "serper"
  },
  "contentSources": {
    "feeds": [
      { "url": "https://rg.ru/rss/", "type": "rss", "comment": true, "weight": 7 },
      { "url": "https://pravo.ru/rss/", "type": "rss", "comment": true, "weight": 6 }
    ],
    "quiz": {
      "topics": [
        "民法典——关键条款",
        "劳动法——权利与义务",
        "刑法——犯罪构成",
        "行政法——罚款与违规",
        "司法实践——典型案例",
        "继承法——继承顺序、遗嘱",
        "婚姻家庭法——结婚、离婚、赡养费",
        "住房法——业主和承租人的权利"
      ]
    },
    "challenges": {
      "topics": [
        "远离屏幕休息——眼保健操",
        "颈部和背部拉伸",
        "提醒喝水",
        "户外散步"
      ]
    }
  },
  "schedule": {
    "activeHours": { "start": "09:00", "end": "20:00" },
    "activeDays": [1, 2, 3, 4, 5],
    "idleThresholdMin": 120,
    "minIntervalMin": 180
  }
}
```

### 3. 实际运行效果

用户提问：*"拖欠工资有什么法律责任？"*

1. 机器人判断：直接对话 + 问题 → 启动搜索
2. 搜索：`"拖欠工资的法律责任"` → 排名前 3 的结果来自法律数据库、法条查询网站等
3. 搜索结果被加入提示词：*"Web search results: 第236条..."*
4. AI 基于真实数据组织回答，并自然地融入来源链接

用户提问：*"最近怎么样？"* —— 搜索**不会**触发，机器人正常回答。

### 4. 两个搜索服务商

| 服务商 | 搜索结果 | 价格 | .env 中的密钥 |
|---|---|---|---|
| `serper` | Google | $50/5万次请求 | `SERPER_API_KEY` |
| `brave` | Brave Search | 每月 2000 次免费 | `BRAVE_API_KEY` |

在配置中指定服务商：`"provider": "serper"` 或 `"provider": "brave"`。

---

**下一篇：** [私聊中的个性化角色 →](08-personal-chats.md)