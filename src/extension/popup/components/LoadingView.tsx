import { useTheme } from '../theme'

export function LoadingView() {
  const { styles, colors } = useTheme()
  return (
    <div style={styles.center}>
      <span style={{ color: colors.accent }}>⟳</span> 加载中...
    </div>
  )
}
