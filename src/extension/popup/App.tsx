import { useState, useEffect, useCallback } from 'react'
import type { Bookmark, AppConfig } from '../../shared/types'

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

  // 从 Service Worker 获取最新数据
  const loadData = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.config) {
        setConfig(response.config)
      } else {
        setConfig(null)
      }
    })

    chrome.storage.local.get(['bookmarks', 'lastSync'], (result) => {
      const items = (result.bookmarks ?? []) as Bookmark[]
      setBookmarks(items)
      setFiltered(items)
      setLoading(false)
      if (result.lastSync) {
        setSyncStatus(`上次同步: ${new Date(result.lastSync as string).toLocaleString('zh-CN')}`)
      }
    })
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // 监听 storage 变化
  useEffect(() => {
    const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.bookmarks) {
        const items = changes.bookmarks.newValue as Bookmark[]
        setBookmarks(items)
      }
      if (changes.lastSync) {
        setSyncStatus(`上次同步: ${new Date(changes.lastSync.newValue as string).toLocaleString('zh-CN')}`)
      }
    }
    chrome.storage.onChanged.addListener(listener)
    return () => chrome.storage.onChanged.removeListener(listener)
  }, [])

  // 搜索过滤
  useEffect(() => {
    if (!search) {
      setFiltered(bookmarks)
      return
    }
    const q = search.toLowerCase()
    setFiltered(
      bookmarks.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.url.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      )
    )
  }, [search, bookmarks])

  const handleSync = () => {
    chrome.runtime.sendMessage({ type: 'SYNC_MANUAL' }, (result) => {
      if (result?.timestamp) {
        setSyncStatus(`上次同步: ${new Date(result.timestamp).toLocaleString('zh-CN')}`)
      }
      loadData()
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
      {/* 未配置状态 */}
      {!isConfigured ? (
        <div style={{ textAlign: 'center', padding: '2rem 0.5rem' }}>
          <p style={{ color: '#555', marginBottom: '0.5rem' }}>
            🔧 请先配置 GitHub 仓库连接
          </p>
          <p style={{ fontSize: '0.8rem', color: '#888', marginBottom: '1rem' }}>
            需要 GitHub Token、仓库 Owner 和名称
          </p>
          <p style={{ fontSize: '0.75rem', color: '#ccc', marginBottom: '1rem' }}>
            {config ? `已读取配置: token=${config.githubToken ? '***' : '空'}, owner=${config.repoOwner || '空'}, repo=${config.repoName || '空'}` : '无法连接到后台服务'}
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
            <button onClick={handleSaveCurrent} title="保存当前页面">
              ＋
            </button>
            <button onClick={handleSync} title="同步">
              ↻
            </button>
            <button onClick={openOptions} title="设置">
              ⚙
            </button>
          </div>

          {/* 书签列表 */}
          <div style={{ maxHeight: 400, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <p style={{ color: '#888', textAlign: 'center', padding: '1rem' }}>
                {search ? '未找到匹配的书签' : '暂无书签，点击 ＋ 保存当前页面'}
              </p>
            ) : (
              filtered.map((b) => (
                <div
                  key={b.id}
                  style={{
                    padding: '0.375rem 0.25rem',
                    borderBottom: '1px solid #eee',
                  }}
                >
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      textDecoration: 'none',
                      color: '#1a73e8',
                      fontWeight: 500,
                      fontSize: '0.875rem',
                      display: 'block',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {b.title}
                  </a>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      color: '#888',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                  >
                    {b.url}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* 同步状态栏 */}
          {syncStatus && (
            <div
              style={{
                fontSize: '0.7rem',
                color: '#aaa',
                textAlign: 'center',
                paddingTop: '0.25rem',
                borderTop: '1px solid #eee',
                marginTop: '0.25rem',
              }}
            >
              {syncStatus}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default App
