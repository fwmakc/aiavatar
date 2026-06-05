# 10. Docker

项目中已包含现成的 `Dockerfile` 和 `docker-compose.yml`——无需在服务器上安装 Node.js，即可在容器中运行机器人。

## 包含内容

**Dockerfile**——多阶段构建：
1. `builder`——安装依赖并构建项目（`npm run build`）
2. `production`——仅包含运行时依赖和 `dist/` 的最小镜像

**docker-compose.yml**——启动容器时：
- 将 `data/` 挂载为 volume（配置和数据库持久保存）
- 读取 `.env` 作为环境变量
- 自动重启（`restart: unless-stopped`）

## 快速开始

### 1. 确认已安装 Docker

```bash
docker --version
docker compose version
```

### 2. 启动

```bash
docker compose up -d
```

这将构建镜像并在后台启动容器。

### 3. 查看日志

```bash
docker compose logs -f
```

你可以实时查看机器人的日志。按 `Ctrl+C` 退出查看（机器人将继续运行）。

## 管理

```bash
# 查看容器状态
docker compose ps

# 查看日志
docker compose logs -f

# 重启
docker compose restart

# 停止
docker compose down

# 完全重新构建（更新后）
docker compose up -d --build
```

## 更新机器人

```bash
git pull
docker compose up -d --build
```

容器将使用新的依赖和代码重新构建。`data/` 中的数据会保留——它们以 volume 方式挂载。

## Volume 结构

```
./data/              → /app/data/      (配置、数据库)
```

这意味着：
- `data/default.json`、`data/chats/`、`data/users/`——在主机上编辑，机器人即时感知变更（热重载）
- `data/bot.db`——SQLite 数据库，保存在主机上
- `.env`——由 docker-compose 读取并作为环境变量传入

## 配置

所有配置通过 `.env` 文件进行（如[第 4 章](04-install.md)所述）。Docker-compose 会自动读取该文件。

如需覆盖个别变量而不修改 `.env`：

```bash
AI_MODEL=gpt-4o docker compose up -d
```

---

**下一篇：** [人物档案 →](11-users.md)