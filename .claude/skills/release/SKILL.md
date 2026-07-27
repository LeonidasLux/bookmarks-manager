---
name: release
description: >
  提交代码、升级版本、打标签并推送到 GitHub 的自动化发布流程。
  当用户说"发版"、"发布"、"release"、"打标签"、"提交并推送"时触发此 skill。
  这是一个跨多步的操作流程，依赖用户交互确认每一步。
---

# Release Skill

自动化发布工作流：提交代码 → 升级版本号 → 打标签 → 推送到 GitHub。

## 工作流程

### 1. 运行前检查
- 执行 `git status` 检查工作区状态
- 确定 `git暂存区` 是否有变更代码，如果没有则询问用户是否需要提交 `更改区` 的代码
- 确认当前分支是 `main`

### 2. 获取 commit message
- 根据暂存区代码diff自动生成commit message

### 3. 读取版本号

**读取当前版本：**
- 从 `package.json` 的 `version` 字段读取
- 从 `vite.config.ts` 中 `crx({ manifest: { version: '...' } })` 读取

**计算新版本：**
- patch: `1.2.3` → `1.2.4`
- minor: `1.2.3` → `1.3.0`
- major: `1.2.3` → `2.0.0`

### 4. 更新版本号文件

**更新 `package.json`：**
- 用 Edit 工具替换 `"version": "旧版本"` 为 `"version": "新版本"`

**更新 `vite.config.ts`：**
- 用 Edit 工具替换 `version: '旧版本'` 为 `version: '新版本'`
- 注意保持引号格式一致

### 5. 执行提交
- `git commit -m "提交消息"`

### 7. 打标签
- `git tag v<新版本号>`
- 示例：`git tag v0.2.0`

### 8. 推送到 GitHub
- `git push origin main`
- `git push origin v<新版本号>`

### 9. 确认 GitHub Actions 已触发
- 告知用户 Release workflow 已自动触发
- 可在 https://github.com/0668001277/bookmarks-manager/actions 查看进度

## 错误处理

- `git push` 失败时展示错误信息，不掩盖
- 版本号读取失败时提示用户手动输入
- 任何步骤失败都停止流程，让用户决定如何处理
