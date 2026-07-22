import type { AppConfig, Bookmark, SyncResult } from '../../shared/types'
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

async function getLocalBookmarks(steps: string[]): Promise<Bookmark[]> {
  const stored = await new Promise<Bookmark[]>((resolve) => {
    chrome.storage.local.get('bookmarks', (result) => {
      resolve((result.bookmarks ?? []) as Bookmark[])
    })
  })

  steps.push(`storage: ${stored.length} 条`)

  if (stored.length > 0) return stored

  steps.push('storage 为空，从浏览器导入...')
  try {
    const imported = await importFromBrowser()
    steps.push(`导入: ${imported.length} 条`)
    return imported
  } catch (e) {
    steps.push(`导入失败: ${(e as Error).message}`)
    return []
  }
}

async function importFromBrowser(): Promise<Bookmark[]> {
  const tree = await chrome.bookmarks.getTree()
  const imported: Bookmark[] = []

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[], folderPath: string) {
    for (const node of nodes) {
      if (node.url) {
        imported.push({
          id: crypto.randomUUID(),
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
  return imported
}

function showResult(steps: string[], ok: boolean) {
  // badge 图标
  chrome.action.setBadgeText({ text: ok ? 'ok' : 'ERR' })
  chrome.action.setBadgeBackgroundColor({ color: ok ? '#4caf50' : '#f44336' })
  // tooltip 显示详细步骤
  chrome.action.setTitle({ title: steps.join(' | ') })
  // 5s 后清除 badge
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000)
}

/**
 * 从浏览器原生书签重新导入，与已存储的书签合并，保存到 storage
 * 以 URL 为匹配键，保留已存储书签的标签/文件夹等扩展数据
 */
async function refreshFromBrowser(): Promise<Bookmark[]> {
  const { bookmarks: stored = [] } = await chrome.storage.local.get('bookmarks') as { bookmarks?: Bookmark[] }

  const storedByUrl = new Map<string, Bookmark>()
  for (const b of stored) {
    storedByUrl.set(b.url, b)
  }

  const browser = await importFromBrowser()
  const seenUrls = new Set<string>()
  const merged: Bookmark[] = []

  for (const bb of browser) {
    seenUrls.add(bb.url)
    const existing = storedByUrl.get(bb.url)
    if (existing) {
      // 保留已有书签（含标签等扩展数据），但同步标题变更
      if (existing.title !== bb.title) {
        existing.title = bb.title
        existing.updatedAt = new Date().toISOString()
      }
      merged.push(existing)
    } else {
      // 浏览器新增的书签
      merged.push(bb)
    }
  }

  // 保留扩展手动添加、但浏览器中没有的书签；删除浏览器中书签已删除的记录
  for (const b of stored) {
    if (!seenUrls.has(b.url)) {
      if (b.source === 'extension') {
        merged.push(b)
      }
      // 浏览器来源且浏览器中已删除 → 不保留
    }
  }

  merged.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())

  await chrome.storage.local.set({ bookmarks: merged })
  return merged
}

async function performSync(): Promise<SyncResult> {
  const steps: string[] = []

  try {
    chrome.action.setBadgeText({ text: '...' })
    chrome.action.setBadgeBackgroundColor({ color: '#f5a623' })

    if (!config.githubToken || !config.repoOwner || !config.repoName) {
      steps.push('配置不完整')
      showResult(steps, false)
      return { success: false, timestamp: new Date().toISOString(), error: '请先完成设置', steps }
    }

    if (!syncEngine) syncEngine = new SyncEngine(config)

    const local = await getLocalBookmarks(steps)

    const { bookmarks, result } = await syncEngine.sync(local, steps)

    if (result.success) {
      steps.push(`完成: ${bookmarks.length} 条`)
      showResult(steps, true)
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({
          bookmarks,
          lastSync: result.timestamp,
          syncLog: { ...result, steps },
        }, resolve)
      })
    } else {
      steps.push(`失败: ${result.error}`)
      showResult(steps, false)
      chrome.storage.local.set({ syncLog: { ...result, steps } })
    }

    return { ...result, steps }
  } catch (e) {
    steps.push(`异常: ${(e as Error).message}`)
    showResult(steps, false)
    const r = { success: false, timestamp: new Date().toISOString(), error: (e as Error).message, steps }
    chrome.storage.local.set({ syncLog: r })
    return r
  }
}

function registerAlarm(cfg: AppConfig) {
  const minutes = (cfg.syncIntervalHours || 6) * 60
  chrome.alarms.create('syncAlarm', { periodInMinutes: minutes })
}

// ---- 初始化 ----
chrome.runtime.onInstalled.addListener(async () => {
  const cfg = await loadConfig() as AppConfig
  registerAlarm(cfg)
  performSync()
})

chrome.runtime.onStartup.addListener(async () => {
  await loadConfig()
  performSync()
})

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SYNC_MANUAL':
      performSync().then(sendResponse)
      return true

    case 'REFRESH_BOOKMARKS':
      refreshFromBrowser().then(sendResponse)
      return true

    case 'GET_CONFIG':
      sendResponse({ config })
      break

    case 'SAVE_CONFIG':
      config = msg.config as AppConfig
      syncEngine = new SyncEngine(config)
      chrome.storage.local.set({ config }, () => {
        chrome.alarms.clearAll(() => registerAlarm(config))
        sendResponse({ success: true })
      })
      return true
  }
})

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAlarm') performSync()
})
