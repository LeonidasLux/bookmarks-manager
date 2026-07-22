import { useState } from 'react'
import { isFolderNode } from '../hooks/useBookmarkNavigation'
import { useTheme } from '../theme'
import { OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID, ROOT_FOLDER_META } from '../constants'

interface BookmarkListProps {
  currentItems: chrome.bookmarks.BookmarkTreeNode[]
  isHomeView: boolean
  onEnterFolder: (id: string, title: string) => void
  onOpenBookmark: (url: string) => void
}

function FolderTag({ title, onClick }: { title: string; onClick: () => void }) {
  const { styles, colors } = useTheme()
  const [hover, setHover] = useState(false)
  return (
    <span
      onClick={onClick}
      style={{
        ...styles.folderTag,
        ...(hover ? {
          background: `${colors.blue}15`,
          borderColor: `${colors.blue}50`,
          color: colors.blue,
        } : {}),
      }}
      title={title}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={styles.folderIcon}>📁</span>
      {title}
    </span>
  )
}

function BookmarkRow({ title, url, onClick }: { title: string; url: string; onClick: () => void }) {
  const { styles, colors } = useTheme()
  const [hover, setHover] = useState(false)
  return (
    <div
      onClick={onClick}
      style={{
        ...styles.bookmarkRow,
        ...(hover ? { background: colors.surface } : {}),
      }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={styles.bookmarkIcon}>🔗</span>
      <div style={styles.bookmarkContent}>
        <span style={styles.bookmarkTitle}>{title || '无标题'}</span>
        <span style={styles.bookmarkMeta}>{url}</span>
      </div>
    </div>
  )
}

export function BookmarkList({ currentItems, isHomeView, onEnterFolder, onOpenBookmark }: BookmarkListProps) {
  const { styles, colors } = useTheme()
  const folders = currentItems.filter(n => isFolderNode(n))
  const bookmarks = currentItems.filter(n => !isFolderNode(n))

  if (currentItems.length === 0) {
    return <div style={styles.empty}>∅ 暂无书签和文件夹</div>
  }

  return (
    <>
      {folders.length > 0 && (
        <>
          <div style={styles.sectionLabel}>
            <span style={{ color: colors.blue }}>◆</span> 目录
          </div>
          <div style={styles.tagContainer}>
            {folders.map(f => (
              <FolderTag
                key={f.id}
                title={f.title}
                onClick={() => onEnterFolder(f.id, f.title)}
              />
            ))}
          </div>
        </>
      )}

      {bookmarks.length > 0 && (
        <>
          <div style={styles.sectionLabel}>
            <span style={{ color: colors.textMuted }}>#</span> 书签
          </div>
          <div>
            {bookmarks.map(b => (
              <BookmarkRow
                key={b.id}
                title={b.title}
                url={b.url!}
                onClick={() => onOpenBookmark(b.url!)}
              />
            ))}
          </div>
        </>
      )}

      {/* 首页底部：其他书签 + 移动设备书签 */}
      {isHomeView && (
        <>
          <div style={styles.divider} />
          <div style={styles.footerLabel}>
            <span style={{ color: colors.textDim }}>📌</span> 根级目录
          </div>
          <div style={styles.tagContainer}>
            {[OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID].map(id => (
              <FolderTag
                key={id}
                title={ROOT_FOLDER_META[id]}
                onClick={() => onEnterFolder(id, ROOT_FOLDER_META[id])}
              />
            ))}
          </div>
        </>
      )}
    </>
  )
}
