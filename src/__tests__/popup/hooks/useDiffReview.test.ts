import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useDiffReview } from '../../../extension/popup/hooks/useDiffReview'
import type { BookmarkDiff } from '../../../shared/types'

const makeDiff = (overrides: Partial<BookmarkDiff> = {}): BookmarkDiff => ({
  type: 'added',
  remote: {
    id: overrides.remote?.id ?? '1',
    title: 'Test',
    url: 'https://example.com',
    folder: '/',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  ...overrides,
})

describe('useDiffReview', () => {
  it('初始状态应为 null', () => {
    const { result } = renderHook(() => useDiffReview())
    expect(result.current.pullDiffs).toBeNull()
    expect(result.current.selectedIds).toEqual([])
  })

  it('openReview 应设置 diffs 并自动全选', () => {
    const { result } = renderHook(() => useDiffReview())
    const diffs: BookmarkDiff[] = [
      makeDiff({ type: 'added', remote: { ...makeDiff().remote, id: '1' } }),
      makeDiff({ type: 'added', remote: { ...makeDiff().remote, id: '2' } }),
    ]

    act(() => {
      result.current.openReview(diffs, [])
    })

    expect(result.current.pullDiffs).toHaveLength(2)
    expect(result.current.selectedIds).toEqual(['1', '2'])
  })

  it('cancelPullReview 应清空所有状态', () => {
    const { result } = renderHook(() => useDiffReview())
    const diffs: BookmarkDiff[] = [makeDiff()]

    act(() => {
      result.current.openReview(diffs, [])
    })

    act(() => {
      result.current.cancelPullReview()
    })

    expect(result.current.pullDiffs).toBeNull()
    expect(result.current.selectedIds).toEqual([])
  })

  it('toggleId 应切换选中状态', () => {
    const { result } = renderHook(() => useDiffReview())
    const diffs: BookmarkDiff[] = [
      makeDiff({ remote: { ...makeDiff().remote, id: '1' } }),
      makeDiff({ remote: { ...makeDiff().remote, id: '2' } }),
    ]

    act(() => {
      result.current.openReview(diffs, [])
    })

    act(() => {
      result.current.toggleId('1')
    })

    expect(result.current.selectedIds).toEqual(['2'])
  })

  it('selectAllInGroup 应添加组内所有 ID', () => {
    const { result } = renderHook(() => useDiffReview())
    const diffs: BookmarkDiff[] = [
      makeDiff({ remote: { ...makeDiff().remote, id: '1' } }),
      makeDiff({ remote: { ...makeDiff().remote, id: '2' } }),
    ]

    act(() => {
      result.current.openReview(diffs, [])
    })

    // 先取消全部
    act(() => { result.current.toggleId('1') })
    act(() => { result.current.toggleId('2') })

    act(() => {
      result.current.selectAllInGroup(diffs)
    })

    expect(result.current.selectedIds).toHaveLength(2)
    expect(result.current.selectedIds).toContain('1')
    expect(result.current.selectedIds).toContain('2')
  })

  it('invertSelectionInGroup 应反转组内选中', () => {
    const { result } = renderHook(() => useDiffReview())
    const diffs: BookmarkDiff[] = [
      makeDiff({ remote: { ...makeDiff().remote, id: '1' } }),
      makeDiff({ remote: { ...makeDiff().remote, id: '2' } }),
    ]

    act(() => {
      result.current.openReview(diffs, [])
    })

    // 当前全选，反选后应该全不选
    act(() => {
      result.current.invertSelectionInGroup(diffs)
    })

    expect(result.current.selectedIds).toHaveLength(0)
  })
})
