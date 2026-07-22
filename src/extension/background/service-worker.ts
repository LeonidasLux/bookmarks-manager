import type { AppConfig, Bookmark, BookmarkDiff } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'
import { SyncEngine, normalizeFolderPath } from '../../shared/sync'

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
          id: node.id,
          title: node.title,
          url: node.url,
          folder: normalizeFolderPath(folderPath || '/'),
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

/** 根级别文件夹 ID，不可删除 */
const ROOT_FOLDER_IDS = new Set(['0', '1', '2', '3'])

/** 递归删除空父文件夹，从 parentId 向上遍历，直到遇到非空文件夹或根级别 */
async function removeEmptyAncestorFolders(parentId: string, steps: string[]): Promise<void> {
  let currentId = parentId
  while (currentId && !ROOT_FOLDER_IDS.has(currentId)) {
    const children = await chrome.bookmarks.getChildren(currentId)
    if (children.length > 0) return // 还有子节点，停止
    try {
      const [node] = await chrome.bookmarks.get(currentId)
      const grandParent = node?.parentId
      await chrome.bookmarks.remove(currentId)
      steps.push(`- folder: ${node?.title ?? currentId}`)
      currentId = grandParent ?? ''
    } catch {
      return // 节点可能已不存在
    }
  }
}

/** 从书签节点向上遍历，构建文件夹路径 */
async function getFolderPath(nodeId: string): Promise<string> {
  const parts: string[] = []
  let currentId: string | undefined = nodeId

  while (currentId && !ROOT_FOLDER_IDS.has(currentId)) {
    try {
      const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(currentId)
      const node = nodes[0]
      if (!node) break
      parts.unshift(node.title)
      currentId = node.parentId
    } catch {
      break
    }
  }

  return '/' + parts.join('/')
}

/** 计算应用全部 diffs 后会变空的文件夹路径列表 */
async function computeEmptyFolders(diffs: BookmarkDiff[]): Promise<string[]> {
  // 收集要删除或移走的书签的当前父文件夹
  const parentsToCheck = new Set<string>()

  for (const d of diffs) {
    if (d.type === 'deleted' && d.local?.id) {
      try {
        const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(d.local.id)
        const node = nodes[0]
        if (node?.parentId && !ROOT_FOLDER_IDS.has(node.parentId)) {
          parentsToCheck.add(node.parentId)
        }
      } catch { /* 忽略 */ }
    } else if (d.type === 'modified' && d.changes?.some(c => c.field === 'folder') && d.local?.id) {
      try {
        const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(d.local.id)
        const node = nodes[0]
        if (node?.parentId && !ROOT_FOLDER_IDS.has(node.parentId)) {
          parentsToCheck.add(node.parentId)
        }
      } catch { /* 忽略 */ }
    }
  }

  if (parentsToCheck.size === 0) return []

  // 收集所有会被删除或移走的 URL（用于判断子节点是否全部移除）
  const removedUrls = new Set<string>()
  for (const d of diffs) {
    if (d.type === 'deleted') {
      removedUrls.add(d.local?.url ?? d.remote.url)
    } else if (d.type === 'modified' && d.changes?.some(c => c.field === 'folder')) {
      removedUrls.add(d.local?.url ?? d.remote.url)
    }
  }

  // 检查每个父文件夹是否会变空
  const emptyPaths: string[] = []
  for (const parentId of parentsToCheck) {
    const children: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getChildren(parentId)
    const hasSubfolders = children.some(c => !c.url)
    if (hasSubfolders) continue

    const allGone = children.every(c => {
      if (!c.url) return true
      return removedUrls.has(c.url)
    })

    if (allGone && children.some(c => c.url)) {
      const path = await getFolderPath(parentId)
      emptyPaths.push(path)
    }
  }

  return emptyPaths.sort()
}

/** 将差异应用到浏览器原生书签 */
async function applyDiffsToBrowser(diffs: BookmarkDiff[], steps: string[], cleanEmptyFolders: boolean): Promise<void> {
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
        const nodeId = diff.local?.id
        if (nodeId) {
          try {
            const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(nodeId)
            const node = nodes[0]
            if (node) {
              const oldParentId = node.parentId
              await chrome.bookmarks.remove(nodeId)
              if (cleanEmptyFolders && oldParentId) {
                await removeEmptyAncestorFolders(oldParentId, steps)
              }
            }
          } catch {
            // 节点可能已不存在，忽略
          }
        } else {
          // 兜底：无 local id 时按 url 搜索
          const searchUrl = diff.local?.url ?? diff.remote.url
          const found = await chrome.bookmarks.search({ url: searchUrl })
          for (const node of found) {
            const oldParentId = node.parentId
            await chrome.bookmarks.remove(node.id)
            if (cleanEmptyFolders && oldParentId) {
              await removeEmptyAncestorFolders(oldParentId, steps)
            }
          }
        }
        steps.push(`- browser: ${diff.remote.title}`)
        break
      }
      case 'modified': {
        const nodeId = diff.local?.id
        if (!nodeId) break
        try {
          const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(nodeId)
          const node = nodes[0]
          if (!node) break

          await chrome.bookmarks.update(nodeId, {
            title: diff.remote.title,
            url: diff.remote.url,
          })

          const hasFolderChange = diff.changes?.some(c => c.field === 'folder')
          if (hasFolderChange) {
            const oldParentId = node.parentId
            const newParentId = await resolveFolderPath(diff.remote.folder || '/', steps)
            // 仅在不同文件夹时才执行移动和清理
            if (oldParentId && oldParentId !== newParentId) {
              await chrome.bookmarks.move(nodeId, { parentId: newParentId })
              steps.push(`→ browser: ${diff.remote.title} → ${diff.remote.folder}`)
              if (cleanEmptyFolders) {
                await removeEmptyAncestorFolders(oldParentId, steps)
              }
            }
          }
          steps.push(`~ browser: ${diff.remote.title}`)
        } catch {
          // 节点可能已不存在，忽略
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

          // 计算可能变空的文件夹
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
