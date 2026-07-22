import { useState, useCallback, useEffect } from 'react'
import { useConfig } from './hooks/useConfig'
import { useBookmarkNavigation } from './hooks/useBookmarkNavigation'
import { useBookmarkStats } from './hooks/useBookmarkStats'
import { useSync } from './hooks/useSync'
import { useDiffReview } from './hooks/useDiffReview'
import { Toolbar } from './components/Toolbar'
import { BreadcrumbNav } from './components/BreadcrumbNav'
import { BookmarkList } from './components/BookmarkList'
import { BookmarkStats } from './components/BookmarkStats'
import { DiffReviewPanel } from './components/DiffReviewPanel'
import { FolderPicker } from './components/FolderPicker'
import { LoadingView } from './components/LoadingView'
import { UnconfiguredView } from './components/UnconfiguredView'
import { ThemeProvider, useTheme } from './theme'

function openOptions() {
  chrome.runtime.openOptionsPage()
}

/**
 * 外层：读取配置后注入 ThemeProvider
 */
function App() {
  const { config } = useConfig()
  return (
    <ThemeProvider themeMode={config?.theme ?? 'system'}>
      <AppShell />
    </ThemeProvider>
  )
}

/**
 * 内层：所有状态 / 效果 / 渲染逻辑，可安全调用 useTheme()
 */
function AppShell() {
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [initialSaveTitle, setInitialSaveTitle] = useState('')
  const [saveTabUrl, setSaveTabUrl] = useState('')
  const [syncSteps, setSyncSteps] = useState<string[] | null>(null)
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
  const stats = useBookmarkStats()
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
  const { styles, colors } = useTheme()

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
  const onPush = () => handlePush(setSyncStatus, setSyncSteps)

  const onPull = async () => {
    const res = await handlePull(setSyncStatus, setSyncSteps)
    if (res.success && res.diffs.length > 0) {
      setSyncSteps(null)
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
    applySelected(config?.cleanEmptyFolders ?? true, currentFolder.id, loadFolder, setSyncStatus, setSyncSteps)
  }

  // ---- 将状态消息中的 emoji 转为终端色彩 ----
  const renderStatus = (msg: string) => {
    if (!msg) return null
    let color: string | undefined
    let prefix: string | undefined

    if (msg.startsWith('✅')) {
      color = colors.green; prefix = '✓'
    } else if (msg.startsWith('❌')) {
      color = colors.red; prefix = '✗'
    } else if (msg.startsWith('🔄')) {
      color = colors.orange; prefix = '⟳'
    } else {
      color = colors.textMuted; prefix = '→'
    }

    const text = msg.replace(/^[✅❌🔄]/, '').trim()

    return (
      <span style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', width: '100%' }}>
        <span style={color ? { ...styles.statusDot, background: color, boxShadow: `0 0 4px ${color}60` } : undefined} />
        <span>{prefix}</span>
        {text}
      </span>
    )
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

      {isHomeView && <BookmarkStats stats={stats} />}

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
          {renderStatus(syncStatus)}
        </div>
      )}

      {syncSteps && syncSteps.length > 0 && (
        <div style={styles.syncLog}>
          <div style={styles.syncLogHeader}>
            <span>
              <span style={{ color: colors.accent }}>▼</span> 执行日志
            </span>
            <span style={styles.syncLogClose} onClick={() => setSyncSteps(null)}>✕</span>
          </div>
          <div style={styles.syncLogBody}>
            {syncSteps.map((step, i) => (
              <div key={i} style={styles.syncLogItem}>
                <span style={{ color: colors.textDim }}>[{i + 1}]</span> {step}
              </div>
            ))}
          </div>
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
