import type { MouseEvent } from 'react'
import { isFolderNode } from '../hooks/useBookmarkNavigation'
import { styles } from '../styles'
import { OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID, ROOT_FOLDER_META } from '../constants'

interface BookmarkListProps {
  currentItems: chrome.bookmarks.BookmarkTreeNode[]
  isHomeView: boolean
  onEnterFolder: (id: string, title: string) => void
  onOpenBookmark: (url: string) => void
}

function folderHover(e: MouseEvent<HTMLSpanElement>, hover: boolean) {
  e.currentTarget.style.background = hover ? '#e2e4e7' : '#f1f3f4'
  e.currentTarget.style.borderColor = hover ? '#ccc' : '#e0e0e0'
}

export function BookmarkList({ currentItems, isHomeView, onEnterFolder, onOpenBookmark }: BookmarkListProps) {
  const folders = currentItems.filter(n => isFolderNode(n))
  const bookmarks = currentItems.filter(n => !isFolderNode(n))

  if (currentItems.length === 0) {
    return <div style={styles.empty}>暂无书签和文件夹</div>
  }

  return (
    <>
      {folders.length > 0 && (
        <>
          <div style={styles.sectionLabel}>文件夹</div>
          <div style={styles.tagContainer}>
            {folders.map(f => (
              <span
                key={f.id}
                style={styles.folderTag}
                onClick={() => onEnterFolder(f.id, f.title)}
                title={f.title}
                onMouseEnter={e => folderHover(e, true)}
                onMouseLeave={e => folderHover(e, false)}
              >
                📁 {f.title}
              </span>
            ))}
          </div>
        </>
      )}

      {bookmarks.length > 0 && (
        <>
          <div style={styles.sectionLabel}>书签</div>
          <div>
            {bookmarks.map(b => (
              <div
                key={b.id}
                style={styles.bookmarkRow}
                onClick={() => onOpenBookmark(b.url!)}
                onMouseEnter={e => { e.currentTarget.style.background = '#f8f9fa' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                <span style={styles.bookmarkTitle}>
                  {b.title || '无标题'}
                </span>
                <span style={styles.bookmarkMeta}>{b.url}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* 首页底部：其他书签 + 移动设备书签 */}
      {isHomeView && (
        <>
          <div style={styles.footerDivider} />
          <div style={styles.footerLabel}>根级文件夹</div>
          <div style={styles.tagContainer}>
            {[OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID].map(id => (
              <span
                key={id}
                style={styles.folderTag}
                onClick={() => onEnterFolder(id, ROOT_FOLDER_META[id])}
                title={ROOT_FOLDER_META[id]}
                onMouseEnter={e => folderHover(e, true)}
                onMouseLeave={e => folderHover(e, false)}
              >
                📁 {ROOT_FOLDER_META[id]}
              </span>
            ))}
          </div>
        </>
      )}
    </>
  )
}
