import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DiffReviewPanel } from '../../../extension/popup/components/DiffReviewPanel'
import type { BookmarkDiff } from '../../../shared/types'

const makeDiff = (overrides: Partial<BookmarkDiff> = {}): BookmarkDiff => ({
  type: 'added',
  remote: {
    id: overrides.remote?.id ?? '1',
    title: 'Test Bookmark',
    url: 'https://example.com',
    folder: '/work',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  ...overrides,
})

describe('DiffReviewPanel', () => {
  const defaultDiffs: BookmarkDiff[] = [
    makeDiff({ type: 'added', remote: { ...makeDiff().remote, id: '1', title: 'New Bookmark' } }),
    makeDiff({ type: 'deleted', remote: { ...makeDiff().remote, id: '2', title: 'Old Bookmark' } }),
  ]

  const defaultProps = {
    pullDiffs: defaultDiffs,
    selectedIds: ['1', '2'],
    emptyFolders: [] as string[],
    diffTab: 'added' as const,
    cleanEnabled: true,
    onTabChange: vi.fn(),
    onToggleId: vi.fn(),
    onSelectAllInGroup: vi.fn(),
    onInvertSelectionInGroup: vi.fn(),
    onCancel: vi.fn(),
    onApply: vi.fn(),
  }

  it('应显示差异统计', () => {
    render(<DiffReviewPanel {...defaultProps} />)
    expect(screen.getByText('📥 从 GitHub 拉取结果')).toBeInTheDocument()
    expect(screen.getByText(/共 2 项变更/)).toBeInTheDocument()
  })

  it('应显示所有 Tab', () => {
    render(<DiffReviewPanel {...defaultProps} />)
    // 使用 getAllByText 因为 Tab 按钮和组标题中都有相同文本
    const addedTabs = screen.getAllByText(/新增/)
    const deletedTabs = screen.getAllByText(/删除/)
    expect(addedTabs.length).toBeGreaterThanOrEqual(1)
    expect(deletedTabs.length).toBeGreaterThanOrEqual(1)
  })

  it('应显示全选/反选链接', () => {
    render(<DiffReviewPanel {...defaultProps} />)
    expect(screen.getByText('全选')).toBeInTheDocument()
    expect(screen.getByText('反选')).toBeInTheDocument()
  })

  it('"应用选中" 按钮应显示选中计数', () => {
    render(<DiffReviewPanel {...defaultProps} />)
    expect(screen.getByText('✓ 应用选中 (2)')).toBeInTheDocument()
  })

  it('选中数为 0 时应禁用应用按钮', () => {
    render(<DiffReviewPanel {...defaultProps} selectedIds={[]} />)
    const applyBtn = screen.getByText('✓ 应用选中 (0)')
    expect(applyBtn).toBeDisabled()
  })

  it('点击取消应触发 onCancel', () => {
    const onCancel = vi.fn()
    render(<DiffReviewPanel {...defaultProps} onCancel={onCancel} />)
    fireEvent.click(screen.getByText('✕ 取消'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('点击 Tab 应触发 onTabChange', () => {
    const onTabChange = vi.fn()
    const diffs: BookmarkDiff[] = [
      makeDiff({ type: 'deleted', remote: { ...makeDiff().remote, id: '1' } }),
    ]
    render(
      <DiffReviewPanel
        {...defaultProps}
        pullDiffs={diffs}
        diffTab="deleted"
        selectedIds={[]}
        onTabChange={onTabChange}
      />
    )
    // 使用 getByRole 精确选择 Tab 按钮，避免与组标题冲突
    const tab = screen.getByRole('button', { name: /删除/ })
    fireEvent.click(tab)
    expect(onTabChange).toHaveBeenCalled()
  })
})
