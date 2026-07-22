import type { BookmarkDiff } from '../../../shared/types'
import type { DiffTab } from '../hooks/useDiffReview'
import { DIFF_LABEL, DIFF_COLOR } from '../constants'
import { styles } from '../styles'

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
    { key: 'empty' as const, label: '🗑 空文件夹', count: emptyFolders.length, color: '#9c27b0' },
  ].filter(t => t.count > 0)

  const activeTab: DiffTab = tabs.some(t => t.key === diffTab) ? diffTab : tabs[0]?.key ?? 'added'

  const renderTabContent = () => {
    if (activeTab === 'empty') {
      return (
        <div>
          {cleanEnabled ? (
            <div style={styles.emptyFolderWarning}>
              ⚠️ 以下文件夹在应用变更后将变空，会根据当前配置<b>自动清理删除</b>。
              如需关闭此行为，请在设置中取消「应用差异后自动清理空文件夹」。
            </div>
          ) : (
            <div style={styles.emptyFolderDisabled}>
              ℹ️ 以下文件夹在应用变更后将变空，但<b>自动清理已关闭</b>，文件夹将保留。
              如需启用，请在设置中勾选「应用差异后自动清理空文件夹」。
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
    return (
      <div>
        <div style={styles.diffGroupLabel}>
          <span style={{ ...styles.diffGroupTitle, color: DIFF_COLOR[activeTab] }}>
            {DIFF_LABEL[activeTab]} ({items.length})
          </span>
          <span style={styles.diffActions}>
            <a onClick={() => onSelectAllInGroup(items)} style={styles.diffActionLink}>全选</a>
            <a onClick={() => onInvertSelectionInGroup(items)} style={styles.diffActionLink}>反选</a>
          </span>
        </div>
        {items.map(d => (
          <div key={d.remote.id} style={styles.diffItem}>
            <input
              type="checkbox"
              checked={selectedIds.includes(d.remote.id)}
              onChange={() => onToggleId(d.remote.id)}
              style={styles.diffCheckbox}
            />
            <div style={styles.diffContent}>
              <div style={styles.diffTitle}>
                {d.remote.folder && d.remote.folder !== '/' ? `📁 ${d.remote.folder}/` : ''}{d.remote.title}
              </div>
              {d.type === 'modified' && d.changes && (
                <div style={styles.diffChanges}>
                  {d.changes.map(c => (
                    <div key={c.field}>{c.field}: "{c.from}" → "{c.to}"</div>
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
      <div style={styles.diffHeader}>📥 从 GitHub 拉取结果</div>
      <div style={styles.diffSub}>共 {totalCount} 项变更，已选 {selectedCount} 项</div>

      <div style={styles.tabBar}>
        {tabs.map(t => (
          <button
            key={t.key}
            onClick={() => onTabChange(t.key)}
            style={{
              ...styles.tabItem,
              ...(t.key === activeTab ? styles.tabItemActive : {}),
              color: t.key === activeTab ? t.color : '#5f6368',
              borderBottomColor: t.key === activeTab ? t.color : 'transparent',
            }}
          >
            {t.label} ({t.count})
          </button>
        ))}
      </div>

      <div style={styles.diffList}>
        {renderTabContent()}
      </div>

      <div style={styles.diffBottom}>
        <button onClick={onCancel} style={styles.btnSecondary}>✕ 取消</button>
        <button
          onClick={onApply}
          disabled={selectedCount === 0}
          style={selectedCount === 0 ? styles.btnPrimaryDisabled : styles.btnPrimary}
        >
          ✓ 应用选中 ({selectedCount})
        </button>
      </div>
    </div>
  )
}
