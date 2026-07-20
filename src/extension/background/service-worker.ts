import type { AppConfig, Bookmark, SyncResult } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'
import { SyncEngine } from '../../shared/sync'

let config: AppConfig = DEFAULT_CONFIG
let syncEngine: SyncEngine | null = null

// 从 Chrome Storage 加载配置
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

// 获取本地书签
function getLocalBookmarks(): Promise<Bookmark[]> {
  return new Promise((resolve) => {
    chrome.storage.local.get('bookmarks', (result) => {
      resolve((result.bookmarks ?? []) as Bookmark[])
    })
  })
}

// 执行同步
async function performSync(): Promise<SyncResult> {
  try {
    if (!config.githubToken || !config.repoOwner || !config.repoName) {
      return { success: false, timestamp: new Date().toISOString(), error: '请先完成设置' }
    }

    if (!syncEngine) syncEngine = new SyncEngine(config)

    const local = await getLocalBookmarks()
    const { bookmarks, result } = await syncEngine.sync(local)

    if (result.success) {
      await new Promise<void>((resolve) => {
        chrome.storage.local.set({ bookmarks, lastSync: result.timestamp }, resolve)
      })
    }

    return result
  } catch (e) {
    return { success: false, timestamp: new Date().toISOString(), error: (e as Error).message }
  }
}

// 注册定时同步
function registerAlarm(cfg: AppConfig) {
  const minutes = (cfg.syncIntervalHours || 6) * 60
  chrome.alarms.create('syncAlarm', { periodInMinutes: minutes })
}

// 从浏览器原生书签导入（首次运行）
async function importFromBrowser() {
  const existing = await getLocalBookmarks()
  if (existing.length > 0) return // 已有数据，跳过

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
        })
      }
      if (node.children) {
        walk(node.children, `${folderPath}/${node.title}`)
      }
    }
  }

  walk(tree, '')

  await new Promise<void>((resolve) => {
    chrome.storage.local.set({ bookmarks: imported }, resolve)
  })
}

// ---- 初始化 ----
chrome.runtime.onInstalled.addListener(async () => {
  const cfg = await loadConfig() as AppConfig
  await importFromBrowser()
  registerAlarm(cfg)
  performSync() // 启动时自动同步
})

chrome.runtime.onStartup.addListener(async () => {
  await loadConfig()
  performSync() // 启动时自动同步
})

// 消息处理
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  switch (msg.type) {
    case 'SYNC_MANUAL':
      performSync().then(sendResponse)
      return true // 保持通道开放

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

    case 'CONFIG_UPDATED':
      config = msg.config as AppConfig
      syncEngine = new SyncEngine(config)
      chrome.alarms.clearAll(() => registerAlarm(config))
      break
  }
})

// 定时同步
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'syncAlarm') {
    performSync()
  }
})
