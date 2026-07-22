import { useState, useEffect, useCallback } from 'react'
import type { AppConfig, SyncResult, BookmarkDiff, PullDiffResult } from '../../shared/types'

// ---- Constants ----
const BOOKMARKS_BAR_ID = '1'
const OTHER_BOOKMARKS_ID = '2'
const MOBILE_BOOKMARKS_ID = '3'

const ROOT_FOLDER_META: Record<string, string> = {
  [OTHER_BOOKMARKS_ID]: '其他书签',
  [MOBILE_BOOKMARKS_ID]: '移动设备书签',
}

const DIFF_LABEL: Record<string, string> = { added: '新增', deleted: '删除', modified: '修改' }
const DIFF_COLOR: Record<string, string> = { added: '#388e3c', deleted: '#d32f2f', modified: '#f57c00' }

// ---- Helpers ----
function openOptions() {
  chrome.runtime.openOptionsPage()
}

async function getFolderChildren(folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  const [node] = await chrome.bookmarks.getSubTree(folderId)
  return node.children ?? []
}

function isFolderNode(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  return !node.url && !!node.children
}

// ---- Styles ----
const styles = {
  container: {
    width: 400,
    padding: '14px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    background: '#ffffff',
    color: '#202124',
    fontSize: '13px',
    lineHeight: 1.5,
  } as React.CSSProperties,

  toolbar: {
    display: 'flex',
    gap: '4px',
    alignItems: 'center',
    marginBottom: '10px',
    paddingBottom: '10px',
    borderBottom: '1px solid #e8eaed',
  } as React.CSSProperties,

  iconBtn: {
    width: 30,
    height: 30,
    border: 'none',
    borderRadius: '8px',
    background: 'transparent',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '15px',
    color: '#5f6368',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  iconBtnDisabled: {
    opacity: 0.4,
    cursor: 'not-allowed',
  } as React.CSSProperties,

  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginBottom: '12px',
    fontSize: '12px',
    color: '#5f6368',
    flexWrap: 'wrap' as const,
    minHeight: 26,
  },

  backBtn: {
    cursor: 'pointer',
    border: 'none',
    background: '#f1f3f4',
    borderRadius: '6px',
    padding: '3px 10px',
    fontSize: '12px',
    color: '#5f6368',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '2px',
    marginRight: '2px',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  breadcrumbItem: {
    cursor: 'pointer',
    color: '#1a73e8',
    textDecoration: 'none',
    padding: '2px 6px',
    borderRadius: '4px',
    fontSize: '12px',
    maxWidth: 120,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    transition: 'background 0.15s',
  } as React.CSSProperties,

  breadcrumbSep: {
    color: '#9aa0a6',
    fontSize: '10px',
    userSelect: 'none' as const,
  },

  currentLabel: {
    color: '#202124',
    fontWeight: 500,
    fontSize: '12px',
    padding: '2px 4px',
    maxWidth: 140,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  tagContainer: {
    display: 'flex',
    flexWrap: 'wrap' as const,
    gap: '8px',
    marginBottom: '8px',
  },

  folderTag: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '5px',
    padding: '7px 16px',
    borderRadius: '20px',
    background: '#f1f3f4',
    color: '#3c4043',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    border: '1px solid #e0e0e0',
    transition: 'background 0.15s, border-color 0.15s, box-shadow 0.15s',
    userSelect: 'none' as const,
    maxWidth: 260,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  bookmarkRow: {
    padding: '8px 4px',
    borderBottom: '1px solid #f0f0f0',
    cursor: 'pointer',
    transition: 'background 0.15s',
  } as React.CSSProperties,

  bookmarkTitle: {
    textDecoration: 'none',
    color: '#1a73e8',
    fontWeight: 500,
    fontSize: '13px',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  bookmarkMeta: {
    fontSize: '11px',
    color: '#9aa0a6',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    marginTop: '2px',
  },

  sectionLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0a6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '6px',
    marginTop: '2px',
  },

  empty: {
    color: '#9aa0a6',
    textAlign: 'center' as const,
    padding: '24px 0',
    fontSize: '13px',
  },

  footerDivider: {
    borderTop: '1px solid #e8eaed',
    margin: '10px 0',
  },

  footerLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0a6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    marginBottom: '8px',
  },

  status: {
    fontSize: '12px',
    color: '#5f6368',
    textAlign: 'center' as const,
    paddingTop: '8px',
    borderTop: '1px solid #e8eaed',
    marginTop: '2px',
  },

  statusLoading: {
    fontSize: '12px',
    color: '#e37400',
  },

  center: {
    textAlign: 'center' as const,
    padding: '40px 14px',
    color: '#9aa0a6',
  },

  /** 差异审核 UI 样式 */
  diffContainer: {
    width: 400,
    padding: '12px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  } as React.CSSProperties,

  diffHeader: {
    fontWeight: 600,
    fontSize: '14px',
    marginBottom: '6px',
    color: '#202124',
  },

  diffSub: {
    fontSize: '12px',
    color: '#5f6368',
    marginBottom: '8px',
  },

  diffList: {
    maxHeight: 360,
    overflowY: 'auto' as const,
    marginBottom: '8px',
  },

  diffGroupLabel: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '4px',
    marginTop: '4px',
  },

  diffGroupTitle: {
    fontSize: '12px',
    fontWeight: 600,
  },

  diffActions: {
    fontSize: '11px',
    display: 'flex',
    gap: 8,
  },

  diffActionLink: {
    cursor: 'pointer' as const,
    color: '#1a73e8',
    textDecoration: 'none' as const,
  },

  diffItem: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 6,
    padding: '5px 0',
    borderBottom: '1px solid #f0f0f0',
  },

  diffCheckbox: {
    marginTop: 2,
    flexShrink: 0,
  },

  diffContent: {
    flex: 1,
    minWidth: 0,
  },

  diffTitle: {
    fontSize: '12px',
    fontWeight: 500,
    color: '#333',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
  },

  diffChanges: {
    fontSize: '11px',
    color: '#888',
    marginTop: 2,
  },

  diffBottom: {
    display: 'flex',
    gap: '6px',
    justifyContent: 'flex-end' as const,
    borderTop: '1px solid #eee',
    paddingTop: '6px',
  },

  /** Tab 栏样式 */
  tabBar: {
    display: 'flex',
    gap: '2px',
    marginBottom: '8px',
    borderBottom: '2px solid #e8eaed',
  } as React.CSSProperties,

  tabItem: {
    padding: '5px 10px',
    fontSize: '11px',
    fontWeight: 500,
    cursor: 'pointer' as const,
    border: 'none',
    background: 'transparent',
    color: '#5f6368',
    borderBottom: '2px solid transparent',
    marginBottom: '-2px',
    transition: 'color 0.15s, border-color 0.15s',
    whiteSpace: 'nowrap' as const,
  } as React.CSSProperties,

  tabItemActive: {
    color: '#1a73e8',
    borderBottomColor: '#1a73e8',
  } as React.CSSProperties,

  emptyFolderWarning: {
    background: '#fff3e0',
    border: '1px solid #ffe0b2',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#e65100',
    lineHeight: 1.5,
  } as React.CSSProperties,

  emptyFolderDisabled: {
    background: '#f5f5f5',
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '8px 10px',
    marginBottom: '8px',
    fontSize: '11px',
    color: '#888',
    lineHeight: 1.5,
  } as React.CSSProperties,

  emptyFolderItem: {
    padding: '4px 0',
    fontSize: '12px',
    color: '#5f6368',
    borderBottom: '1px solid #f0f0f0',
  } as React.CSSProperties,

  btnSecondary: {
    padding: '6px 14px',
    border: '1px solid #dadce0',
    borderRadius: '6px',
    background: '#fff',
    cursor: 'pointer' as const,
    fontSize: '12px',
    color: '#3c4043',
  },

  btnPrimary: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    background: '#1a73e8',
    color: '#fff',
    cursor: 'pointer' as const,
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,

  btnPrimaryDisabled: {
    padding: '6px 14px',
    border: 'none',
    borderRadius: '6px',
    background: '#c4c7cc',
    color: '#fff',
    cursor: 'not-allowed' as const,
    fontSize: '12px',
    fontWeight: 500,
  } as React.CSSProperties,
}

