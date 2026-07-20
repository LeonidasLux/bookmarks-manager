# Bookmarks Manager

浏览器书签管理器——Chrome/Edge 扩展，以 GitHub 仓库为后端存储和同步个人书签。

## Language

**Bookmark**:
一个浏览器书签条目，包含标题、URL、文件夹、标签和时间戳。
_Avoid_: 收藏夹、链接

**Extension**:
运行在 Chrome/Edge 浏览器中的 Manifest V3 扩展，是用户与书签交互的前端。基于 TypeScript + React + Vite + crxjs 构建。
_Avoid_: 插件、应用

**Sync**:
扩展与 GitHub 仓库之间双向同步书签数据的过程。
_Avoid_: 备份、上传

**GitHub Backend**:
以 Git 仓库为存储后端的同步机制，扩展通过 GitHub API 读写 `bookmarks.json`。
_Avoid_: 服务器、云存储

**PAT (Personal Access Token)**:
用于扩展访问 GitHub API 的认证凭证，由用户在 GitHub 设置中生成后填入扩展配置。
_Avoid_: 密码、API 密钥

**Sync Strategy**:
同步引擎在推送前从 GitHub 拉取最新数据，在本地合并后推回。遇到冲突时以最新 `updatedAt` 为准。三种触发方式：浏览器启动时自动同步、后台定时同步（可配置间隔，默认 6 小时）、手动触发同步。
_Avoid_: 单向同步

**Auto Sync (on start)**:
扩展在 `service worker` 初始化时自动执行一次完整同步。
_Avoid_: 启动加载

**Periodic Sync**:
由 `chrome.alarms` API 触发定时同步，默认间隔 6 小时，用户可在设置页面调整。
_Avoid_: 轮询

**Manual Sync**:
用户在扩展弹窗中点击"同步"按钮手动触发同步。
_Avoid_: 刷新

## Project Structure

```
bookmarks-manager/
├── bookmarks.json
├── src/
│   ├── extension/
│   │   ├── popup/
│   │   ├── options/
│   │   ├── background/
│   │   └── manifest.json
│   └── shared/
│       ├── types.ts
│       └── sync.ts
├── vite.config.ts
├── package.json
└── tsconfig.json
```
