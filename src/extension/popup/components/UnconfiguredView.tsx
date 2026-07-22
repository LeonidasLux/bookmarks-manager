import { useState } from 'react'
import { useTheme } from '../theme'

interface UnconfiguredViewProps {
  onOpenOptions: () => void
}

export function UnconfiguredView({ onOpenOptions }: UnconfiguredViewProps) {
  const { styles, colors, fonts } = useTheme()
  const [btnHover, setBtnHover] = useState(false)

  return (
    <div style={{ ...styles.container, textAlign: 'center', padding: '2rem 1rem' }}>
      <p style={{ color: colors.textMuted, margin: '0 0 4px 0', fontSize: '13px', fontFamily: fonts.mono }}>
        <span style={{ color: colors.orange }}>⚠</span> 请先配置 GitHub 仓库连接
      </p>
      <p style={{ fontSize: '11px', color: colors.textDim, margin: '0 0 16px 0', fontFamily: fonts.mono }}>
        $ 需要 GitHub Token、仓库 Owner 和名称
      </p>
      <button
        onClick={onOpenOptions}
        style={{
          padding: '6px 16px',
          border: `1px solid ${btnHover ? colors.accent : colors.border}`,
          borderRadius: '6px',
          background: btnHover ? `${colors.accent}15` : colors.surface,
          color: btnHover ? colors.accent : colors.textMuted,
          cursor: 'pointer',
          fontSize: '12px',
          fontWeight: 500,
          fontFamily: fonts.mono,
          transition: 'all 0.15s',
        }}
        onMouseEnter={() => setBtnHover(true)}
        onMouseLeave={() => setBtnHover(false)}
      >
        $ cd setup
      </button>
    </div>
  )
}
