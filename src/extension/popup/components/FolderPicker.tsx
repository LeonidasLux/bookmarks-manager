import { useRef, useEffect, useState, useCallback } from 'react'
import { useFolderPicker } from '../hooks/useFolderPicker'
import { useTheme } from '../theme'

interface FolderPickerProps {
  initialTitle: string
  onSave: (folderId: string, title: string) => void
  onBack: () => void
}

export function FolderPicker({ initialTitle, onSave, onBack }: FolderPickerProps) {
  const { styles, colors, fonts } = useTheme()
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
      onBack()
    }
  }, [selectedFolderId, title, handleSave, onBack])

  return (
    <div style={{
      width: 420,
      padding: '12px',
      fontFamily: fonts.ui,
      background: colors.bg,
      color: colors.text,
      fontSize: '12px',
      lineHeight: 1.6,
    }} onKeyDown={handleKeyDown}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        marginBottom: '12px',
        paddingBottom: '8px',
        borderBottom: `1px solid ${colors.borderLight}`,
      }}>
        <button
          onClick={onBack}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 10px',
            border: `1px solid transparent`,
            borderRadius: '6px',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '12px',
            color: colors.textMuted,
            fontFamily: fonts.mono,
            transition: 'all 0.15s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = colors.surface
            e.currentTarget.style.borderColor = colors.border
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent'
            e.currentTarget.style.borderColor = 'transparent'
          }}
        >
          ← 返回
        </button>
        <span style={{ fontWeight: 600, fontSize: '12px', color: colors.text }}>
          <span style={{ color: colors.accent }}>$</span> 保存书签
        </span>
      </div>

      {/* 书签标题编辑 */}
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        color: colors.textDim,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: '4px',
        fontFamily: fonts.mono,
      }}>
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
          fontFamily: fonts.mono,
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          background: colors.bg,
          color: colors.text,
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          marginBottom: '10px',
          width: '100%',
          boxSizing: 'border-box' as const,
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
      <div style={{
        fontSize: '10px',
        fontWeight: 600,
        color: colors.textDim,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.5px',
        marginBottom: '4px',
        fontFamily: fonts.mono,
      }}>
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
          fontFamily: fonts.mono,
          fontSize: '12px',
          padding: '6px 10px',
          borderRadius: '6px',
          outline: 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          marginBottom: '8px',
          width: '100%',
          boxSizing: 'border-box' as const,
          background: colors.bg,
          color: colors.text,
          ...(searchFocus ? inputFocusBorder : inputBorderStyle),
        }}
      />

      {/* 文件夹列表 */}
      <div style={{
        flex: 1,
        overflowY: 'auto' as const,
        maxHeight: 260,
        border: `1px solid ${colors.border}`,
        borderRadius: '6px',
        background: colors.surface,
        marginBottom: '10px',
      }}>
        {loading ? (
          <div style={{
            textAlign: 'center' as const,
            color: colors.textDim,
            padding: '24px 0',
            fontSize: '12px',
            fontFamily: fonts.mono,
          }}>
            <span style={{ color: colors.accent }}>⟳</span> 加载中...
          </div>
        ) : filteredFolders.length === 0 ? (
          <div style={{
            textAlign: 'center' as const,
            color: colors.textDim,
            padding: '24px 0',
            fontSize: '12px',
            fontFamily: fonts.mono,
          }}>
            ∅ 未找到匹配的目录
          </div>
        ) : (
          filteredFolders.map(f => (
            <div
              key={f.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '6px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'background 0.1s',
                ...(f.id === selectedFolderId ? {
                  background: `${colors.accent}12`,
                  border: `1px solid ${colors.accent}30`,
                } : {}),
                ...(hoverItem === f.id && f.id !== selectedFolderId ? { background: `${colors.accent}08` } : {}),
              }}
              onClick={() => setSelectedFolderId(f.id)}
              onMouseEnter={() => setHoverItem(f.id)}
              onMouseLeave={() => setHoverItem(null)}
            >
              <span style={{ fontSize: '14px', flexShrink: 0 }}>📁</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <span style={{
                  fontSize: '12px',
                  fontWeight: 500,
                  color: colors.text,
                  fontFamily: fonts.mono,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                }}>
                  {f.title}
                </span>
                <span style={{
                  fontSize: '10px',
                  color: colors.textDim,
                  fontFamily: fonts.mono,
                  display: 'block',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  marginTop: '1px',
                }}>
                  {f.path}
                </span>
              </div>
              {f.id === selectedFolderId && (
                <span style={{ color: colors.accent, fontSize: '13px', fontWeight: 700, flexShrink: 0 }}>
                  ✓
                </span>
              )}
            </div>
          ))
        )}
      </div>

      {/* 操作按钮 */}
      <div style={{
        display: 'flex',
        gap: '8px',
        justifyContent: 'flex-end' as const,
      }}>
        <button
          onClick={onBack}
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
  )
}
