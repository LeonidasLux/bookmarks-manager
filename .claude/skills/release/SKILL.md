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
- 如果有未提交更改，展示给用户并询问是否全部提交（`git add -A` 后再继续）
- 如果工作区干净但有未推送 commit，询问是否一起推送
- 确认当前分支是 `main`

### 2. 获取 commit message
- 提示用户输入 commit message（支持多行）
- 使用临时文件方式保存多行消息：`mktemp` 创建临时文件，让用户通过 `cat > tmpfile` 或 `echo` 写入内容
- 如果用户提供单行消息，直接用 `-m` 参数
- 读取完成后删除临时文件

### 3. 确定版本升级类型
- 询问用户：**patch**（修复，0.0.x）、**minor**（小功能，0.x.0）还是 **major**（大版本，x.0.0）
- 给出当前版本的参考

### 4. 读取并升级版本号

**读取当前版本：**
- 从 `package.json` 的 `version` 字段读取
- 从 `vite.config.ts` 中 `crx({ manifest: { version: '...' } })` 读取
- 两者应保持一致，不一致时报错提示

**计算新版本：**
- patch: `1.2.3` → `1.2.4`
- minor: `1.2.3` → `1.3.0`
- major: `1.2.3` → `2.0.0`

### 5. 更新版本号文件

**更新 `package.json`：**
- 用 Edit 工具替换 `"version": "旧版本"` 为 `"version": "新版本"`

**更新 `vite.config.ts`：**
- 用 Edit 工具替换 `version: '旧版本'` 为 `version: '新版本'`
- 注意保持引号格式一致

### 6. 执行提交
- `git add -A`
- `git commit -m "提交消息"`
- 使用 `-m` 参数提交（单行消息）或 `--file` （多行消息）

### 7. 打标签
- `git tag v<新版本号>`
- 示例：`git tag v0.2.0`

### 8. 推送到 GitHub
- `git push origin main`
- `git push origin v<新版本号>`

### 9. 确认 GitHub Actions 已触发
- 告知用户 Release workflow 已自动触发
- 可在 https://github.com/0668001277/bookmarks-manager/actions 查看进度

## 安全确认

⚠️ 每个敏感步骤前都要向用户确认：
- 提交前：展示 `git status` 和将要提交的文件概览
- 推送到 GitHub 前：展示 tag 名和推送目标
- 使用以下确认格式：
  ```
  ⚠️ 即将执行推送操作
  - 分支: main
  - 标签: v0.2.0
  - 提交信息: xxxxx
  
  确认继续？(是/否)
  ```

## 错误处理

- `git push` 失败时展示错误信息，不掩盖
- 版本号读取失败时提示用户手动输入
- 任何步骤失败都停止流程，让用户决定如何处理
