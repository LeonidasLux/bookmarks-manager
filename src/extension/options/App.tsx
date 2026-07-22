import { useState, useEffect } from 'react'
import { useConfigForm } from './hooks/useConfigForm'
import { useCommands } from './hooks/useCommands'

// 暗色 / 亮色 调色板
const palettes = {
  dark: {
    bg: '#0d1117',
    surface: '#161b22',
    border: '#30363d',
    borderLight: '#21262d',
    text: '#e6edf3',
    textMuted: '#8b949e',
    textDim: '#6e7681',
    accent: '#3dd6c8',
    accentGlow: 'rgba(61, 214, 200, 0.15)',
    green: '#3fb950',
    orange: '#d29922',
  },
  light: {
    bg: '#ffffff',
    surface: '#f6f8fa',
    border: '#d8dee4',
    borderLight: '#e8ecf0',
    text: '#1f2328',
    textMuted: '#656d76',
    textDim: '#8b949e',
    accent: '#0d9488',
    accentGlow: 'rgba(13, 148, 136, 0.1)',
    green: '#1a7f37',
    orange: '#9a6700',
  },
}

type Palette = (typeof palettes)[keyof typeof palettes]

const font = '"JetBrains Mono", "SF Mono", "Fira Code", "Consolas", monospace'

