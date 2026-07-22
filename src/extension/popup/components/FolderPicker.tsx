import { type MouseEvent, useRef, useEffect, useState } from 'react'
import { useFolderPicker } from '../hooks/useFolderPicker'
import { styles } from '../styles'

interface FolderPickerProps {
  initialTitle: string
  onSave: (folderId: string, title: string) => void
  onCancel: () => void
}

function itemHover(e: MouseEvent<HTMLDivElement>, hover: boolean) {
  e.currentTarget.style.background = hover ? '#f1f3f4' : 'transparent'
}

export function FolderPicker({ initialTitle, onSave, onCancel }: FolderPickerProps) {
  const {
    filteredFolders,
    loading,
    searchQuery,
    setSearchQuery,
    selectedFolderId,
    setSelectedFolderId,
  } = useFolderPicker()

  const [title, setTitle] = useState(initialTitle)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // 自动聚焦标题输入框
  useEffect(() => {
    titleInputRef.current?.focus()
    titleInputRef.current?.select()
  }, [])

  const handleSave = () => {
    if (selectedFolderId && title.trim()) {
      onSave(selectedFolderId, title.trim())
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && selectedFolderId && title.trim()) {
      handleSave()
    } else if (e.key === 'Escape') {
      onCancel()
    }
  }

  return (
    <div style={pickerStyles.overlay} onClick={onCancel} onKeyDown={handleKeyDown}>
      <div style={pickerStyles.container} onClick={e => e.stopPropagation()}>
        {/* 标题 */}
        <div style={pickerStyles.header}>保存书签到文件夹</div>

        {/* 书签标题编辑 */}
        <div style={pickerStyles.fieldLabel}>
          <span>书签标题</span>
        </div>
        <div style={pickerStyles.titleInputWrapper}>
          <input
            ref={titleInputRef}
            type="text"
            value={title}
            onChange={e => setTitle(e.target.value)}
            style={pickerStyles.titleInput}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.stopPropagation()
                searchInputRef.current?.focus()
              }
            }}
          />
        </div>

        {/* 搜索框 */}
        <div style={pickerStyles.fieldLabel}>
          <span>目标文件夹</span>
        </div>
        <input
          ref={searchInputRef}
          type="text"
          placeholder="搜索文件夹..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={pickerStyles.searchInput}
        />

        {/* 文件夹列表 */}
        <div style={pickerStyles.list}>
          {loading ? (
            <div style={pickerStyles.emptyState}>加载中...</div>
          ) : filteredFolders.length === 0 ? (
            <div style={pickerStyles.emptyState}>未找到匹配的文件夹</div>
          ) : (
            filteredFolders.map(f => (
              <div
                key={f.id}
                style={{
                  ...pickerStyles.item,
                  ...(f.id === selectedFolderId ? pickerStyles.itemSelected : {}),
                }}
                onClick={() => setSelectedFolderId(f.id)}
                onMouseEnter={e => itemHover(e, true)}
                onMouseLeave={e => itemHover(e, false)}
              >
                <span style={pickerStyles.itemIcon}>📁</span>
                <div style={pickerStyles.itemContent}>
                  <span style={pickerStyles.itemTitle}>{f.title}</span>
                  <span style={pickerStyles.itemPath}>{f.path}</span>
                </div>
                {f.id === selectedFolderId && (
                  <span style={pickerStyles.checkmark}>✓</span>
                )}
              </div>
            ))
          )}
        </div>

        {/* 操作按钮 */}
        <div style={pickerStyles.actions}>
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
            保存到此处
          </button>
        </div>
      </div>
    </div>
  )
}

const pickerStyles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(0, 0, 0, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  container: {
    width: 360,
    maxHeight: 460,
    background: '#fff',
    borderRadius: '12px',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  },
  header: {
    fontSize: '14px',
    fontWeight: 600,
    color: '#202124',
    padding: '16px 16px 8px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: 600,
    color: '#9aa0a6',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px',
    margin: '4px 16px 2px',
  },
  titleInputWrapper: {
    margin: '4px 16px 6px',
  },
  titleInput: {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    background: '#fff',
    color: '#202124',
    boxSizing: 'border-box' as const,
    transition: 'border-color 0.15s',
  } as React.CSSProperties,
  searchInput: {
    margin: '4px 16px 8px',
    padding: '8px 12px',
    border: '1px solid #dadce0',
    borderRadius: '8px',
    fontSize: '13px',
    outline: 'none',
    background: '#f8f9fa',
    color: '#202124',
    transition: 'border-color 0.15s, background 0.15s',
  } as React.CSSProperties,
  list: {
    flex: 1,
    overflowY: 'auto',
    maxHeight: 200,
    padding: '4px 8px',
  },
  emptyState: {
    textAlign: 'center',
    color: '#9aa0a6',
    padding: '24px 0',
    fontSize: '13px',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background 0.1s',
  },
  itemSelected: {
    background: '#e8f0fe',
  },
  itemIcon: {
    fontSize: '16px',
    flexShrink: 0,
  },
  itemContent: {
    flex: 1,
    minWidth: 0,
  },
  itemTitle: {
    fontSize: '13px',
    fontWeight: 500,
    color: '#202124',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPath: {
    fontSize: '11px',
    color: '#9aa0a6',
    display: 'block',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    marginTop: '1px',
  },
  checkmark: {
    color: '#1a73e8',
    fontSize: '14px',
    fontWeight: 700,
    flexShrink: 0,
  },
  actions: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
    padding: '10px 16px 14px',
    borderTop: '1px solid #f0f0f0',
  },
}
