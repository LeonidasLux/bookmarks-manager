import type { AppConfig, Bookmark, BookmarkDiff } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'
import { SyncEngine } from '../../shared/sync'

let config: AppConfig = DEFAULT_CONFIG
let syncEngine: SyncEngine | null = null

function loadConfig(): Promise<AppConfig> {
  return new Promise((resolve) => {
    chrome.storage.local.get('config', (result) => {
      const cfg = { ...DEFAULT_CONFIG, ...(result.config ?? {}) } as AppConfig
      config = cfg
      syncEngine = new SyncEngine(cfg)
      resolve(cfg)
    })
  })
}

/** 从浏览器原生书签读取并展开为扁平列表（始终取当前浏览器最新数据） */
async function getBrowserBookmarks(steps: string[]): Promise<Bookmark[]> {
  const tree = await chrome.bookmarks.getTree()
  const flat: Bookmark[] = []

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[], folderPath: string) {
    for (const node of nodes) {
      if (node.url) {
        flat.push({
          id: node.id, // 使用 Chrome 原生 ID（同一浏览器内稳定）
          title: node.title,
          url: node.url,
          folder: folderPath || '/',
          tags: [],
          createdAt: new Date(node.dateAdded ?? Date.now()).toISOString(),
          updatedAt: new Date(node.dateAdded ?? Date.now()).toISOString(),
          source: 'browser',
        })
      }
      if (node.children) {
        walk(node.children, `${folderPath}/${node.title}`)
      }
    }
  }

  walk(tree, '')
  steps.push(`浏览器: ${flat.length} 条书签`)
  return flat
}

/**
 * 将文件夹路径解析为 Chrome 书签文件夹节点 ID
 * 路径格式：'/书签栏/子文件夹'，不存在则逐级创建
 */
async function resolveFolderPath(folderPath: string, steps: string[]): Promise<string> {
  const parts = folderPath.split('/').filter(p => p !== '')
  if (parts.length === 0) {
    steps.push('空文件夹路径，默认使用书签栏')
    return '1'
  }

  // 从根节点查找一级文件夹
  const tree = await chrome.bookmarks.getTree()
  const rootChildren = tree[0]?.children ?? []
  let current: chrome.bookmarks.BookmarkTreeNode | undefined = rootChildren.find(
    (n: chrome.bookmarks.BookmarkTreeNode) => !n.url && n.title === parts[0]
  )

  if (!current) {
    steps.push(`创建一级文件夹: ${parts[0]}`)
    current = await chrome.bookmarks.create({ parentId: '1', title: parts[0] })
  }

  // 逐级查找或创建子文件夹
  for (let i = 1; i < parts.length; i++) {
    const children: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getChildren(current.id)
    let next: chrome.bookmarks.BookmarkTreeNode | undefined = children.find(
      (n: chrome.bookmarks.BookmarkTreeNode) => !n.url && n.title === parts[i]
    )
    if (!next) {
      steps.push(`创建子文件夹: ${parts[i]}`)
      next = await chrome.bookmarks.create({ parentId: current.id, title: parts[i] })
    }
    current = next
  }

  return current!.id
}

/** 将差异应用到浏览器原生书签 */
async function applyDiffsToBrowser(diffs: BookmarkDiff[], steps: string[]): Promise<void> {
  for (const diff of diffs) {
    switch (diff.type) {
      case 'added': {
        const parentId = await resolveFolderPath(diff.remote.folder || '/', steps)
        const node = await chrome.bookmarks.create({
          parentId,
          title: diff.remote.title,
          url: diff.remote.url,
        })
        steps.push(`+ browser: ${node.title}`)
        break
      }
      case 'deleted': {
        const searchUrl = diff.local?.url ?? diff.remote.url
        const found = await chrome.bookmarks.search({ url: searchUrl })
        for (const node of found) {
          await chrome.bookmarks.remove(node.id)
        }
        steps.push(`- browser: ${diff.remote.title}`)
        break
      }
      case 'modified': {
        const searchUrl = diff.local?.url ?? diff.remote.url
        const found = await chrome.bookmarks.search({ url: searchUrl })
        if (found.length > 0) {
          const node = found[0]
          await chrome.bookmarks.update(node.id, {
            title: diff.remote.title,
            url: diff.remote.url,
          })
          // 文件夹路径变更时，移动到新文件夹
          const hasFolderChange = diff.changes?.some(c => c.field === 'folder')
          if (hasFolderChange) {
            const newParentId = await resolveFolderPath(diff.remote.folder || '/', steps)
            await chrome.bookmarks.move(node.id, { parentId: newParentId })
            steps.push(`→ browser: ${diff.remote.title} → ${diff.remote.folder}`)
          }
          steps.push(`~ browser: ${diff.remote.title}`)
        }
        break
      }
    }
  }
}

