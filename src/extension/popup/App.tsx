import { useConfig } from './hooks/useConfig'
import { useBookmarkNavigation } from './hooks/useBookmarkNavigation'
import { useSync } from './hooks/useSync'
import { useDiffReview } from './hooks/useDiffReview'
import { Toolbar } from './components/Toolbar'
import { BreadcrumbNav } from './components/BreadcrumbNav'
import { BookmarkList } from './components/BookmarkList'
import { DiffReviewPanel } from './components/DiffReviewPanel'
import { LoadingView } from './components/LoadingView'
import { UnconfiguredView } from './components/UnconfiguredView'
import { styles } from './styles'

function openOptions() {
  chrome.runtime.openOptionsPage()
}

function App() {
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
  const { pushLoading, pullLoading, handlePush, handlePull, handleSaveCurrent } = useSync()
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

  // ---- 同步操作包装 ----
  const onPush = () => handlePush(setSyncStatus)

  const onPull = async () => {
    const res = await handlePull(setSyncStatus)
    if (res.success && res.diffs.length > 0) {
      openReview(res.diffs, res.emptyFolders ?? [])
    }
  }

  const onSaveCurrent = () => handleSaveCurrent(currentFolder.id, loadFolder)

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
        onSaveCurrent={onSaveCurrent}
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
    </div>
  )
}

export default App
