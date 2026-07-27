import { useMemo } from 'react'
import { useTheme } from '../theme'
import type { Bookmark } from '../../../shared/types'

interface FolderSummary {
  name: string
  count: number
}

interface PushConfirmModalProps {
  bookmarks: Bookmark[]
  onConfirm: () => void
  onCancel: () => void
}

export function PushConfirmModal({ bookmarks, onConfirm, onCancel }: PushConfirmModalProps) {
  const { styles, colors } = useTheme()

  const folderSummary = useMemo(() => {
    const map = new Map<string, number>()
    for (const bm of bookmarks) {
      const root = bm.folder?.split('/')[1] || '/'
      map.set(root, (map.get(root) || 0) + 1)
    }
    return Array.from(map.entries()).map(([name, count]): FolderSummary => ({ name, count }))
  }, [bookmarks])

  return (
    <div style={styles.overlay} onClick={onCancel}>
      <div style={styles.modalContainer} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div style={{
          ...styles.modalHeader,
          fontSize: '14px',
          padding: '16px 16px 10px',
        }}>
          <span style={{ color: colors.orange, marginRight: 6 }}>⚠</span>
          <span>$</span> push
        </div>

        {/* Body */}
        <div style={{ padding: '4px 16px 12px' }}>
          {/* Total count */}
          <div style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
            marginBottom: 14,
            padding: '10px 12px',
            background: colors.surface,
            borderRadius: '6px',
            border: `1px solid ${colors.border}`,
          }}>
            <span style={{ fontSize: '22px', fontWeight: 700, color: colors.accent, fontFamily: 'inherit' }}>
              {bookmarks.length}
            </span>
            <span style={{ fontSize: '11px', color: colors.textMuted }}>
              条书签将推送到 GitHub
            </span>
          </div>

          {/* Folder breakdown */}
          <div style={{ marginBottom: 12 }}>
            <div style={{
              fontSize: '10px',
              fontWeight: 600,
              color: colors.textDim,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.5px',
              marginBottom: 4,
              fontFamily: 'inherit',
            }}>
              <span style={{ color: colors.accent }}>$</span> 目录分布
            </div>
            <div style={{
              background: colors.surface,
              borderRadius: '6px',
              border: `1px solid ${colors.border}`,
              overflow: 'hidden',
            }}>
              {folderSummary.map((f, i) => (
                <div
                  key={f.name}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 10px',
                    borderBottom: i < folderSummary.length - 1 ? `1px solid ${colors.borderLight}` : 'none',
                    fontSize: '11px',
                    fontFamily: 'inherit',
                  }}
                >
                  <span style={{ color: colors.textMuted }}>
                    📁 {f.name || '/'}
                  </span>
                  <span style={{ color: colors.text, fontWeight: 600 }}>
                    {f.count}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Warning */}
          <div style={{
            background: `${colors.orange}12`,
            border: `1px solid ${colors.orange}30`,
            borderRadius: '6px',
            padding: '8px 10px',
            fontSize: '11px',
            color: colors.orange,
            lineHeight: 1.5,
            fontFamily: 'inherit',
          }}>
            ⚠ 该操作将强制覆盖远程数据，远程已有变更将被丢弃。
          </div>
        </div>

        {/* Actions */}
        <div style={{
          ...styles.modalActions,
          borderTop: `1px solid ${colors.borderLight}`,
        }}>
          <button
            onClick={onCancel}
            style={styles.btnSecondary}
            onMouseEnter={e => { e.currentTarget.style.borderColor = colors.textMuted }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
          >
            ✕ 取消
          </button>
          <button
            onClick={onConfirm}
            style={styles.btnPrimary}
            onMouseEnter={e => { e.currentTarget.style.background = `${colors.accent}25` }}
            onMouseLeave={e => { e.currentTarget.style.background = `${colors.accent}15` }}
          >
            ✓ 确认推送
          </button>
        </div>
      </div>
    </div>
  )
}