function showResult(steps: string[], ok: boolean) {
  chrome.action.setBadgeText({ text: ok ? 'ok' : 'ERR' })
  chrome.action.setBadgeBackgroundColor({ color: ok ? '#4caf50' : '#f44336' })
  chrome.action.setTitle({ title: steps.join(' | ') })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000)
}

// ---- 初始化 ----
loadConfig()

chrome.runtime.onInstalled.addListener(async () => {
  await loadConfig()
})

// ---- 消息处理 ----
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'PUSH_TO_GITHUB': {
      ;(async () => {
        const steps: string[] = []
        try {
          if (!config.githubToken || !config.repoOwner || !config.repoName) {
            steps.push('配置不完整')
            showResult(steps, false)
            sendResponse({ success: false, error: '请先完成设置', steps })
            return
          }
          if (!syncEngine) syncEngine = new SyncEngine(config)

          const local = await getBrowserBookmarks(steps)
          await syncEngine.pushOnly(local, steps)
          steps.push(`完成: ${local.length} 条`)
          showResult(steps, true)
          const timestamp = new Date().toISOString()
          chrome.storage.local.set({ lastSync: timestamp, syncLog: { success: true, timestamp, steps } })
          sendResponse({ success: true, timestamp, steps })
        } catch (e) {
          steps.push(`❌ ${(e as Error).message}`)
          showResult(steps, false)
          const timestamp = new Date().toISOString()
          chrome.storage.local.set({ syncLog: { success: false, timestamp, error: (e as Error).message, steps } })
          sendResponse({ success: false, error: (e as Error).message, steps })
        }
      })()
      return true
    }

    case 'PULL_FROM_GITHUB': {
      ;(async () => {
        const steps: string[] = []
        try {
          if (!config.githubToken || !config.repoOwner || !config.repoName) {
            steps.push('配置不完整')
            showResult(steps, false)
            sendResponse({ success: false, timestamp: '', diffs: [], error: '请先完成设置', steps })
            return
          }
          if (!syncEngine) syncEngine = new SyncEngine(config)

          const remote = await syncEngine.pullOnly(steps)
          const local = await getBrowserBookmarks(steps)
          const diffs = SyncEngine.computeDiff(remote, local)
          steps.push(`差异: 新增${diffs.filter(d => d.type === 'added').length} / 删除${diffs.filter(d => d.type === 'deleted').length} / 修改${diffs.filter(d => d.type === 'modified').length}`)
          showResult(steps, true)
          sendResponse({ success: true, timestamp: new Date().toISOString(), diffs, steps })
        } catch (e) {
          steps.push(`❌ ${(e as Error).message}`)
          showResult(steps, false)
          sendResponse({ success: false, timestamp: '', diffs: [], error: (e as Error).message, steps })
        }
      })()
      return true
    }

    case 'APPLY_PULL_DIFFS': {
      ;(async () => {
        const steps: string[] = []
        try {
          const selectedDiffs = msg.selectedDiffs as BookmarkDiff[]
          await applyDiffsToBrowser(selectedDiffs, steps)
          steps.push(`完成: 应用 ${selectedDiffs.length} 项`)
          showResult(steps, true)
          const timestamp = new Date().toISOString()
          chrome.storage.local.set({ lastSync: timestamp, syncLog: { success: true, timestamp, steps } })
          sendResponse({ success: true, timestamp, steps })
        } catch (e) {
          steps.push(`❌ ${(e as Error).message}`)
          showResult(steps, false)
          sendResponse({ success: false, error: (e as Error).message, steps })
        }
      })()
      return true
    }

    case 'GET_CONFIG':
      chrome.storage.local.get('config', (result) => {
        sendResponse({ config: { ...DEFAULT_CONFIG, ...(result.config ?? {}) } })
      })
      return true

    case 'SAVE_CONFIG':
      config = msg.config as AppConfig
      syncEngine = new SyncEngine(config)
      chrome.storage.local.set({ config }, () => {
        sendResponse({ success: true })
      })
      return true
  }
})
