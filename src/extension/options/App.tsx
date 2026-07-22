import { useState, useEffect } from 'react'
import type { AppConfig } from '../../shared/types'
import { DEFAULT_CONFIG } from '../../shared/types'

function App() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('config', (result) => {
      if (result.config) {
        setConfig({ ...DEFAULT_CONFIG, ...result.config })
      }
    })
  }, [])

  const save = () => {
    chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', config }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div style={{ maxWidth: 480, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem' }}>Bookmarks Manager 设置</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}
        >
          GitHub Token
        </label>
        <input
          type="password"
          value={config.githubToken}
          onChange={(e) => setConfig({ ...config, githubToken: e.target.value })}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="ghp_..."
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}
        >
          仓库 Owner
        </label>
        <input
          type="text"
          value={config.repoOwner}
          onChange={(e) => setConfig({ ...config, repoOwner: e.target.value })}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="LeonidasLux"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}
        >
          仓库名称
        </label>
        <input
          type="text"
          value={config.repoName}
          onChange={(e) => setConfig({ ...config, repoName: e.target.value })}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="bookmarks-manager"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}
        >
          自动同步间隔（小时）
        </label>
        <input
          type="number"
          value={config.syncIntervalHours}
          onChange={(e) =>
            setConfig({ ...config, syncIntervalHours: Number(e.target.value) })
          }
          min={1}
          max={168}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={config.autoSyncOnLoad}
            onChange={(e) => setConfig({ ...config, autoSyncOnLoad: e.target.checked })}
          />
          <span style={{ fontWeight: 500 }}>扩展加载时自动同步书签到 GitHub</span>
        </label>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.25rem 0 0 1.5rem' }}>
          启用后，浏览器启动或扩展更新时自动执行一次同步
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
        >
          <input
            type="checkbox"
            checked={config.cleanEmptyFolders}
            onChange={(e) => setConfig({ ...config, cleanEmptyFolders: e.target.checked })}
          />
          <span style={{ fontWeight: 500 }}>应用差异后自动清理空文件夹</span>
        </label>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.25rem 0 0 1.5rem' }}>
          删除或移走书签后，若原文件夹变空则自动删除该文件夹
        </p>
      </div>

      <button
        onClick={save}
        style={{
          padding: '0.5rem 1.5rem',
          background: '#1a73e8',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        保存
      </button>

      {saved && (
        <span style={{ marginLeft: '0.75rem', color: '#388e3c' }}>✓ 已保存</span>
      )}
    </div>
  )
}

export default App
