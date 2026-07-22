<p align="center">
  <br>
  <img width="200" src="./public/icon128.png" alt="Bookmarks Manager logo" />
  <br>
  <h1 align="center">Bookmarks Manager</h1>
  <p align="center">
    以 GitHub 仓库为后端的浏览器书签管理器扩展
    <br />
    <strong>Chrome / Edge · Manifest V3 · TypeScript + React</strong>
  </p>
</p>

<p align="center">
  <a href="https://github.com/LeonidasLux/bookmarks-manager/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
  <a href="https://github.com/LeonidasLux/bookmarks-manager">
    <img src="https://img.shields.io/github/package-json/v/LeonidasLux/bookmarks-manager" alt="Version" />
  </a>
  <img src="https://img.shields.io/badge/Manifest-v3-8A2BE2" alt="Manifest V3" />
  <img src="https://img.shields.io/badge/pnpm-%3E%3D11.2-orange" alt="pnpm" />
</p>

---

## 📖 概述

**Bookmarks Manager** 是一款 Chrome / Edge 浏览器扩展，将你的浏览器书签与 GitHub 仓库双向同步。书签数据以 `bookmarks.json` 文件存储在 Git 仓库中，你可以：

- 在**多台电脑**之间保持书签一致
- 通过 GitHub 的版本历史追溯书签变更
- 配合 CI/CD 或其他工具对书签数据进行二次处理

> **术语提醒**：本项目使用「书签」指代 Bookmark、「扩展」指代 Extension、「同步」指代双向 Sync 过程 —— 相关术语定义参见 [CONTEXT.md](./CONTEXT.md)。

---

## ✨ 功能

| 功能 | 说明 |
|------|------|
| 📂 **书签浏览** | 树形文件夹导航 + 面包屑路径，快速浏览所有书签 |
| 📥 **拉取同步** | 从 GitHub 拉取远程书签，与本地差异对比后**选择性应用** |
| 📤 **推送同步** | 将本地书签强制推送到 GitHub，覆盖远程数据 |
| 🔍 **差异审核** | 拉取后按「新增/删除/修改」分组展示变更，可逐条勾选应用 |
| 🗑 **空文件夹清理** | 同步后自动删除变空的文件夹（可关闭） |
| ⏰ **自动同步** | 浏览器启动时自动同步 + 后台定时同步（默认 6 小时间隔） |
| ⚙️ **可配置** | GitHub Token、仓库信息、同步间隔等完全可自定义 |
| 📌 **快捷保存** | 弹窗中一键将当前页面保存到书签 |

---

## 🖼️ 截图

<table>
  <tr>
    <td align="center"><strong>弹窗主页</strong></td>
    <td align="center"><strong>差异审核</strong></td>
    <td align="center"><strong>设置页面</strong></td>
  </tr>
  <tr>
    <td><img src="./.github/screenshots/popup.png" width="280" alt="弹窗主页" /></td>
    <td><img src="./.github/screenshots/diff-review.png" width="280" alt="差异审核" /></td>
    <td><img src="./.github/screenshots/options.png" width="280" alt="设置页面" /></td>
  </tr>
</table>

> ⚠️ 截图文件尚未生成，首次使用前请创建 `.github/screenshots/` 目录并放入截图。

---

## 🚀 快速开始

### 安装扩展

由于尚未上架 Chrome 网上应用店，需要通过开发者模式加载：

1. **构建扩展**
   ```bash
   git clone https://github.com/LeonidasLux/bookmarks-manager.git
   cd bookmarks-manager
   pnpm install
   pnpm build
   ```

2. **加载到浏览器**
   - Chrome: 地址栏访问 `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选择 `dist/` 目录
   - Edge: 地址栏访问 `edge://extensions` → 开启「开发者模式」→「加载解压缩的扩展」→ 选择 `dist/` 目录

3. **配置 GitHub 连接**（见下文）

### 前置条件