function App() {
  const { config, saved, save, updateField } = useConfigForm()
  const { commands } = useCommands()
  const [focusField, setFocusField] = useState<string | null>(null)
  const [systemDark, setSystemDark] = useState(
    () => window.matchMedia('(prefers-color-scheme: dark)').matches,
  )

  // 监听系统主题变化
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  // 只有系统主题变化时才跟随 systemDark
  const resolvedMode = config?.theme === 'system'
    ? (systemDark ? 'dark' : 'light')
    : config?.theme ?? 'dark'

  const colors: Palette = palettes[resolvedMode]

  // 同步 body 背景
  useEffect(() => {
    document.body.style.background = colors.bg
    document.body.style.color = colors.text
    document.body.style.transition = 'background 0.2s, color 0.2s'
  }, [colors])

  const inputBase: React.CSSProperties = {
    width: '100%',
    padding: '8px 12px',
    border: `1px solid ${colors.border}`,
    borderRadius: '6px',
    background: colors.bg,
    color: colors.text,
    fontFamily: font,
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s, box-shadow 0.15s',
  }

  const themedFocus = {
    borderColor: colors.accent,
    boxShadow: `0 0 0 3px ${colors.accentGlow}`,
  }

  return (
    <div style={{
      maxWidth: 520,
      margin: '2rem auto',
      padding: '0 1rem',
      fontFamily: font,
      color: colors.text,
      background: 'transparent',
    }}>
      <h1 style={{
        fontSize: '1.25rem',
        fontWeight: 600,
        letterSpacing: '0.5px',
        borderBottom: `1px solid ${colors.borderLight}`,
        paddingBottom: '0.75rem',
        marginBottom: '1.5rem',
      }}>
        <span style={{ color: colors.accent }}>◆</span> Bookmarks Manager 设置
      </h1>

      {/* 主题选择器 */}
      <div style={{ marginBottom: '1.5rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '12px', fontWeight: 500, color: colors.textMuted }}>
          <span style={{ color: colors.accent }}>$</span> THEME
        </label>
        <select
          value={config?.theme ?? 'system'}
          onChange={(e) => updateField('theme', e.target.value as 'dark' | 'light' | 'system')}
          onFocus={() => setFocusField('theme')}
          onBlur={() => setFocusField(null)}
          style={{
            ...inputBase,
            width: 'auto',
            minWidth: 160,
            cursor: 'pointer',
            ...(focusField === 'theme' ? themedFocus : {}),
          }}
        >
          <option value="system">🌓 跟随系统</option>
          <option value="dark">🌙 暗色</option>
          <option value="light">☀️ 亮色</option>
        </select>
      </div>

      {/* GitHub Token */}
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '12px', fontWeight: 500, color: colors.textMuted }}>
          <span style={{ color: colors.accent }}>$</span> GITHUB_TOKEN
        </label>
        <input
          type="password"
          value={config?.githubToken ?? ''}
          onChange={(e) => updateField('githubToken', e.target.value)}
          onFocus={() => setFocusField('token')}
          onBlur={() => setFocusField(null)}
          style={{
            ...inputBase,
            ...(focusField === 'token' ? themedFocus : {}),
          }}
          placeholder="ghp_..."
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '12px', fontWeight: 500, color: colors.textMuted }}>
          <span style={{ color: colors.accent }}>$</span> REPO_OWNER
        </label>
        <input
          type="text"
          value={config?.repoOwner ?? ''}
          onChange={(e) => updateField('repoOwner', e.target.value)}
          onFocus={() => setFocusField('owner')}
          onBlur={() => setFocusField(null)}
          style={{
            ...inputBase,
            ...(focusField === 'owner' ? themedFocus : {}),
          }}
          placeholder="your-username"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '12px', fontWeight: 500, color: colors.textMuted }}>
          <span style={{ color: colors.accent }}>$</span> REPO_NAME
        </label>
        <input
          type="text"
          value={config?.repoName ?? ''}
          onChange={(e) => updateField('repoName', e.target.value)}
          onFocus={() => setFocusField('name')}
          onBlur={() => setFocusField(null)}
          style={{
            ...inputBase,
            ...(focusField === 'name' ? themedFocus : {}),
          }}
          placeholder="my-bookmarks"
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.375rem', fontSize: '12px', fontWeight: 500, color: colors.textMuted }}>
          <span style={{ color: colors.accent }}>$</span> SYNC_INTERVAL_HOURS
        </label>
        <input
          type="number"
          value={config?.syncIntervalHours ?? 6}
          onChange={(e) => updateField('syncIntervalHours', Number(e.target.value))}
          onFocus={() => setFocusField('interval')}
          onBlur={() => setFocusField(null)}
          min={1}
          max={168}
          style={{
            ...inputBase,
            width: 'auto',
            minWidth: 100,
            ...(focusField === 'interval' ? themedFocus : {}),
          }}
        />
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={config?.autoSyncOnLoad ?? false}
            onChange={(e) => updateField('autoSyncOnLoad', e.target.checked)}
            style={{ accentColor: colors.accent }}
          />
          <span style={{ fontWeight: 500 }}>扩展加载时自动同步书签到 GitHub</span>
        </label>
        <p style={{ fontSize: '11px', color: colors.textDim, margin: '0.25rem 0 0 1.5rem', fontFamily: font }}>
          # 启用后，浏览器启动或扩展更新时自动执行一次同步
        </p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '13px' }}>
          <input
            type="checkbox"
            checked={config?.cleanEmptyFolders ?? true}
            onChange={(e) => updateField('cleanEmptyFolders', e.target.checked)}
            style={{ accentColor: colors.accent }}
          />
          <span style={{ fontWeight: 500 }}>应用差异后自动清理空文件夹</span>
        </label>
        <p style={{ fontSize: '11px', color: colors.textDim, margin: '0.25rem 0 0 1.5rem', fontFamily: font }}>
          # 删除或移走书签后，若原文件夹变空则自动删除该文件夹
        </p>
      </div>

      <div style={{
        marginBottom: '1.5rem',
        padding: '1rem',
        background: colors.surface,
        borderRadius: '8px',
        border: `1px solid ${colors.border}`,
      }}>
        <h2 style={{ fontSize: '13px', fontWeight: 600, margin: '0 0 0.75rem', fontFamily: font }}>
          <span style={{ color: colors.accent }}>⌨</span> 快捷键
        </h2>
        <table style={{ width: '100%', fontSize: '12px', borderCollapse: 'collapse', fontFamily: font }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${colors.border}` }}>
              <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500, color: colors.textMuted }}>功能</th>
              <th style={{ textAlign: 'left', padding: '0.375rem 0.5rem', fontWeight: 500, color: colors.textMuted }}>快捷键</th>
            </tr>
          </thead>
          <tbody>
            {commands.map(cmd => (
              <tr key={cmd.name}>
                <td style={{ padding: '0.375rem 0.5rem', color: colors.text }}>{cmd.description || cmd.name}</td>
                <td style={{ padding: '0.375rem 0.5rem' }}>
                  <kbd style={{
                    padding: '2px 8px',
                    background: colors.bg,
                    border: `1px solid ${colors.border}`,
                    borderRadius: '4px',
                    fontSize: '11px',
                    color: cmd.shortcut ? colors.accent : colors.textDim,
                    fontFamily: font,
                  }}>
                    {cmd.shortcut || '未设置'}
                  </kbd>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p style={{ fontSize: '11px', color: colors.textDim, margin: '0.5rem 0 0', fontFamily: font }}>
          # 在{' '}
          <a
            href="chrome://extensions/shortcuts"
            target="_blank"
            style={{ color: colors.accent, textDecoration: 'none' }}
          >chrome://extensions/shortcuts</a>{' '}
          页面可自定义快捷键
        </p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
        <button
          onClick={save}
          style={{
            padding: '8px 20px',
            border: `1px solid ${colors.accent}`,
            borderRadius: '6px',
            background: `${colors.accent}15`,
            color: colors.accent,
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            fontFamily: font,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${colors.accent}25` }}
          onMouseLeave={e => { e.currentTarget.style.background = `${colors.accent}15` }}
        >
          $ save
        </button>

        {saved && (
          <span style={{ color: colors.green, fontSize: '12px', fontFamily: font }}>
            <span style={{ color: colors.green }}>●</span> 已保存
          </span>
        )}
      </div>
    </div>
  )
}

export default App
