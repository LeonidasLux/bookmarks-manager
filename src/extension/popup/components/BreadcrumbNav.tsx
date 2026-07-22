import { styles } from '../styles'

interface BreadcrumbNavProps {
  breadcrumbs: Array<{ id: string; title: string }>
  currentFolderTitle: string
  onGoBack: () => void
  onNavigateToBreadcrumb: (index: number) => void
}

export function BreadcrumbNav({ breadcrumbs, currentFolderTitle, onGoBack, onNavigateToBreadcrumb }: BreadcrumbNavProps) {
  return (
    <div style={styles.nav}>
      <button onClick={onGoBack} style={styles.backBtn}>
        ← 返回
      </button>
      {breadcrumbs.map((crumb, i) => (
        <span key={crumb.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 0, maxWidth: '100%' }}>
          <span
            onClick={() => onNavigateToBreadcrumb(i)}
            style={styles.breadcrumbItem}
            title={crumb.title}
          >
            {crumb.title}
          </span>
          <span style={styles.breadcrumbSep}>›</span>
        </span>
      ))}
      <span style={styles.currentLabel} title={currentFolderTitle}>
        {currentFolderTitle}
      </span>
    </div>
  )
}
