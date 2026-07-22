import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { BookmarkDiff } from '../../shared/types'

const mockBookmarks = {
  getChildren: vi.fn(),
  get: vi.fn(),
  remove: vi.fn(),
}

vi.stubGlobal('chrome', {
  bookmarks: mockBookmarks,
})

import { removeEmptyAncestorFolders, computeEmptyFolders } from '../../extension/background/folder-utils'

describe('removeEmptyAncestorFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应在文件夹为空时删除并向上递归', async () => {
    // 文件夹 '100' 为空
    mockBookmarks.getChildren.mockResolvedValueOnce([]) // 空文件夹
    mockBookmarks.get.mockResolvedValueOnce([{ id: '100', title: 'Empty', parentId: '10' }])
    // 父文件夹 '10' 还有子节点，停止
    mockBookmarks.getChildren.mockResolvedValueOnce([{ id: '101', title: 'Other', url: 'https://x.com' }])

    const steps: string[] = []
    await removeEmptyAncestorFolders('100', steps)

    expect(mockBookmarks.remove).toHaveBeenCalledWith('100')
    expect(steps).toContain('- folder: Empty')
  })

  it('不应删除根级别文件夹', async () => {
    const steps: string[] = []
    // '1' 是根级书签栏
    await removeEmptyAncestorFolders('1', steps)

    expect(mockBookmarks.remove).not.toHaveBeenCalled()
  })

  it('有子节点的文件夹不应删除', async () => {
    mockBookmarks.getChildren.mockResolvedValueOnce([{ id: '101', title: 'Child', url: 'https://x.com' }])

    const steps: string[] = []
    await removeEmptyAncestorFolders('100', steps)

    expect(mockBookmarks.remove).not.toHaveBeenCalled()
  })
})

describe('computeEmptyFolders', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('无删除差异时应返回空数组', async () => {
    const diffs: BookmarkDiff[] = []
    const result = await computeEmptyFolders(diffs)
    expect(result).toEqual([])
  })

  it('删除所有子书签后应检测空文件夹', async () => {
    const diffs: BookmarkDiff[] = [
      {
        type: 'deleted',
        remote: { id: 'r1', title: 'Only', url: 'https://only.com', folder: '/work', tags: [], createdAt: '', updatedAt: '' },
        local: { id: 'l1', title: 'Only', url: 'https://only.com', folder: '/work', tags: [], createdAt: '', updatedAt: '' },
      },
    ]

    // get(l1) → 返回 parentId: '100'
    mockBookmarks.get.mockResolvedValueOnce([{ id: 'l1', title: 'Only', url: 'https://only.com', parentId: '100' }])

    // getChildren('100') → 只有这一个书签
    mockBookmarks.getChildren.mockResolvedValueOnce([{ id: 'l1', title: 'Only', url: 'https://only.com' }])

    // get('100') → 获取文件夹路径
    mockBookmarks.get.mockResolvedValueOnce([{ id: '100', title: 'Work Folder', parentId: '10' }])
    mockBookmarks.get.mockResolvedValueOnce([{ id: '10', title: 'Work', parentId: '1' }])

    const result = await computeEmptyFolders(diffs)

    expect(result).toContain('/Work/Work Folder')
  })
})
