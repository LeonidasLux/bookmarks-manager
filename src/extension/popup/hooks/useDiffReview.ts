import { useState, useEffect, useCallback } from 'react'
import type { BookmarkDiff, SyncResult } from '../../../shared/types'

export type DiffTab = 'added' | 'deleted' | 'modified' | 'empty'

/**
 * 差异审核状态管理
 */
export function useDiffReview() {
  const [pullDiffs, setPullDiffs] = useState<BookmarkDiff[] | null>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])
  const [diffTab, setDiffTab] = useState<DiffTab>('added')

  // pullDiffs 变化时重置为第一个有内容的 tab
  useEffect(() => {
    if (!pullDiffs) return
    const g = {
      added: pullDiffs.filter(d => d.type === 'added'),
      deleted: pullDiffs.filter(d => d.type === 'deleted'),
      modified: pullDiffs.filter(d => d.type === 'modified'),
    }
    if (g.added.length > 0) setDiffTab('added')
    else if (g.deleted.length > 0) setDiffTab('deleted')
    else if (g.modified.length > 0) setDiffTab('modified')
    else setDiffTab('empty')
  }, [pullDiffs])

  /** 打开差异审核面板 */
  const openReview = useCallback((diffs: BookmarkDiff[], folders: string[]) => {
    setPullDiffs(diffs)
    setSelectedIds(diffs.map(d => d.remote.id))
    setEmptyFolders(folders)
  }, [])

  const cancelPullReview = useCallback(() => {
    setPullDiffs(null)
    setSelectedIds([])
    setEmptyFolders([])
    setDiffTab('added')
  }, [])

  const applySelected = useCallback(async (
    configCleanEmpty: boolean,
    currentFolderId: string,
    loadFolder: (id: string) => Promise<void>,
    setSyncStatus: (s: string | null) => void,
  ) => {
    const selectedDiffs = pullDiffs!.filter(d => selectedIds.includes(d.remote.id))
    chrome.runtime.sendMessage({
      type: 'APPLY_PULL_DIFFS',
      selectedDiffs,
      cleanEmptyFolders: configCleanEmpty,
    }, async (res: SyncResult) => {
      if (res.success) {
        setSyncStatus(`✅ 已应用 ${selectedDiffs.length} 项变更 — ${new Date(res.timestamp).toLocaleString('zh-CN')}`)
        await loadFolder(currentFolderId)
      } else {
        setSyncStatus(`❌ 应用失败: ${res.error}`)
      }
      setPullDiffs(null)
      setSelectedIds([])
      setEmptyFolders([])
    })
  }, [pullDiffs, selectedIds])

  const toggleId = useCallback((id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }, [])

  const selectAllInGroup = useCallback((diffs: BookmarkDiff[]) => {
    const groupIds = diffs.map(d => d.remote.id)
    setSelectedIds(prev => {
      const merged = new Set(prev)
      groupIds.forEach(id => merged.add(id))
      return Array.from(merged)
    })
  }, [])

  const invertSelectionInGroup = useCallback((diffs: BookmarkDiff[]) => {
    const groupIds = new Set(diffs.map(d => d.remote.id))
    setSelectedIds(prev => {
      const toRemove = new Set<string>()
      const toAdd: string[] = []
      const prevSet = new Set(prev)
      for (const id of groupIds) {
        if (prevSet.has(id)) {
          toRemove.add(id)
        } else {
          toAdd.push(id)
        }
      }
      return [...prev.filter(id => !toRemove.has(id)), ...toAdd]
    })
  }, [])

  return {
    pullDiffs,
    selectedIds,
    emptyFolders,
    diffTab,
    setDiffTab,
    openReview,
    cancelPullReview,
    applySelected,
    toggleId,
    selectAllInGroup,
    invertSelectionInGroup,
  }
}
