import { useRef, useEffect, useState, useCallback } from 'react'
import { useFolderPicker } from '../hooks/useFolderPicker'
import { useTheme } from '../theme'

interface FolderPickerProps {
  initialTitle: string
  onSave: (folderId: string, title: string) => void
  onCancel: () => void
}

export function FolderPicker({ initialTitle, onSave, onCancel }: FolderPickerProps) {
  const { styles, colors } = useTheme()
  const {
    filteredFolders,
    loading,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
  } = useFolderPicker()

  const [title, setTitle] = useState(initialTitle)
  const [titleFocus, setTitleFocus] = useState(false)
  const [searchFocus, setSearchFocus] = useState(false)
  const [hoverItem, setHoverItem] = useState<string | null>(null)

  const inputBorderStyle = { border: `1px solid ${colors.border}` } as React.CSSProperties
  const inputFocusBorder = { border: `1px solid ${colors.accent}` } as React.CSSProperties
  const titleInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.select()
  }, [])

  const handleSave = useCallback(() => {
    if (selectedFolderId && title.trim()) {
      onSave(selectedFolderId, title.trim())
    }
  }, [selectedFolderId, title, onSave])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedFolderId && title.trim()) {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }, [selectedFolderId, title, handleSave, onCancel])

  return (
    <div style={styles.overlay} onClick={onCancel} onKeyDown={handleKeyDown}>
      <div style={styles.modalContainer} onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div style={styles.modalHeader}>
          <span style={{ color: colors.accent }}>$</span> 保存书签
        </div>

        {/* 书签标题编辑 */}
        <div style={styles.modalFieldLabel}>
          书签标题
        </div>
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          onFocus={() => setTitleFocus(true)}
          onBlur={() => setTitleFocus(false)}
          style={{
            ...styles.modalInput,
            ...(titleFocus ? inputFocusBorder : inputBorderStyle),
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              e.stopPropagation()
              searchInputRef.current?.focus()
            }
          }}
        />

        {/* 搜索框 */}
        <div style={styles.modalFieldLabel}>
          目标目录
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索目录..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => setSearchFocus(true)}
          onBlur={() => setSearchFocus(false)}
          style={{
            ...styles.modalSearchInput,
            ...(searchFocus ? inputFocusBorder : inputBorderStyle),
          }}
        />

        {/* 文件夹列表 */}
        <div style={styles.modalList}>
          {loading ? (
            <div style={styles.modalEmptyState}>
              <span style={{ color: colors.accent }}>⟳</span> 加载中...
            </div>
          ) : filteredFolders.length === 0 ? (
            <div style={styles.modalEmptyState}>∅ 未找到匹配的目录</div>
          ) : (
            filteredFolders.map(f => (
              <div
                key={f.id}
                style={{
                  ...styles.modalItem,
                  ...(f.id === selectedFolderId ? styles.modalItemSelected : {}),
                  ...(hoverItem === f.id && f.id !== selectedFolderId ? { background: `${colors.accent}08` } : {}),
                }}
                onClick={() => setSelectedFolderId(f.id)}
                onMouseEnter={() => setHoverItem(f.id)}
                onMouseLeave={() => setHoverItem(null)}
              >
                <span style={styles.modalItemIcon}>📁</span>
                <div style={styles.modalItemContent}>
                  <span style={styles.modalItemTitle}>{f.title}</span>
                  <span style={styles.modalItemPath}>{f.path}</span>
                </div>
                {f.id === selectedFolderId && (
                  <span style={styles.modalCheckmark}>✓</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* 操作按钮 */}
        <div style={styles.modalActions}>
          <button
            onClick={onCancel}
            style={styles.btnSecondary}
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedFolderId || !title.trim()}
            style={(selectedFolderId && title.trim()) ? styles.btnPrimary : styles.btnPrimaryDisabled}
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