- [Node.js](https://nodejs.org/) >= 18
- [pnpm](https://pnpm.io/) >= 11.2
- 一个 GitHub 仓库用于存储书签数据
- [GitHub Personal Access Token](https://github.com/settings/tokens)（需要 `repo` 权限）

---

## ⚙️ 配置指南

### GitHub Token 准备

1. 访问 [GitHub Settings → Tokens](https://github.com/settings/tokens)
2. 点击 **Generate new token (classic)**
3. 勾选 `repo` 权限范围（Full control of private repositories）
4. 生成并复制 Token（例如 `ghp_xxxxxxxxxxxxxxxxxxxx`）

> ⚠️ **安全提示**：Token 仅存储在浏览器本地 `chrome.storage.local` 中，不会上传到其他任何第三方服务。

### 扩展配置

右键扩展图标 →「选项」或点击弹窗中的 ⚙，填写：

| 配置项 | 说明 | 示例 |
|--------|------|------|
| **GitHub Token** | 个人访问令牌 | `ghp_xxxxxxxxxx` |
| **仓库 Owner** | 仓库所属用户/组织 | `LeonidasLux` |
| **仓库名称** | 存储书签的仓库名 | `bookmarks-manager` |
| **自动同步间隔** | 后台定时同步间隔（小时） | `6` |
| **加载时自动同步** | 扩展初始化时自动执行同步 | 开/关 |
| **自动清理空文件夹** | 应用差异后删除变空的文件夹 | 开/关 |

---

## 🎯 使用方法

### 基本操作

| 操作 | 方式 |
|------|------|
| 打开弹窗 | 点击浏览器工具栏的扩展图标 |
| 浏览书签 | 点击文件夹标签进入，面包屑导航返回 |
| 保存当前页 | 点击弹窗工具栏的 `➕` 按钮 |
| 打开设置 | 点击弹窗工具栏的 `⚙` 按钮 |

### 同步工作流

**推送（本地 → GitHub）：**
1. 在弹窗中点击 `↑` 按钮
2. 扩展读取当前浏览器书签，整体推送到 GitHub
3. 覆盖 `bookmarks.json` 文件，并生成一次 Git 提交

**拉取（GitHub → 本地）：**
1. 在弹窗中点击 `↓` 按钮
2. 扩展对比远程与本地书签，生成差异列表
3. 在差异审核界面逐项勾选要应用的变更
4. 点击「应用选中」写入浏览器原生书签

> 💡 **同步策略**：推送前从 GitHub 拉取最新数据，在本地合并后写入。冲突处理以最新的 `updatedAt` 为准。

---

## 🏗️ 项目架构

```
bookmarks-manager/
├── src/
│   ├── extension/
│   │   ├── popup/                     # 弹窗 UI（React）
│   │   │   ├── App.tsx                # 根组件：编排 hooks 和子组件（~110 行）
│   │   │   ├── constants.ts           # 常量：文件夹 ID、差异标签/颜色
│   │   │   ├── styles.ts              # 37 个内联样式对象
│   │   │   ├── index.html
│   │   │   ├── main.tsx               # ReactDOM 入口
│   │   │   ├── hooks/                 # 状态逻辑层
│   │   │   │   ├── useConfig.ts       #   配置加载 + 同步状态
│   │   │   │   ├── useBookmarkNavigation.ts  #   文件夹导航 + 面包屑
│   │   │   │   ├── useSync.ts         #   推送/拉取同步操作
│   │   │   │   └── useDiffReview.ts   #   差异审核状态管理
│   │   │   └── components/            # 展示组件层
│   │   │       ├── Toolbar.tsx         #   顶部工具栏
│   │   │       ├── BreadcrumbNav.tsx   #   面包屑导航
│   │   │       ├── BookmarkList.tsx    #   书签列表 + 文件夹标签
│   │   │       ├── DiffReviewPanel.tsx #   差异审核面板
│   │   │       ├── LoadingView.tsx     #   加载状态
│   │   │       └── UnconfiguredView.tsx #  未配置提示
│   │   ├── options/                   # 设置页面（React）
│   │   │   ├── App.tsx                # 配置表单（~111 行）
│   │   │   ├── index.html
│   │   │   ├── main.tsx
│   │   │   └── hooks/
│   │   │       └── useConfigForm.ts   #   表单状态管理
│   │   └── background/                # Service Worker
│   │       ├── service-worker.ts      #   消息路由 + 初始化（~120 行）
│   │       ├── bookmark-utils.ts      #   书签树遍历 / 文件夹路径解析
│   │       ├── folder-utils.ts        #   空文件夹检测与递归清理
│   │       └── diff-applier.ts        #   将差异应用到浏览器原生书签
│   ├── shared/                        # 共享层
│   │   ├── types.ts                   #   类型定义（Bookmark, AppConfig 等）
│   │   └── sync.ts                    #   SyncEngine（GitHub REST API 客户端）
│   └── __tests__/                     # 测试（10 文件 / 49 用例）
│       ├── shared/                    #   sync (10) + types (1)
│       ├── popup/hooks/               #   useDiffReview (6)
│       ├── popup/components/          #   Toolbar + BreadcrumbNav + DiffReviewPanel + StatusViews (19)
│       ├── options/hooks/             #   useConfigForm (5)
│       └── background/                #   bookmark-utils + folder-utils (8)
├── vite.config.ts                     # Vite + CRX 打包配置
├── vitest.config.ts                   # Vitest 测试配置
├── tsconfig.json
├── package.json
└── pnpm-workspace.yaml
```

### 核心模块

| 模块 | 角色 | 职责 |
|------|------|------|
| **Popup** | 用户界面 | 书签浏览、文件夹导航、一键保存、同步触发、差异审核 |
| **Options** | 配置管理 | GitHub 连接配置、同步策略参数 |
| **Service Worker** | 后台引擎 | 消息路由、浏览器书签读写、GitHub API 调用、差异计算与应用 |
| **Hooks** | 状态逻辑 | 独立 hooks 管理导航/同步/审核/配置，与 UI 组件解耦 |
| **Tools** | 公共服务 | 书签树遍历、文件夹路径解析、空文件夹检测与递归清理 |
| **Sync Engine** | 同步核心 | GitHub REST API（base64 编解码、文件 SHA 管理）、差异计算算法 |

### 数据流

```
┌─────────────┐     chrome.runtime.sendMessage     ┌───────────────────┐
│  Popup UI   │ ──────────────────────────────────→ │  Service Worker   │
│  (React)    │ ←────────────────────────────────── │  (background)     │
└─────────────┘     response callback               └────────┬──────────┘
                                                              │
                                                   ┌──────────▼──────────┐
                                                   │   GitHub REST API   │
                                                   │  /repos/{owner}/{repo}/contents/bookmarks.json  │
                                                   └─────────────────────┘
```

---

## 🛠️ 开发指南

### 环境准备

```bash
pnpm install
```

### 开发服务器

```bash
pnpm dev
```

启动 Vite 开发服务器并监听文件变更，热更新弹出窗/选项页。

### 构建

```bash
pnpm build
```

编译 TypeScript 并输出到 `dist/` 目录，产物为可直接加载的扩展包。

### 测试

```bash
pnpm test        # 单次运行全部测试
pnpm test:watch  # watch 模式
```

基于 [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/)，覆盖：
- 共享层：`SyncEngine.computeDiff` 差异算法、`normalizeFolderPath` 路径规范化
- Hooks：差异审核状态流转、配置表单读写
- 组件：工具栏按钮交互、面包屑导航、差异审核面板渲染
- 后台工具：书签树遍历展平、空文件夹检测与递归清理

### 预览构建产物

```bash
pnpm preview
```

### 提交规范

- Commit 使用中文描述变更（如 `feat(sync): 书签同步后自动清理空文件夹`）
- 遵循常规提交范围：`feat`、`fix`、`chore`、`refactor` 等

### 编码约定

- 独立功能拆分单独的 hooks 文件实现
- 合理拆分组件，避免全部 UI 写在一个文件里
- 每个功能都需要有对应的测试用例覆盖
- 使用 `pnpm build && pnpm test` 确保编译和测试通过

---

## 🔧 技术栈

| 技术 | 用途 |
|------|------|
| [TypeScript](https://www.typescriptlang.org/) | 类型安全 |
| [React 18](https://react.dev/) | UI 框架 |
| [Vite 5](https://vitejs.dev/) | 构建工具 |
| [crxjs](https://crxjs.dev/) | Chrome 扩展 Vite 插件 |
| [Chrome Extension API (Manifest V3)](https://developer.chrome.com/docs/extensions/) | 浏览器扩展能力 |
| [pnpm](https://pnpm.io/) | 包管理器 |

---

## 📄 许可

本项目基于 [MIT License](./LICENSE) 开源。

版权所有 © 2026 [LeonidasLux](https://github.com/LeonidasLux)

---

<p align="center">
  Built with ❤️ by <a href="https://github.com/LeonidasLux">LeonidasLux</a>
</p>
