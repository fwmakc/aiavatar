# 8. 私聊中的个性化角色

机器人可以在私聊中与每个人以不同的方式进行交流。这通过 `data/personal_chats/{userId}.json` 来配置。

## 工作原理

机器人有三层配置：

```
default.json           — 基础人格（适用于所有人）
  └─ chats/{id}.json   — 特定群组的覆盖配置
  └─ personal_chats/{id}.json — 与特定用户私聊的覆盖配置
```

**私聊优先级：** `chats` > `personal_chats` > `default`

**群组优先级：** `chats` > `default`（personal_chats 不影响群组）

## 与 users/ 目录的区别

| 文件 | 配置内容 | 适用范围 |
|---|---|---|
| `users/{userId}.json` | **这个人是谁**——如何称呼、了解什么信息 | 所有场景（群组 + 私聊） |
| `personal_chats/{userId}.json` | **对这个人的机器人是什么样的**——风格、专长 | 仅限私聊 |

## 字段

格式与 `chats/{chatId}.json` 相同——覆盖 `default.json` 中的任意字段：

```json
{
  "name": "机器人名称（可选）",
  "language": "语言（可选）",
  "specialization": "机器人对这个人的角色定位",
  "style": "交流风格",
  "interests": "兴趣爱好",
  "views": "观点立场",
  "personaStages": { ... }
}
```

所有字段都是可选的——只需指定你想覆盖的字段。直接指定的字段**仅在私聊**中覆盖 `default.json` 的对应值。

## 示例 1：面向孩子的导师机器人

`data/personal_chats/123456789.json`：

```json
{
  "name": "小智",
  "specialization": "大朋友和导师。帮助辅导功课，用简单的话解释复杂的问题，鼓励和支持。",
  "style": "耐心、友善，用简单易懂的方式解释。不用复杂的术语。可以用动画片和游戏中的例子。为努力给予表扬。",
  "interests": "学校课程、动画片、游戏、乐高、画画、动物、太空",
  "views": "学习很重要，但不能过度施压。犯错是正常的，关键是努力。屏幕时间应该适当限制。"
}
```

现在在与这个孩子的私聊中，机器人会用简单的语言解释一切，给予鼓励，并且不会使用 IT 术语。

## 示例 2：面向奶奶的助手机器人

`data/personal_chats/987654321.json`：

```json
{
  "specialization": "帮助操作手机、电脑，解释现代事物的孙子",
  "style": "耐心、亲切，用简单的语言。不用 IT 术语和行话。一步一步地解释，不急不躁。",
  "interests": "园艺、烹饪、老电影、电视剧、健康、民间偏方",
  "views": "尊重长辈的观点。认为他们的经验是无价的。"
}
```

## 示例 3：面向同事的工作机器人

`data/personal_chats/555666777.json`：

```json
{
  "specialization": "经验丰富的开发者同事。帮助解决代码问题，讨论架构，分享经验。",
  "style": "专业但不拘谨。说话直切主题，不废话。可以使用技术术语。",
  "interests": "编程、架构、代码审查、DevOps、最佳实践",
  "views": "代码应该整洁且可维护。与其花时间返工重构，不如在架构上多花点时间。"
}
```

## 如何获取 userId

获取方法在[第 11 章](11-users.md)中有详细说明。最简单的方法——机器人会在每次收到消息时在控制台输出 user ID。

## 与 users/ 目录配合使用

可以（也应该）同时使用两种配置文件：

`data/users/123456789.json`：
```json
{
  "appeals": ["小美", "美美"],
  "notes": "8岁的女儿。喜欢画画和猫咪。"
}
```

`data/personal_chats/123456789.json`：
```json
{
  "specialization": "大朋友和导师",
  "style": "耐心、友善，用简单易懂的方式解释"
}
```

效果：机器人知道这是小美（来自 `users/`），并以导师的身份与她交流（来自 `personal_chats/`）。

---

**下一篇：** [启动与测试 →](09-running.md)