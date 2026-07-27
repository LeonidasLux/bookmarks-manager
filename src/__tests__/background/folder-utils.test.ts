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

  it('已在上级清理中被删除的文件夹不应再抛出异常', async () => {
    // 模拟场景：affectedParents 中同时包含子文件夹 '100' 和父文件夹 '10' 的 ID
    // 第一次调用 removeEmptyAncestorFolders('100') 时级联删除了父文件夹 '10',
    // 第二次调用 removeEmptyAncestorFolders('10') 时文件夹已不存在

    // --- 第一次调用：清理 '100'，级联删除父级 '10' ---
    mockBookmarks.getChildren.mockResolvedValueOnce([]) // '100' 的子节点（空）
    mockBookmarks.get.mockResolvedValueOnce([{ id: '100', title: '空子文件夹', parentId: '10' }])
    mockBookmarks.getChildren.mockResolvedValueOnce([]) // '10' 的子节点（空，唯一子文件夹 '100' 刚被删）
    mockBookmarks.get.mockResolvedValueOnce([{ id: '10', title: '空父文件夹', parentId: '1' }])
    // '1' 是书签栏根级，while 循环停止

    const steps: string[] = []
    await removeEmptyAncestorFolders('100', steps)

    expect(mockBookmarks.remove).toHaveBeenCalledWith('100')
    expect(mockBookmarks.remove).toHaveBeenCalledWith('10')
    expect(steps).toContain('- folder: 空子文件夹')
    expect(steps).toContain('- folder: 空父文件夹')

    // --- 第二次调用：'10' 已被删除，getChildren 抛出 Chrome API 错误 ---
    mockBookmarks.getChildren.mockRejectedValueOnce(
      new Error("Can't find bookmark for id."),
    )

    const steps2: string[] = []
    await expect(removeEmptyAncestorFolders('10', steps2)).resolves.toBeUndefined()
    expect(steps2).toEqual([])
  })

  it('应级联删除多级空父文件夹', async () => {
    // 路径: /书签栏/Level2/Level1 → 传入 Level1，逐级向上删除
    mockBookmarks.getChildren.mockResolvedValueOnce([]) // Level1 为空
    mockBookmarks.get.mockResolvedValueOnce([{ id: '100', title: 'Level1', parentId: '10' }])
    mockBookmarks.getChildren.mockResolvedValueOnce([]) // Level2 为空（Level1 刚被删）
    mockBookmarks.get.mockResolvedValueOnce([{ id: '10', title: 'Level2', parentId: '1' }])
    // '1' 是根，停止

    const steps: string[] = []
    await removeEmptyAncestorFolders('100', steps)

    expect(mockBookmarks.remove).toHaveBeenCalledWith('100')
    expect(mockBookmarks.remove).toHaveBeenCalledWith('10')
    expect(steps).toHaveLength(2)
    expect(steps[0]).toBe('- folder: Level1')
    expect(steps[1]).toBe('- folder: Level2')
  })

  it('getChildren 抛出异常时应优雅退出', async () => {
    mockBookmarks.getChildren.mockRejectedValueOnce(new Error('Can\'t find bookmark for id.'))

    const steps: string[] = []
    await expect(removeEmptyAncestorFolders('999', steps)).resolves.toBeUndefined()
    expect(mockBookmarks.remove).not.toHaveBeenCalled()
    expect(steps).toEqual([])
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
