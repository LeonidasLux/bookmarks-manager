import { useState, useCallback, useEffect } from 'react'
import { useConfig } from './hooks/useConfig'
import { useBookmarkNavigation } from './hooks/useBookmarkNavigation'
import { useSync } from './hooks/useSync'
import { useDiffReview } from './hooks/useDiffReview'
import { Toolbar } from './components/Toolbar'
import { BreadcrumbNav } from './components/BreadcrumbNav'
import { BookmarkList } from './components/BookmarkList'
import { DiffReviewPanel } from './components/DiffReviewPanel'
import { FolderPicker } from './components/FolderPicker'
import { LoadingView } from './components/LoadingView'
import { UnconfiguredView } from './components/UnconfiguredView'
import { styles } from './styles'

function openOptions() {
  chrome.runtime.openOptionsPage()
}

function App() {
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [initialSaveTitle, setInitialSaveTitle] = useState('')
  const [saveTabUrl, setSaveTabUrl] = useState('')
  const { config, loading, syncStatus, setSyncStatus, isConfigured } = useConfig()
  const {
    currentFolder,
    breadcrumbs,
    currentItems,
    isHomeView,
    loadFolder,
    enterFolder,
    goBack,
    navigateToBreadcrumb,
    openBookmark,
  } = useBookmarkNavigation()
  const { pushLoading, pullLoading, handlePush, handlePull, handleSaveCurrent, getCurrentTabInfo } = useSync()
  const {
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
  } = useDiffReview()

  // ---- 快捷键：挂载时检查是否有待处理的保存请求 ----
  const triggerSaveBookmark = useCallback(async () => {
    await chrome.storage.local.remove('pendingSaveBookmark')
    const info = await getCurrentTabInfo()
    if (info) {
      setInitialSaveTitle(info.title)
      setSaveTabUrl(info.url)
      setShowFolderPicker(true)
    } else {
      setSyncStatus('❌ 无法获取当前标签页信息')
    }
  }, [getCurrentTabInfo, setSyncStatus])

  useEffect(() => {
    chrome.storage.local.get('pendingSaveBookmark', async (result) => {
      if (!result.pendingSaveBookmark) return
      await triggerSaveBookmark()
    })
  }, [triggerSaveBookmark])

  // 监听后台发送的 TRIGGER_SAVE_BOOKMARK 消息（popup 已打开时）
  useEffect(() => {
    const handler = (msg: { type: string }) => {
      if (msg.type === 'TRIGGER_SAVE_BOOKMARK') {
        triggerSaveBookmark()
      }
    }
    chrome.runtime.onMessage.addListener(handler)
    return () => chrome.runtime.onMessage.removeListener(handler)
  }, [triggerSaveBookmark])

  // ---- 同步操作包装 ----
  const onPush = () => handlePush(setSyncStatus)

  const onPull = async () => {
    const res = await handlePull(setSyncStatus)
    if (res.success && res.diffs.length > 0) {
      openReview(res.diffs, res.emptyFolders ?? [])
    }
  }

  const onStartSave = useCallback(async () => {
    const info = await getCurrentTabInfo()
    if (!info) {
      setSyncStatus('❌ 无法获取当前标签页信息')
      return
    }
    setInitialSaveTitle(info.title)
    setSaveTabUrl(info.url)
    setShowFolderPicker(true)
  }, [getCurrentTabInfo, setSyncStatus])

  const onSaveToFolder = async (folderId: string, title: string) => {
    setShowFolderPicker(false)
    await handleSaveCurrent(folderId, title, saveTabUrl, currentFolder.id, loadFolder, setSyncStatus)
  }

  const onApplySelected = () => {
    applySelected(config?.cleanEmptyFolders ?? true, currentFolder.id, loadFolder, setSyncStatus)
  }

  // ---- 渲染 ----
  if (pullDiffs) {
    return (
      <DiffReviewPanel
        pullDiffs={pullDiffs}
        selectedIds={selectedIds}
        emptyFolders={emptyFolders}
        diffTab={diffTab}
        cleanEnabled={config?.cleanEmptyFolders ?? true}
        onTabChange={setDiffTab}
        onToggleId={toggleId}
        onSelectAllInGroup={selectAllInGroup}
        onInvertSelectionInGroup={invertSelectionInGroup}
        onCancel={cancelPullReview}
        onApply={onApplySelected}
      />
    )
  }

  if (loading) {
    return <LoadingView />
  }

  if (!isConfigured) {
    return <UnconfiguredView onOpenOptions={openOptions} />
  }

  return (
    <div style={styles.container}>
      <Toolbar
        pushLoading={pushLoading}
        pullLoading={pullLoading}
        onSaveCurrent={onStartSave}
        onPush={onPush}
        onPull={onPull}
        onOpenOptions={openOptions}
      />

      {!isHomeView && (
        <BreadcrumbNav
          breadcrumbs={breadcrumbs}
          currentFolderTitle={currentFolder.title}
          onGoBack={goBack}
          onNavigateToBreadcrumb={navigateToBreadcrumb}
        />
      )}

      <BookmarkList
        currentItems={currentItems}
        isHomeView={isHomeView}
        onEnterFolder={enterFolder}
        onOpenBookmark={openBookmark}
      />

      {syncStatus && (
        <div style={styles.status}>
          {syncStatus}
        </div>
      )}

      {showFolderPicker && (
        <FolderPicker
          initialTitle={initialSaveTitle}
          onSave={onSaveToFolder}
          onCancel={() => setShowFolderPicker(false)}
        />
      )}
    </div>
  )
}

export default App
