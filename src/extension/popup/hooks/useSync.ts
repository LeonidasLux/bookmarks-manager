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

  const handleSaveCurrent = useCallback(async (
    currentFolderId: string,
    loadFolder: (id: string) => Promise<void>,
  ) => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0]
      if (!tab?.url || !tab?.title) return

      await chrome.bookmarks.create({
        parentId: '2',
        title: tab.title,
        url: tab.url,
      })

      await loadFolder(currentFolderId)
    })
  }, [])

  return { pushLoading, pullLoading, handlePush, handlePull, handleSaveCurrent }
}
