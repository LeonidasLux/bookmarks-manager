import { useState } from 'react'
import { useTheme } from '../theme'

interface BreadcrumbNavProps {
  breadcrumbs: Array<{ id: string; title: string }>
  currentFolderTitle: string
  onGoBack: () => void
  onNavigateToBreadcrumb: (index: number) => void
}

export function BreadcrumbNav({ breadcrumbs, currentFolderTitle, onGoBack, onNavigateToBreadcrumb }: BreadcrumbNavProps) {
  const { styles, colors } = useTheme()
  const [backHover, setBackHover] = useState(false)

  return (
    <div style={styles.nav}>
      <button
        onClick={onGoBack}
        style={{
          ...styles.backBtn,
          ...(backHover ? { color: colors.accent, borderColor: colors.accent } : {}),
        }}
        onMouseEnter={() => setBackHover(true)}
        onMouseLeave={() => setBackHover(false)}
      >
        ← cd ..
      </button>
      <span style={{ color: colors.accent, userSelect: 'none' }}>~</span>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 0, maxWidth: '100%' }}>
          <span style={styles.breadcrumbSep}>/</span>
          <span
            onClick={() => onNavigateToBreadcrumb(i)}
            style={styles.breadcrumbItem}
            title={crumb.title}
          >
            {crumb.title}
          </span>
        </span>
      ))}
      <span style={styles.breadcrumbSep}>/</span>
      <span style={styles.currentLabel} title={currentFolderTitle}>
        {currentFolderTitle}
      </span>
    </div>
  )
}
