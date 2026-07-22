import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useBookmarkStats } from '../../../extension/popup/hooks/useBookmarkStats'

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode

function makeFolder(id: string, title: string, children: BookmarkTreeNode[]): BookmarkTreeNode {
  return { id, title, children } as unknown as BookmarkTreeNode
}

function makeBookmark(id: string, title: string, url: string): BookmarkTreeNode {
  return { id, title, url } as unknown as BookmarkTreeNode
}

/** 构建完整的书签树（含虚拟根节点） */
function buildTree(...roots: BookmarkTreeNode[]): BookmarkTreeNode[] {
  return [{ id: '0', title: '', children: roots } as unknown as BookmarkTreeNode]
}

describe('useBookmarkStats', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应在 chrome.bookmarks 不可用时返回 0', async () => {
    vi.spyOn(chrome.bookmarks, 'getTree').mockRejectedValue(new Error('API not available'))

    const { result } = renderHook(() => useBookmarkStats())

    // 等待 effect 执行
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.totalBookmarks).toBe(0)
    expect(result.current.totalFolders).toBe(0)
    expect(result.current.rootFolders).toEqual([])
  })

  it('应正确统计书签和文件夹数量', async () => {
    const tree = buildTree(
      // 书签栏 id=1
      makeFolder('1', '书签栏', [
        makeFolder('11', '工作', [
          makeBookmark('111', 'GitHub', 'https://github.com'),
          makeBookmark('112', 'StackOverflow', 'https://stackoverflow.com'),
        ]),
        makeFolder('12', '学习', [
          makeBookmark('121', 'MDN', 'https://developer.mozilla.org'),
        ]),
        makeBookmark('13', 'Google', 'https://google.com'),
      ]),
      // 其他书签 id=2
      makeFolder('2', '其他书签', [
        makeBookmark('21', 'Example', 'https://example.com'),
      ]),
      // 移动设备书签 id=3（空）
      makeFolder('3', '移动设备书签', []),
    )

    vi.spyOn(chrome.bookmarks, 'getTree').mockResolvedValue(tree)

    const { result } = renderHook(() => useBookmarkStats())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.totalBookmarks).toBe(5)
    expect(result.current.totalFolders).toBe(3) // 工作、学习 2 个子文件夹 + 移动设备书签（空文件夹）
    expect(result.current.rootFolders).toHaveLength(3)

    // 书签栏：4 个书签 + 2 个文件夹（工作、学习）
    expect(result.current.rootFolders[0]).toEqual({
      id: '1',
      title: '书签栏',
      bookmarks: 4,
      folders: 2,
    })

    // 其他书签：1 个书签，无子文件夹
    expect(result.current.rootFolders[1]).toEqual({
      id: '2',
      title: '其他书签',
      bookmarks: 1,
      folders: 0,
    })

    // 移动设备书签：空文件夹
    expect(result.current.rootFolders[2]).toEqual({
      id: '3',
      title: '移动设备书签',
      bookmarks: 0,
      folders: 1,
    })
  })

  it('应正确处理文件夹嵌套层级', async () => {
    const tree = buildTree(
      makeFolder('1', '书签栏', [
        makeFolder('11', 'A', [
          makeFolder('111', 'A1', [
            makeBookmark('1111', 'Site1', 'https://site1.com'),
            makeBookmark('1112', 'Site2', 'https://site2.com'),
          ]),
          makeFolder('112', 'A2', [
            makeFolder('1121', 'A2a', [
              makeBookmark('11211', 'Site3', 'https://site3.com'),
            ]),
          ]),
        ]),
        makeBookmark('12', 'Site4', 'https://site4.com'),
      ]),
      makeFolder('2', '其他书签', [
        makeFolder('21', 'B', [
          makeBookmark('211', 'Site5', 'https://site5.com'),
        ]),
      ]),
    )

    vi.spyOn(chrome.bookmarks, 'getTree').mockResolvedValue(tree)

    const { result } = renderHook(() => useBookmarkStats())

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 0))
    })

    expect(result.current.totalBookmarks).toBe(5)
    expect(result.current.totalFolders).toBe(5) // A, A1, A2, A2a, B
    expect(result.current.rootFolders).toHaveLength(2)
  })
})
