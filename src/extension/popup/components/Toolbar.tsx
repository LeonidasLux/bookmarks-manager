import { styles } from '../styles'

interface ToolbarProps {
  pushLoading: boolean
  pullLoading: boolean
  onSaveCurrent: () => void
  onPush: () => void
  onPull: () => void
  onOpenOptions: () => void
}

export function Toolbar({ pushLoading, pullLoading, onSaveCurrent, onPush, onPull, onOpenOptions }: ToolbarProps) {
  return (
    <div style={styles.toolbar}>
      <span style={{ flex: 1, fontWeight: 600, fontSize: '13px', color: '#202124', letterSpacing: '0.3px' }}>
        Bookmarks Manager
      </span>
      <button onClick={onSaveCurrent} style={styles.iconBtn} title="保存当前页面到其他书签">➕</button>
      <button
        onClick={onPush}
        disabled={pushLoading}
        style={{ ...styles.iconBtn, ...(pushLoading ? styles.iconBtnDisabled : {}) }}
        title="同步到 GitHub（强制覆盖远程）"
      >
        {pushLoading ? '⋯' : '↑'}
      </button>
      <button
        onClick={onPull}
        disabled={pullLoading}
        style={{ ...styles.iconBtn, ...(pullLoading ? styles.iconBtnDisabled : {}) }}
        title="从 GitHub 拉取（对比差异后手动合并）"
      >
        {pullLoading ? '⋯' : '↓'}
      </button>
      <button onClick={onOpenOptions} style={styles.iconBtn} title="设置">⚙</button>
    </div>
  )
}
