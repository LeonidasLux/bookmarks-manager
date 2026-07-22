import { useState } from 'react'
import { useTheme } from '../theme'

interface ToolbarProps {
  pushLoading: boolean
  pullLoading: boolean
  onSaveCurrent: () => void
  onPush: () => void
  onPull: () => void
  onOpenOptions: () => void
}

function Btn({ title, loading, disabled, children, onClick }: {
  title: string
  loading?: boolean
  disabled?: boolean
  children: React.ReactNode
  onClick: () => void
}) {
  const { styles, colors } = useTheme()
  const [hover, setHover] = useState(false)
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      style={{
        ...styles.iconBtn,
        ...((hover && !disabled && !loading) ? styles.iconBtnHover : {}),
        ...((disabled || loading) ? styles.iconBtnDisabled : {}),
      }}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {loading ? (
        <span style={{ color: colors.orange }}>⋯</span>
      ) : children}
    </button>
  )
}

export function Toolbar({ pushLoading, pullLoading, onSaveCurrent, onPush, onPull, onOpenOptions }: ToolbarProps) {
  const { styles, colors } = useTheme()
  return (
    <div style={styles.toolbar}>
      <span style={styles.toolbarTitle}>
        <span style={{ color: colors.accent }}>◆</span> bookmarks
      </span>
      <Btn title="保存当前标签页到书签" onClick={onSaveCurrent}>+</Btn>
      <Btn title="推送到 GitHub（强制覆盖远程）" loading={pushLoading} onClick={onPush}>↑</Btn>
      <Btn title="从 GitHub 拉取（对比差异后手动合并）" loading={pullLoading} onClick={onPull}>↓</Btn>
      <Btn title="设置" onClick={onOpenOptions}>⚙</Btn>
    </div>
  )
}
