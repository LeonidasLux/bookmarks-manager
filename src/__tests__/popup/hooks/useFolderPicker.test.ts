import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFolderPicker } from '../../../extension/popup/hooks/useFolderPicker'
import type { FolderNode } from '../../../extension/popup/hooks/useFolderPicker'

const mockTree: chrome.bookmarks.BookmarkTreeNode[] = [
  {
    id: '0',
    title: '',
    children: [
      {
        id: '1',
        title: '书签栏',
        children: [
          {
            id: '11',
            title: '技术',
            children: [
              {
                id: '111',
                title: '前端',
                dateAdded: Date.now(),
                children: [
                  { id: '1111', title: 'React 文档', url: 'https://react.dev', dateAdded: Date.now() },
                ],
              },
              { id: '112', title: '后端', children: [] },
            ],
          },
          { id: '12', title: '工具', children: [] },
        ],
      },
      {
        id: '2',
        title: '其他书签',
        children: [
          { id: '21', title: '工作', children: [] },
        ],
      },
      {
        id: '3',
        title: '移动设备书签',
        children: [],
      },
    ],
  },
]

beforeEach(() => {
  vi.spyOn(chrome.bookmarks, 'getTree').mockResolvedValue(mockTree)
})

describe('useFolderPicker', () => {
  it('应加载所有文件夹并默认选中第一个', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.allFolders.length).toBeGreaterThanOrEqual(6)

    const folderIds = result.current.allFolders.map((f: FolderNode) => f.id)
    expect(folderIds).toContain('1')
    expect(folderIds).toContain('11')
    expect(folderIds).toContain('111')
    expect(folderIds).toContain('12')
    expect(folderIds).toContain('2')
    expect(folderIds).toContain('21')
    expect(folderIds).toContain('3')

    // 文件夹路径应为可读路径
    const frontend = result.current.allFolders.find((f: FolderNode) => f.id === '111')
    expect(frontend?.path).toBe('书签栏/技术/前端')

    // 默认选中第一个文件夹
    expect(result.current.selectedFolderId).toBe(result.current.allFolders[0].id)
  })

  it('应过滤书签文件夹（不包含书签条目）', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    // 不应包含书签条目（有 url 属性的节点）
    const hasBookmark = result.current.allFolders.some((f: FolderNode) => f.id === '1111')
    expect(hasBookmark).toBe(false)
  })

  it('searchQuery 应为空字符串（默认初始值）', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.searchQuery).toBe('')
    expect(result.current.filteredFolders).toEqual(result.current.allFolders)
  })

  it('设置 searchQuery 后应正确过滤文件夹', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSearchQuery('技术')
    })

    expect(result.current.filteredFolders.length).toBeGreaterThan(0)
    result.current.filteredFolders.forEach((f: FolderNode) => {
      const matches = f.title.includes('技术') || f.path.includes('技术')
      expect(matches).toBe(true)
    })
  })

  it('搜索"前端"应匹配文件夹名称和路径', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSearchQuery('前端')
    })

    const matched = result.current.filteredFolders.map((f: FolderNode) => f.id)
    expect(matched).toContain('111')
  })

  it('无匹配搜索应返回空列表', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSearchQuery('不存在的文件夹名称_xyz')
    })

    expect(result.current.filteredFolders).toHaveLength(0)
  })

  it('clearSearch 应重置搜索', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => result.current.setSearchQuery('前端'))
    expect(result.current.searchQuery).toBe('前端')

    act(() => result.current.clearSearch())
    expect(result.current.searchQuery).toBe('')
    expect(result.current.filteredFolders).toEqual(result.current.allFolders)
  })

  it('应正确设置选中文件夹', async () => {
    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))

    act(() => {
      result.current.setSelectedFolderId('11')
    })
    expect(result.current.selectedFolderId).toBe('11')
    expect(result.current.selectedFolder?.title).toBe('技术')
  })

  it('getTree 异常时应有保护', async () => {
    vi.spyOn(chrome.bookmarks, 'getTree').mockRejectedValue(new Error('API error'))

    const { result } = renderHook(() => useFolderPicker())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.allFolders).toEqual([])
    expect(result.current.filteredFolders).toEqual([])
  })
})
