import { useState, useCallback } from 'react'
import type { Bookmark, SyncResult, PullDiffResult } from '../../../shared/types'
import { normalizeFolderPath } from '../../../shared/sync'

/** 将浏览器书签树展平为扁平 Bookmark 数组（用于推送前预览） */
async function flattenBookmarksTree(tree: chrome.bookmarks.BookmarkTreeNode[]): Promise<Bookmark[]> {
  const flat: Bookmark[] = []
  const ROOT_FOLDER_CANONICAL: Record<string, string> = {
    '1': '书签栏',
    '2': '其他书签',
    '3': '移动设备书签',
  }
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
        const folderName = ROOT_FOLDER_CANONICAL[node.id] ?? node.title
        walk(node.children, `${folderPath}/${folderName}`)
      }
    }
  }
  walk(tree, '')

  // 批量获取访问次数
  try {
    const historyItems = await chrome.history.search({ text: '', maxResults: 10000, startTime: 0 })
    const visitMap = new Map<string, number>()
    for (const item of historyItems) {
      if (item.url && item.visitCount != null) {
        visitMap.set(item.url, item.visitCount)
      }
    }
    for (const bm of flat) {
      bm.visitCount = visitMap.get(bm.url) ?? 0
    }
  } catch {
    // chrome.history 不可用时静默跳过
  }

  return flat
}

/**
 * 同步操作：推送、拉取、保存当前页面
 */
export function useSync() {
  const [pushLoading, setPushLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)

  const handlePush = useCallback((
    setSyncStatus: (s: string | null) => void,
    setSyncSteps?: (steps: string[]) => void,
  ) => {
    ;(async () => {
      // 收集书签数据用于二次确认和打印
      const tree = await chrome.bookmarks.getTree()
      const bookmarks = await flattenBookmarksTree(tree)
      console.log('推送到 GitHub 的书签数据:', JSON.stringify(bookmarks, null, 2))

      if (!confirm(`确认将 ${bookmarks.length} 条书签推送到 GitHub？\n该操作将强制覆盖远程数据。`)) {
        setSyncStatus('已取消推送')
        return
      }

      setPushLoading(true)
      setSyncStatus('🔄 推送到 GitHub...')
      chrome.runtime.sendMessage({ type: 'PUSH_TO_GITHUB' }, (res: SyncResult) => {
        setPushLoading(false)
        setSyncSteps?.(res.steps ?? [])
        if (res.success) {
          setSyncStatus(`✅ 推送成功 — ${new Date(res.timestamp).toLocaleString('zh-CN')}`)
        } else {
          setSyncStatus(`❌ 推送失败: ${res.error}`)
        }
      })
    })()
  }, [])

  /** 返回拉取结果，由调用方决定如何处理差异 */
  const handlePull = useCallback((
    setSyncStatus: (s: string | null) => void,
    setSyncSteps?: (steps: string[]) => void,
  ): Promise<PullDiffResult> => {
    return new Promise((resolve) => {
      setPullLoading(true)
      setSyncStatus('🔄 从 GitHub 拉取...')
      chrome.runtime.sendMessage({ type: 'PULL_FROM_GITHUB' }, (res: PullDiffResult) => {
        setPullLoading(false)
        setSyncSteps?.(res.steps ?? [])
        if (res.success) {
          if (res.diffs.length === 0) {
            setSyncStatus('✅ 远程无变更，本地已是最新')
          } else {
            setSyncStatus(null)
          }
        } else {
          setSyncStatus(`❌ 拉取失败: ${res.error}`)
        }
        resolve(res)
      })
    })
  }, [])

  /** 获取当前标签页信息（url 和 title） */
  const getCurrentTabInfo = useCallback(async (): Promise<{ url: string; title: string } | null> => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.url) return null
    return { url: tab.url, title: tab.title || '' }
  }, [])

  const handleSaveCurrent = useCallback(async (
    targetFolderId: string,
    title: string,
    url: string,
    currentFolderId: string,
    loadFolder: (id: string) => Promise<void>,
    setSyncStatus?: (s: string | null) => void,
  ): Promise<boolean> => {
    try {
      setSyncStatus?.('🔄 保存书签...')

      await chrome.bookmarks.create({
        parentId: targetFolderId,
        title,
        url,
      })

      await loadFolder(currentFolderId)
      setSyncStatus?.(`✅ 已保存到书签 — ${new Date().toLocaleString('zh-CN')}`)
      return true
    } catch (err) {
      console.error('保存书签失败:', err)
      setSyncStatus?.(`❌ 保存书签失败: ${err instanceof Error ? err.message : '未知错误'}`)
      return false
    }
  }, [])

  return { pushLoading, pullLoading, handlePush, handlePull, handleSaveCurrent, getCurrentTabInfo }
}
