import { useConfigForm } from './hooks/useConfigForm'
import { useCommands } from './hooks/useCommands'

function App() {
  const { config, saved, save, updateField } = useConfigForm()
  const { commands } = useCommands()

  return (
    <div style={{ maxWidth: 520, margin: '2rem auto', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '1.25rem' }}>Bookmarks Manager 设置</h1>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          GitHub Token
        </label>
        <input
          type="password"
          value={config.githubToken}
          onChange={(e) => updateField('githubToken', e.target.value)}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="ghp_..."
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          仓库 Owner
        </label>
        <input
          type="text"
          value={config.repoOwner}
          onChange={(e) => updateField('repoOwner', e.target.value)}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="LeonidasLux"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          仓库名称
        </label>
        <input
          type="text"
          value={config.repoName}
          onChange={(e) => updateField('repoName', e.target.value)}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
          placeholder="my-bookmarks"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.25rem', fontWeight: 500 }}>
          自动同步间隔（小时）
        </label>
        <input
          type="number"
          value={config.syncIntervalHours}
          onChange={(e) => updateField('syncIntervalHours', Number(e.target.value))}
          min={1}
          max={168}
          style={{ width: '100%', padding: '0.375rem 0.5rem' }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.autoSyncOnLoad}
            onChange={(e) => updateField('autoSyncOnLoad', e.target.checked)}
          />
          <span style={{ fontWeight: 500 }}>扩展加载时自动同步书签到 GitHub</span>
        </label>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.25rem 0 0 1.5rem' }}>
          启用后，浏览器启动或扩展更新时自动执行一次同步
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={config.cleanEmptyFolders}
            onChange={(e) => updateField('cleanEmptyFolders', e.target.checked)}
          />
          <span style={{ fontWeight: 500 }}>应用差异后自动清理空文件夹</span>
        </label>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.25rem 0 0 1.5rem' }}>
          删除或移走书签后，若原文件夹变空则自动删除该文件夹
        </p>
      </div>

      {/* 快捷键设置 */}
      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: '#f8f9fa',
        borderRadius: '8px',
        border: '1px solid #e8eaed',
      }}>
        <h2 style={{ fontSize: '0.95rem', fontWeight: 600, margin: '0 0 0.5rem' }}>⌨ 快捷键</h2>
        <table style={{ width: '100%', fontSize: '0.875rem', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #dadce0' }}>
              <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500, color: '#5f6368' }}>功能</th>
              <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500, color: '#5f6368' }}>快捷键</th>
            </tr>
          </thead>
          <tbody>
            {commands.map(cmd => (
              <tr key={cmd.name}>
                <td style={{ padding: '0.375rem 0.5rem', color: '#202124' }}>{cmd.description || cmd.name}</td>
                <td style={{ padding: '0.375rem 0.5rem' }}>
                  <kbd style={{
                    padding: '2px 8px',
                    background: '#fff',
                    border: '1px solid #dadce0',
                    borderRadius: '4px',
                    fontSize: '0.8rem',
                    color: cmd.shortcut ? '#202124' : '#9aa0a6',
                    fontFamily: 'monospace',
                  }}>
                    {cmd.shortcut || '未设置'}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '0.8rem', color: '#888', margin: '0.5rem 0 0' }}>
          在 <a href="chrome://extensions/shortcuts" target="_blank" style={{ color: '#1a73e8' }}>chrome://extensions/shortcuts</a> 页面可自定义快捷键
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
