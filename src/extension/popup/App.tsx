import { useState, useEffect, useCallback } from 'react'
import type { Bookmark, AppConfig, SyncResult } from '../../shared/types'

function openOptions() {
  chrome.runtime.openOptionsPage()
}

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [search, setSearch] = useState('')
  const [filtered, setFiltered] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)
  const [syncSteps, setSyncSteps] = useState<string[]>([])

  // 启动时：加载配置 + 书签 + 同步日志
  const init = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.config) setConfig(response.config)
      else setConfig(null)
    })

    chrome.storage.local.get(['bookmarks', 'lastSync', 'syncLog'], (result) => {
      const items = (result.bookmarks ?? []) as Bookmark[]
      setBookmarks(items)
      setFiltered(items)
      setLoading(false)

      // 恢复上次同步日志
      const log = result.syncLog as SyncResult | undefined
      if (log) {
        if (log.success && log.timestamp) {
          setSyncStatus(`✅ 同步成功 — ${new Date(log.timestamp).toLocaleString('zh-CN')}`)
        } else if (log.error) {
          setSyncStatus(`❌ ${log.error}`)
        }
        setSyncSteps(log.steps ?? [])
      } else if (result.lastSync) {
        setSyncStatus(`上次同步: ${new Date(result.lastSync as string).toLocaleString('zh-CN')}`)
      }
    })
  }, [])

  useEffect(() => { init() }, [init])

  // 监听 storage 变化
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.bookmarks) {
        setBookmarks(changes.bookmarks.newValue as Bookmark[])
        setFiltered(changes.bookmarks.newValue as Bookmark[])
      }
      // syncLog 变更时更新 UI
      if (changes.syncLog) {
        const log = changes.syncLog.newValue as SyncResult | undefined
        if (log) {
          if (log.success && log.timestamp) {
            setSyncStatus(`✅ 同步成功 — ${new Date(log.timestamp).toLocaleString('zh-CN')}`)
          } else if (log.error) {
            setSyncStatus(`❌ ${log.error}`)
          }
          setSyncSteps(log.steps ?? [])
        }
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!search) { setFiltered(bookmarks); return }
    const q = search.toLowerCase()
    setFiltered(bookmarks.filter(b =>
      b.title.toLowerCase().includes(q) ||
      b.url.toLowerCase().includes(q) ||
      b.tags.some(t => t.toLowerCase().includes(q))
    ))
  }, [search, bookmarks])

  // 点击同步
  const handleSync = () => {
    setSyncStatus('同步中...')
    setSyncSteps([])
    chrome.runtime.sendMessage({ type: 'SYNC_MANUAL' })
  }

  // 查看最新日志（popup 重新打开时自动执行，这里留作手动按钮）
  const refreshLog = () => {
    chrome.storage.local.get('syncLog', (r) => {
      const log = r.syncLog as SyncResult | undefined
      if (log) {
        if (log.success && log.timestamp) {
          setSyncStatus(`✅ 同步成功 — ${new Date(log.timestamp).toLocaleString('zh-CN')}`)
        } else if (log.error) {
          setSyncStatus(`❌ ${log.error}`)
        }
        setSyncSteps(log.steps ?? [])
      }
    })
  }

  const handleSaveCurrent = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0]
      if (!tab?.url || !tab?.title) return

      const newBookmark: Bookmark = {
        id: crypto.randomUUID(),
        title: tab.title,
        url: tab.url,
        folder: '/',
        tags: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      const updated = [newBookmark, ...bookmarks]
      setBookmarks(updated)
      setFiltered(updated)
      chrome.storage.local.set({ bookmarks: updated })
    })
  }

  if (loading) {
    return <div style={{ padding: '1rem', fontFamily: 'system-ui, sans-serif', color: '#888' }}>加载中...</div>
  }

  const isConfigured = config?.githubToken && config?.repoOwner && config?.repoName

  return (
    <div style={{ width: 360, padding: '0.5rem', fontFamily: 'system-ui, sans-serif' }}>
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
          <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '0.5rem' }}>
            <input
              type="search"
              placeholder="搜索书签..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ flex: 1, padding: '0.25rem 0.5rem' }}
            />
            <button onClick={handleSaveCurrent} title="保存当前页面">＋</button>
            <button onClick={handleSync} title="同步">↻</button>
            <button onClick={refreshLog} title="刷新日志" style={{fontSize:'0.7rem'}}>📋</button>
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

          {/* 调试步骤 */}
          {syncSteps.length > 0 && (
            <div style={{
              fontSize: '0.65rem', background: '#f5f5f5', borderRadius: 4,
              padding: '0.375rem 0.5rem', marginTop: '0.25rem',
              maxHeight: 150, overflowY: 'auto', fontFamily: 'monospace',
              lineHeight: 1.4,
            }}>
              {syncSteps.map((s, i) => (
                <div key={i}>{i + 1}. {s}</div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
