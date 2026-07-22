import type { BookmarkDiff } from '../../../shared/types'
import type { DiffTab } from '../hooks/useDiffReview'
import { DIFF_LABEL, DIFF_COLOR } from '../constants'
import { useTheme } from '../theme'

interface DiffReviewPanelProps {
  pullDiffs: BookmarkDiff[]
  selectedIds: string[]
  emptyFolders: string[]
  diffTab: DiffTab
  cleanEnabled: boolean
  onTabChange: (tab: DiffTab) => void
  onToggleId: (id: string) => void
  onSelectAllInGroup: (diffs: BookmarkDiff[]) => void
  onInvertSelectionInGroup: (diffs: BookmarkDiff[]) => void
  onCancel: () => void
  onApply: () => void
}

export function DiffReviewPanel({
  pullDiffs,
  selectedIds,
  emptyFolders,
  diffTab,
  cleanEnabled,
  onTabChange,
  onToggleId,
  onSelectAllInGroup,
  onInvertSelectionInGroup,
  onCancel,
  onApply,
}: DiffReviewPanelProps) {
  const { styles, colors } = useTheme()

  const diffTypeStyles: Record<string, React.CSSProperties> = {
    added: { borderLeft: `3px solid ${colors.green}`, paddingLeft: '6px' },
    deleted: { borderLeft: `3px solid ${colors.red}`, paddingLeft: '6px' },
    modified: { borderLeft: `3px solid ${colors.orange}`, paddingLeft: '6px' },
  }

  const diffPrefixColors: Record<string, string> = {
    added: colors.green,
    deleted: colors.red,
    modified: colors.orange,
  }

  const diffPrefixSymbol: Record<string, string> = {
    added: '+',
    deleted: '-',
    modified: '~',
  }

  const groups = {
    added: pullDiffs.filter(d => d.type === 'added'),
    deleted: pullDiffs.filter(d => d.type === 'deleted'),
    modified: pullDiffs.filter(d => d.type === 'modified'),
  }
  const selectedCount = selectedIds.length
  const totalCount = pullDiffs.length

  const tabs = [
    { key: 'added' as const, label: '新增', count: groups.added.length, color: DIFF_COLOR.added },
    { key: 'deleted' as const, label: '删除', count: groups.deleted.length, color: DIFF_COLOR.deleted },
    { key: 'modified' as const, label: '修改', count: groups.modified.length, color: DIFF_COLOR.modified },
    { key: 'empty' as const, label: '🗑 空目录', count: emptyFolders.length, color: '#bc8cff' },
  ].filter(t => t.count > 0)

  const activeTab: DiffTab = tabs.some(t => t.key === diffTab) ? diffTab : tabs[0]?.key ?? 'added'

  const renderTabContent = () => {
    if (activeTab === 'empty') {
      return (
        <div>
          {cleanEnabled ? (
            <div style={styles.emptyFolderWarning}>
              ⚠ 以下目录在应用变更后将变空，会根据当前配置<strong>自动清理删除</strong>。
            </div>
          ) : (
            <div style={styles.emptyFolderDisabled}>
              ℹ 以下目录在应用变更后将变空，但<strong>自动清理已关闭</strong>，目录将保留。
            </div>
          )}
          {emptyFolders.map(path => (
            <div key={path} style={styles.emptyFolderItem}>
              📁 {path}
            </div>
          ))}
        </div>
      )
    }

    const items = groups[activeTab]
    const prefixColor = diffPrefixColors[activeTab]
    const prefixSym = diffPrefixSymbol[activeTab]

    return (
      <div>
        <div style={styles.diffGroupLabel}>
          <span style={{ ...styles.diffGroupTitle, color: prefixColor }}>
            {prefixSym} {DIFF_LABEL[activeTab]} ({items.length})
          </span>
          <span style={styles.diffActions}>
            <a
              onClick={() => onSelectAllInGroup(items)}
              style={styles.diffActionLink}
            >
              [全选]
            </a>
            <a
              onClick={() => onInvertSelectionInGroup(items)}
              style={styles.diffActionLink}
            >
              [反选]
            </a>
          </span>
        </div>
        {items.map(d => (
          <div
            key={d.remote.id}
            style={{
              ...styles.diffItem,
              ...diffTypeStyles[activeTab],
              ...((selectedIds.includes(d.remote.id)) ? { background: `${colors.accent}08` } : {}),
            }}
          >
            <input
              type="checkbox"
              checked={selectedIds.includes(d.remote.id)}
              onChange={() => onToggleId(d.remote.id)}
              style={styles.diffCheckbox}
            />
            <div style={styles.diffContent}>
              <div style={styles.diffTitle}>
                <span style={{ color: prefixColor, marginRight: 4 }}>{prefixSym}</span>
                {d.remote.folder && d.remote.folder !== '/' ? (
                  <><span style={{ color: colors.textDim }}>{d.remote.folder}/</span>{d.remote.title}</>
                ) : d.remote.title}
              </div>
              {d.type === 'modified' && d.changes && (
                <div style={styles.diffChanges}>
                  {d.changes.map((c, i) => (
                    <div key={i}>
                      <span style={{ color: colors.textDim }}>{c.field}:</span>{' '}
                      <span style={{ color: colors.red }}>-"{c.from}"</span>{' '}
                      <span style={{ color: colors.green }}>+"{c.to}"</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={styles.diffContainer}>
      <div style={styles.diffHeader}>
        <span style={{ color: colors.accent }}>↓</span> git pull 结果
      </div>
      <div style={styles.diffSub}>
        <span style={{ color: colors.textMuted }}>»</span> 共{' '}
        <span style={{ color: colors.text }}>{totalCount}</span> 项变更，已选{' '}
        <span style={{ color: colors.accent }}>{selectedCount}</span> 项
      </div>

      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            style={{
              ...styles.tabItem,
              ...(t.key === activeTab ? styles.tabItemActive : {}),
              color: t.key === activeTab ? t.color : colors.textMuted,
              borderBottomColor: t.key === activeTab ? t.color : 'transparent',
            }}
          >
            {t.key === 'empty' ? t.label : `${diffPrefixSymbol[t.key]} ${t.label} (${t.count})`}
          </button>
        ))}
      </div>

      <div style={styles.diffList}>
        {renderTabContent()}
      </div>

      <div style={styles.diffBottom}>
        <button
          onClick={onCancel}
          style={styles.btnSecondary}
          onMouseEnter={e => { e.currentTarget.style.borderColor = colors.textMuted }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = colors.border }}
        >
          ✕ 取消
        </button>
        <button
          onClick={onApply}
          disabled={selectedCount === 0}
          style={selectedCount === 0 ? styles.btnPrimaryDisabled : styles.btnPrimary}
        >
          ✓ 应用 ({selectedCount})
        </button>
      </div>
    </div>
  )
}
