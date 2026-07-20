# 0001 — Extension + GitHub Backend Architecture

采用 Chrome/Edge MV3 扩展作为前端，GitHub 仓库作为存储后端，实现个人书签管理及同步。

**背景**：需要一个跨浏览器（Chrome/Edge）的书签管理工具，数据持久化在开发者自己的 GitHub 仓库中，实现多设备同步。

**决策**：浏览器扩展（TypeScript + React + Vite + crxjs）通过 GitHub API 直接读写仓库中的 `bookmarks.json` 文件，使用 Personal Access Token 认证。

**理由**：
- 零服务器运维成本 — GitHub 仓库即是数据存储
- 数据完全由用户掌控 — 可随时 clone 带走
- 内置版本历史 — git 提供天然的变更记录
- 扩展架构轻量 — 无需搭建和运维后台服务

**被排除的方案**：
- 自建同步服务器 — 需要维护服务器，单人用太重
- 第三方云存储（Dropbox/WebDAV）— 依赖外部服务，不能和项目合一
- 纯本地存储 — 无法实现多设备同步