// ---- Component ----
function App() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [pushLoading, setPushLoading] = useState(false)

  // 导航状态
  const [currentFolder, setCurrentFolder] = useState<{ id: string; title: string }>({
    id: BOOKMARKS_BAR_ID,
    title: '书签栏',
  })
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string }>>([])
  const [currentItems, setCurrentItems] = useState<chrome.bookmarks.BookmarkTreeNode[]>([])

  // 差异审核状态
  const [pullDiffs, setPullDiffs] = useState<BookmarkDiff[] | null>(null)
  const [pullLoading, setPullLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [emptyFolders, setEmptyFolders] = useState<string[]>([])
  const [diffTab, setDiffTab] = useState<'added' | 'deleted' | 'modified' | 'empty'>('added')

  const isHomeView = breadcrumbs.length === 0 && currentFolder.id === BOOKMARKS_BAR_ID

  const loadFolder = useCallback(async (id: string) => {
    const children = await getFolderChildren(id)
    setCurrentItems(children)
  }, [])

  const init = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.config) setConfig(response.config)
      else setConfig(null)
    })

    loadFolder(BOOKMARKS_BAR_ID)

    chrome.storage.local.get(['lastSync', 'syncLog'], (result) => {
      const log = result.syncLog as SyncResult | undefined
      if (log) {
        if (log.success && log.timestamp) {
          setSyncStatus(`✅ 同步成功 — ${new Date(log.timestamp).toLocaleString('zh-CN')}`)
        } else if (log.error) {
          setSyncStatus(`❌ ${log.error}`)
        }
      } else if (result.lastSync) {
        setSyncStatus(`上次同步: ${new Date(result.lastSync as string).toLocaleString('zh-CN')}`)
      }
    })

    setLoading(false)
  }, [loadFolder])

  useEffect(() => { init() }, [init])

  // ---- 导航操作 ----
  const enterFolder = useCallback(async (id: string, title: string) => {
    setBreadcrumbs(prev => [...prev, currentFolder])
    setCurrentFolder({ id, title })
    await loadFolder(id)
  }, [currentFolder, loadFolder])

  const goBack = useCallback(async () => {
    if (breadcrumbs.length === 0) return
    const prev = breadcrumbs[breadcrumbs.length - 1]
    setBreadcrumbs(prev2 => prev2.slice(0, -1))
    setCurrentFolder(prev)
    await loadFolder(prev.id)
  }, [breadcrumbs, loadFolder])

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    const target = breadcrumbs[index]
    setBreadcrumbs(prev => prev.slice(0, index))
    setCurrentFolder(target)
    await loadFolder(target.id)
  }, [breadcrumbs, loadFolder])

  const openBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url })
  }, [])

  // ---- 同步操作 ----
  const handlePush = () => {
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
  }

  const handlePull = () => {
    setPullLoading(true)
    setSyncStatus('🔄 从 GitHub 拉取...')
    chrome.runtime.sendMessage({ type: 'PULL_FROM_GITHUB' }, (res: PullDiffResult) => {
      setPullLoading(false)
      if (res.success) {
        if (res.diffs.length === 0) {
          setSyncStatus('✅ 远程无变更，本地已是最新')
        } else {
          setPullDiffs(res.diffs)
          setSelectedIds(res.diffs.map(d => d.remote.id))
          setEmptyFolders(res.emptyFolders ?? [])
          setSyncStatus(null)
        }
      } else {
        setSyncStatus(`❌ 拉取失败: ${res.error}`)
      }
    })
  }

  const handleSaveCurrent = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0]
      if (!tab?.url || !tab?.title) return

      await chrome.bookmarks.create({
        parentId: '2',
        title: tab.title,
        url: tab.url,
      })

      // 保存后刷新当前视图
      await loadFolder(currentFolder.id)
    })
  }

  // ---- 差异审核操作 ----
  useEffect(() => {
    if (!pullDiffs) return
    // 重置为第一个有内容的 tab
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

  const cancelPullReview = () => {
    setPullDiffs(null)
    setSelectedIds([])
    setEmptyFolders([])
    setDiffTab('added')
  }

  const applySelected = async () => {
    const selectedDiffs = pullDiffs!.filter(d => selectedIds.includes(d.remote.id))
    chrome.runtime.sendMessage({
      type: 'APPLY_PULL_DIFFS',
      selectedDiffs,
      cleanEmptyFolders: config?.cleanEmptyFolders ?? true,
    }, async (res: SyncResult) => {
      if (res.success) {
        setSyncStatus(`✅ 已应用 ${selectedDiffs.length} 项变更 — ${new Date(res.timestamp).toLocaleString('zh-CN')}`)
        // 刷新当前文件夹视图，使变更立即生效
        await loadFolder(currentFolder.id)
      } else {
        setSyncStatus(`❌ 应用失败: ${res.error}`)
      }
      setPullDiffs(null)
      setSelectedIds([])
      setEmptyFolders([])
    })
  }

  const toggleId = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const selectAllInGroup = (diffs: BookmarkDiff[]) => {
    const groupIds = diffs.map(d => d.remote.id)
    setSelectedIds(prev => {
      const merged = new Set(prev)
      groupIds.forEach(id => merged.add(id))
      return Array.from(merged)
    })
  }

  const invertSelectionInGroup = (diffs: BookmarkDiff[]) => {
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
  }

  // ==================== 渲染：差异审核 UI ====================
  if (pullDiffs) {
    const groups = {
      added: pullDiffs.filter(d => d.type === 'added'),
      deleted: pullDiffs.filter(d => d.type === 'deleted'),
      modified: pullDiffs.filter(d => d.type === 'modified'),
    }
    const selectedCount = selectedIds.length
    const totalCount = pullDiffs.length
    const cleanEnabled = config?.cleanEmptyFolders ?? true

    const tabs = [
      { key: 'added' as const, label: '新增', count: groups.added.length, color: DIFF_COLOR.added },
      { key: 'deleted' as const, label: '删除', count: groups.deleted.length, color: DIFF_COLOR.deleted },
      { key: 'modified' as const, label: '修改', count: groups.modified.length, color: DIFF_COLOR.modified },
      { key: 'empty' as const, label: '🗑 空文件夹', count: emptyFolders.length, color: '#9c27b0' },
    ].filter(t => t.count > 0)

    const activeTab: typeof diffTab = tabs.some(t => t.key === diffTab) ? diffTab : tabs[0]?.key ?? 'added'

    const renderTabContent = () => {
      if (activeTab === 'empty') {
        return (
          <div>
            {cleanEnabled ? (
              <div style={styles.emptyFolderWarning}>
                ⚠️ 以下文件夹在应用变更后将变空，会根据当前配置<b>自动清理删除</b>。
                如需关闭此行为，请在设置中取消「应用差异后自动清理空文件夹」。
              </div>
            ) : (
              <div style={styles.emptyFolderDisabled}>
                ℹ️ 以下文件夹在应用变更后将变空，但<b>自动清理已关闭</b>，文件夹将保留。
                如需启用，请在设置中勾选「应用差异后自动清理空文件夹」。
              </div>
            )}
            {emptyFolders.map(path => (
              <div key={path} style={styles.emptyFolderItem}>
                📁 {path}
              </div>
            ))}
          </div>
        )
      }

      // 新增/删除/修改 tab — 展示差异列表 + 全选/反选
      const items = groups[activeTab]
      return (
        <div>
          <div style={styles.diffGroupLabel}>
            <span style={{ ...styles.diffGroupTitle, color: DIFF_COLOR[activeTab] }}>
              {DIFF_LABEL[activeTab]} ({items.length})
            </span>
            <span style={styles.diffActions}>
              <a onClick={() => selectAllInGroup(items)} style={styles.diffActionLink}>全选</a>
              <a onClick={() => invertSelectionInGroup(items)} style={styles.diffActionLink}>反选</a>
            </span>
          </div>
          {items.map(d => (
            <div key={d.remote.id} style={styles.diffItem}>
              <input
                type="checkbox"
                checked={selectedIds.includes(d.remote.id)}
                onChange={() => toggleId(d.remote.id)}
                style={styles.diffCheckbox}
              />
              <div style={styles.diffContent}>
                <div style={styles.diffTitle}>
                  {d.remote.folder && d.remote.folder !== '/' ? `📁 ${d.remote.folder}/` : ''}{d.remote.title}
                </div>
                {d.type === 'modified' && d.changes && (
                  <div style={styles.diffChanges}>
                    {d.changes.map(c => (
                      <div key={c.field}>{c.field}: "{c.from}" → "{c.to}"</div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )
    }

    return (
      <div style={styles.diffContainer}>
        <div style={styles.diffHeader}>📥 从 GitHub 拉取结果</div>
        <div style={styles.diffSub}>共 {totalCount} 项变更，已选 {selectedCount} 项</div>

        {/* Tab 栏 */}
        <div style={styles.tabBar}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setDiffTab(t.key)}
              style={{
                ...styles.tabItem,
                ...(t.key === activeTab ? styles.tabItemActive : {}),
                color: t.key === activeTab ? t.color : '#5f6368',
                borderBottomColor: t.key === activeTab ? t.color : 'transparent',
              }}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Tab 内容 */}
        <div style={styles.diffList}>
          {renderTabContent()}
        </div>

        <div style={styles.diffBottom}>
          <button onClick={cancelPullReview} style={styles.btnSecondary}>✕ 取消</button>
          <button
            onClick={applySelected}
            disabled={selectedCount === 0}
            style={selectedCount === 0 ? styles.btnPrimaryDisabled : styles.btnPrimary}
          >
            ✓ 应用选中 ({selectedCount})
          </button>
        </div>
      </div>
    )
  }

  // ==================== 渲染：加载中 ====================
  if (loading) {
    return <div style={styles.center}>加载中...</div>
  }

  const isConfigured = config?.githubToken && config?.repoOwner && config?.repoName

  // ==================== 渲染：未配置 ====================
  if (!isConfigured) {
    return (
      <div style={{ ...styles.container, textAlign: 'center', padding: '2rem 1rem' }}>
        <p style={{ color: '#5f6368', margin: '0 0 8px 0', fontSize: '14px' }}>
          🔧 请先配置 GitHub 仓库连接
        </p>
        <p style={{ fontSize: '12px', color: '#9aa0a6', margin: '0 0 16px 0' }}>
          需要 GitHub Token、仓库 Owner 和名称
        </p>
        <button
          onClick={openOptions}
          style={{
            padding: '8px 20px',
            background: '#1a73e8',
            color: '#fff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 500,
          }}
        >
          前往设置
        </button>
      </div>
    )
  }

  // ==================== 渲染：主界面 ====================
  const folders = currentItems.filter(n => isFolderNode(n))
  const bookmarks = currentItems.filter(n => !isFolderNode(n))

  return (
    <div style={styles.container}>
      {/* 工具栏 */}
      <div style={styles.toolbar}>
        <span style={{ flex: 1, fontWeight: 600, fontSize: '13px', color: '#202124', letterSpacing: '0.3px' }}>
          Bookmarks Manager
        </span>
        <button onClick={handleSaveCurrent} style={styles.iconBtn} title="保存当前页面到其他书签">➕</button>
        <button
          onClick={handlePush}
          disabled={pushLoading}
          style={{ ...styles.iconBtn, ...(pushLoading ? styles.iconBtnDisabled : {}) }}
          title="同步到 GitHub（强制覆盖远程）"
        >
          {pushLoading ? '⋯' : '↑'}
        </button>
        <button
          onClick={handlePull}
          disabled={pullLoading}
          style={{ ...styles.iconBtn, ...(pullLoading ? styles.iconBtnDisabled : {}) }}
          title="从 GitHub 拉取（对比差异后手动合并）"
        >
          {pullLoading ? '⋯' : '↓'}
        </button>
        <button onClick={openOptions} style={styles.iconBtn} title="设置">⚙</button>
      </div>

      {/* 导航面包屑 */}
      {!isHomeView && (
        <div style={styles.nav}>
          <button onClick={goBack} style={styles.backBtn}>
            ← 返回
          </button>
          {breadcrumbs.map((crumb, i) => (
            <span key={crumb.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 0, maxWidth: '100%' }}>
              <span
                onClick={() => navigateToBreadcrumb(i)}
                style={styles.breadcrumbItem}
                title={crumb.title}
              >
                {crumb.title}
              </span>
              <span style={styles.breadcrumbSep}>›</span>
            </span>
          ))}
          <span style={styles.currentLabel} title={currentFolder.title}>
            {currentFolder.title}
          </span>
        </div>
      )}

      {/* 内容区 */}
      {currentItems.length === 0 ? (
        <div style={styles.empty}>暂无书签和文件夹</div>
      ) : (
        <>
          {folders.length > 0 && (
            <>
              <div style={styles.sectionLabel}>文件夹</div>
              <div style={styles.tagContainer}>
                {folders.map(f => (
                  <span
                    key={f.id}
                    style={styles.folderTag}
                    onClick={() => enterFolder(f.id, f.title)}
                    title={f.title}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = '#e2e4e7'
                      e.currentTarget.style.borderColor = '#ccc'
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = '#f1f3f4'
                      e.currentTarget.style.borderColor = '#e0e0e0'
                    }}
                  >
                    📁 {f.title}
                  </span>
                ))}
              </div>
            </>
          )}

          {bookmarks.length > 0 && (
            <>
              <div style={styles.sectionLabel}>书签</div>
              <div>
                {bookmarks.map(b => (
                  <div
                    key={b.id}
                    style={styles.bookmarkRow}
                    onClick={() => openBookmark(b.url!)}
                    onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa' }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
                  >
                    <span style={styles.bookmarkTitle}>
                      {b.title || '无标题'}
                    </span>
                    <span style={styles.bookmarkMeta}>{b.url}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {/* 首页底部：其他书签 + 移动设备书签 */}
      {isHomeView && (
        <>
          <div style={styles.footerDivider} />
          <div style={styles.footerLabel}>根级文件夹</div>
          <div style={styles.tagContainer}>
            {[OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID].map(id => (
              <span
                key={id}
                style={styles.folderTag}
                onClick={() => enterFolder(id, ROOT_FOLDER_META[id])}
                title={ROOT_FOLDER_META[id]}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#e2e4e7'
                  e.currentTarget.style.borderColor = '#ccc'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#f1f3f4'
                  e.currentTarget.style.borderColor = '#e0e0e0'
                }}
              >
                📁 {ROOT_FOLDER_META[id]}
              </span>
            ))}
          </div>
        </>
      )}

      {/* 同步状态 */}
      {syncStatus && (
        <div style={styles.status}>
          {syncStatus}
        </div>
      )}
    </div>
  )
}

export default App
