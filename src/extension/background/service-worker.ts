import type { AppConfig, BookmarkDiff } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'
import { SyncEngine } from '../../shared/sync'
import { getBrowserBookmarks } from './bookmark-utils'
import { computeEmptyFolders } from './folder-utils'
import { applyDiffsToBrowser, showResult } from './diff-applier'

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

          const emptyFolders = await computeEmptyFolders(diffs)

          showResult(steps, true)
          sendResponse({ success: true, timestamp: new Date().toISOString(), diffs, emptyFolders, steps })
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
          const cleanEmptyFolders = msg.cleanEmptyFolders as boolean
          await applyDiffsToBrowser(selectedDiffs, steps, cleanEmptyFolders)
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
