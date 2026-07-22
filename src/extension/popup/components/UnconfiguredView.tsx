import { styles } from '../styles'

interface UnconfiguredViewProps {
  onOpenOptions: () => void
}

export function UnconfiguredView({ onOpenOptions }: UnconfiguredViewProps) {
  return (
    <div style={{ ...styles.container, textAlign: 'center', padding: '2rem 1rem' }}>
      <p style={{ color: '#5f6368', margin: '0 0 8px 0', fontSize: '14px' }}>
        🔧 请先配置 GitHub 仓库连接
      </p>
      <p style={{ fontSize: '12px', color: '#9aa0a6', margin: '0 0 16px 0' }}>
        需要 GitHub Token、仓库 Owner 和名称
      </p>
      <button
        onClick={onOpenOptions}
        style={{
          padding: '8px 20px',
          background: '#1a73e8',
          color: '#fff',
          border: 'none',
          borderRadius: '8px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 500,
        }}
      >
        前往设置
      </button>
    </div>
  )
}
