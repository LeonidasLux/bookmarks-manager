import { useState, useCallback } from 'react'
import type { SyncResult, PullDiffResult } from '../../../shared/types'

/**
 * 同步操作：推送、拉取、保存当前页面
 */
export function useSync() {
  const [pushLoading, setPushLoading] = useState(false)
  const [pullLoading, setPullLoading] = useState(false)

  const handlePush = useCallback((
    setSyncStatus: (s: string | null) => void,
  ) => {
    setPushLoading(true)
    setSyncStatus('🔄 推送到 GitHub...')
    chrome.runtime.sendMessage({ type: 'PUSH_TO_GITHUB' }, (res: SyncResult) => {
      setPushLoading(false)
      if (res.success) {
        setSyncStatus(`✅ 推送成功 — ${new Date(res.timestamp).toLocaleString('zh-CN')}`)
      } else {
        setSyncStatus(`❌ 推送失败: ${res.error}`)
      }
    })
  }, [])

  /** 返回拉取结果，由调用方决定如何处理差异 */
  const handlePull = useCallback((
    setSyncStatus: (s: string | null) => void,
  ): Promise<PullDiffResult> => {
    return new Promise((resolve) => {
      setPullLoading(true)
      setSyncStatus('🔄 从 GitHub 拉取...')
      chrome.runtime.sendMessage({ type: 'PULL_FROM_GITHUB' }, (res: PullDiffResult) => {
        setPullLoading(false)
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
