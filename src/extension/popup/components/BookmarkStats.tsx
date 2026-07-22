import type { BookmarkStatsData } from '../hooks/useBookmarkStats'
import { useTheme } from '../theme'

interface BookmarkStatsProps {
  stats: BookmarkStatsData
}

export function BookmarkStats({ stats }: BookmarkStatsProps) {
  const { styles } = useTheme()
  const { totalBookmarks, totalFolders, rootFolders } = stats

  if (totalBookmarks === 0 && totalFolders === 0) {
    return null
  }

  return (
    <div style={styles.statsBar}>
      <span style={styles.statsBarItem}>
        <span style={{ ...styles.statusDot, ...styles.statusDotGreen }} />
        <span style={styles.statsBarNum}>{totalBookmarks}</span>
        <span>书签</span>
      </span>
      <span style={styles.statsBarSep}>·</span>
      <span style={styles.statsBarItem}>
        <span style={styles.statsBarNum}>{totalFolders}</span>
        <span>目录</span>
      </span>

      {rootFolders.length > 0 && (
        <>
          <span style={styles.statsBarDivider} />
          <div style={styles.statsBarFolders}>
            {rootFolders.map(f => (
              <span key={f.id} style={styles.statsBarFolder}>
                📁{f.title}
                <span style={styles.statsBarNum}>{f.bookmarks}</span>
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
