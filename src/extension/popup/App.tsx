import { useState, useEffect, useCallback } from 'react'
import type { Bookmark, AppConfig, SyncResult, BookmarkDiff, PullDiffResult } from '../../shared/types'

function openOptions() {
  chrome.runtime.openOptionsPage()
}

/** 从浏览器书签树展开为扁平列表 */
async function loadBrowserBookmarks(): Promise<Bookmark[]> {
  const tree = await chrome.bookmarks.getTree()
  const flat: Bookmark[] = []

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[], folderPath: string) {
    for (const node of nodes) {
      if (node.url) {
        flat.push({
          id: node.id,
          title: node.title,
          url: node.url,
          folder: folderPath || '/',
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
  return flat
}

const DIFF_LABEL: Record<string, string> = { added: '新增', deleted: '删除', modified: '修改' }
const DIFF_COLOR: Record<string, string> = { added: '#388e3c', deleted: '#d32f2f', modified: '#f57c00' }

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [pushLoading, setPushLoading] = useState(false)

  const [pullDiffs, setPullDiffs] = useState<BookmarkDiff[] | null>(null)
  const [pullLoading, setPullLoading] = useState(false)
  const [selectedIds, setSelectedIds] = useState<string[]>([])

  /** 刷新生浏览器书签到 state */
  const refresh = useCallback(async () => {
    const items = await loadBrowserBookmarks()
    setBookmarks(items)
    setFiltered(items)
    setLoading(false)
  }, [])

  const init = useCallback(() => {
    // 配置
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.config) setConfig(response.config)
      else setConfig(null)
    })

    // 直接从浏览器读取书签
    refresh()

    // 上次同步状态
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
  }, [refresh])

  useEffect(() => { init() }, [init])

  useEffect(() => {
    if (!search) { setFiltered(bookmarks); return }
    const q = search.toLowerCase()
    setFiltered(bookmarks.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    ))
  }, [search, bookmarks])

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
          setSyncStatus(null)
        }
      } else {
        setSyncStatus(`❌ 拉取失败: ${res.error}`)
      }
    })
  }

  const cancelPullReview = () => {
    setPullDiffs(null)
    setSelectedIds([])
  }

  const applySelected = async () => {
    const selectedDiffs = pullDiffs!.filter(d => selectedIds.includes(d.remote.id))
    chrome.runtime.sendMessage({ type: 'APPLY_PULL_DIFFS', selectedDiffs }, async (res: SyncResult) => {
      if (res.success) {
        setSyncStatus(`✅ 已应用 ${selectedDiffs.length} 项变更 — ${new Date(res.timestamp).toLocaleString('zh-CN')}`)
        await refresh() // 应用后重新读取浏览器书签
      } else {
        setSyncStatus(`❌ 应用失败: ${res.error}`)
      }
      setPullDiffs(null)
      setSelectedIds([])
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

  const handleSaveCurrent = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      const tab = tabs[0]
      if (!tab?.url || !tab?.title) return

      await chrome.bookmarks.create({
        parentId: '2', // "其他书签"
        title: tab.title,
        url: tab.url,
      })

      await refresh() // 新建后刷新列表
    })
  }

  // ---- 渲染差异审核 UI ----
  if (pullDiffs) {
    const groups = { added: pullDiffs.filter(d => d.type === 'added'), deleted: pullDiffs.filter(d => d.type === 'deleted'), modified: pullDiffs.filter(d => d.type === 'modified') }
    const selectedCount = selectedIds.length
    const totalCount = pullDiffs.length

    return (
      <div style={{ width: 380, padding: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.375rem', color: '#333' }}>
          📥 从 GitHub 拉取结果
        </div>

        <div style={{ fontSize: '0.75rem', color: '#888', marginBottom: '0.375rem' }}>
          共 {totalCount} 项变更，已选 {selectedCount} 项
        </div>

        <div style={{ maxHeight: 360, overflowY: 'auto', marginBottom: '0.375rem' }}>
          {(['added', 'deleted', 'modified'] as const).map(type => {
            const items = groups[type]
            if (items.length === 0) return null
            return (
              <div key={type} style={{ marginBottom: '0.375rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: DIFF_COLOR[type] }}>
                    {DIFF_LABEL[type]} ({items.length})
                  </span>
                  <span style={{ fontSize: '0.7rem', display: 'flex', gap: 6 }}>
                    <a onClick={() => selectAllInGroup(items)} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none' }}>
                      全选
                    </a>
                    <a onClick={() => invertSelectionInGroup(items)} style={{ cursor: 'pointer', color: '#1a73e8', textDecoration: 'none' }}>
                      反选
                    </a>
                  </span>
                </div>
                {items.map(d => (
                  <div key={d.remote.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 4, padding: '0.25rem 0', borderBottom: '1px solid #f0f0f0' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(d.remote.id)}
                      onChange={() => toggleId(d.remote.id)}
                      style={{ marginTop: 2, flexShrink: 0 }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 500, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {d.remote.folder && d.remote.folder !== '/' ? `📁 ${d.remote.folder}/` : ''}{d.remote.title}
                      </div>
                      {d.type === 'modified' && d.changes && (
                        <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 2 }}>
                          {d.changes.map(c => (
                            <div key={c.field}>{c.field}: &quot;{c.from}&quot; → &quot;{c.to}&quot;</div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '0.375rem', justifyContent: 'flex-end', borderTop: '1px solid #eee', paddingTop: '0.375rem' }}>
          <button onClick={cancelPullReview} style={{ padding: '0.375rem 0.75rem', border: '1px solid #ccc', borderRadius: 4, background: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
            ✕ 取消
          </button>
          <button onClick={applySelected} disabled={selectedCount === 0} style={{ padding: '0.375rem 0.75rem', border: 'none', borderRadius: 4, background: selectedCount === 0 ? '#ccc' : '#1a73e8', color: '#fff', cursor: selectedCount === 0 ? 'not-allowed' : 'pointer', fontSize: '0.8rem' }}>
            ✓ 应用选中 ({selectedCount})
          </button>
        </div>
      </div>
    )
  }

  // ---- 主界面 ----
  if (loading) {
    return <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif', color: '#888' }}>加载中...</div>
  }

  const isConfigured = config?.githubToken && config?.repoOwner && config?.repoName

  return (
    <div style={{ width: 380, padding: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
      {!isConfigured ? (
        <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
          <p style={{ color: '#555', marginBottom: '0.5rem' }}>
            🔧 请先配置 GitHub 仓库连接
          </p>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
            需要 GitHub Token、仓库 Owner 和名称
          </p>
          <button
            onClick={openOptions}
            style={{
              padding: '0.5rem 1rem',
              background: '#1a73e8',
              color: '#fff',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer',
              fontSize: '0.875rem',
            }}
          >
            前往设置
          </button>
        </div>
      ) : (
        <>
          {/* 工具栏 */}
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem', alignItems: 'center' }}>
            <input
              type="search"
              placeholder="搜索书签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '0.25rem 0.5rem' }}
            />
            <span style={{
              fontSize: '0.75rem', color: '#888', whiteSpace: 'nowrap',
              fontWeight: 500, minWidth: '2.5rem', textAlign: 'center',
            }}>
              {bookmarks.length}
            </span>
            <button onClick={handleSaveCurrent} title="保存当前页面">＋</button>
            <button onClick={handlePush} disabled={pushLoading} title="同步到 GitHub（强制覆盖远程）" style={{ fontSize: pushLoading ? '0.7rem' : undefined }}>
              {pushLoading ? '⋯' : '↑'}
            </button>
            <button onClick={handlePull} disabled={pullLoading} title="从 GitHub 拉取（对比差异后手动合并）" style={{ fontSize: pullLoading ? '0.7rem' : undefined }}>
              {pullLoading ? '⋯' : '↓'}
            </button>
            <button onClick={openOptions} title="设置">⚙</button>
          </div>

          {/* 书签列表 */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                {search ? '未找到匹配的书签' : '暂无书签'}
              </p>
            ) : (
              filtered.map((b) => (
                <div key={b.id} style={{ padding: '0.375rem 0.25rem', borderBottom: '1px solid #eee' }}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'none', color: '#1a73e8', fontWeight: 500,
                      fontSize: '0.875rem', display: 'block',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}
                  >
                    {b.title}
                  </a>
                  {b.folder && b.folder !== '/' && (
                    <span style={{
                      fontSize: '0.7rem', color: '#999',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                      marginTop: '1px',
                    }}>
                      📁 {b.folder}
                    </span>
                  )}
                  <span style={{
                    fontSize: '0.75rem', color: '#888',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block',
                  }}>
                    {b.url}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 同步状态栏 */}
          {syncStatus && (
            <div style={{
              fontSize: '0.75rem', color: '#555', textAlign: 'center',
              paddingTop: '0.375rem', borderTop: '1px solid #eee', marginTop: '0.375rem',
              fontWeight: 500,
            }}>
              {syncStatus}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
