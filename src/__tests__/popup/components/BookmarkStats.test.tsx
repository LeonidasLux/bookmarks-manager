import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BookmarkStats } from '../../../extension/popup/components/BookmarkStats'
import type { BookmarkStatsData } from '../../../extension/popup/hooks/useBookmarkStats'

describe('BookmarkStats', () => {
  const mockStats: BookmarkStatsData = {
    totalBookmarks: 42,
    totalFolders: 10,
    rootFolders: [
      { id: '1', title: '书签栏', bookmarks: 30, folders: 5 },
      { id: '2', title: '其他书签', bookmarks: 10, folders: 4 },
      { id: '3', title: '移动设备书签', bookmarks: 2, folders: 1 },
    ],
  }

  it('应显示书签和文件夹总数', () => {
    render(<BookmarkStats stats={mockStats} />)
    expect(screen.getByText('书签')).toBeInTheDocument()
    expect(screen.getByText('文件夹')).toBeInTheDocument()
  })

  it('应显示各根级文件夹的书签数', () => {
    render(<BookmarkStats stats={mockStats} />)
    // 30 仅作为书签栏的书签数出现一次
    expect(screen.getByText('30')).toBeInTheDocument()
    // 2 仅作为移动设备书签的书签数出现一次
    expect(screen.getByText('2')).toBeInTheDocument()
    // "其他书签"标签出现
    expect(screen.getByText('其他书签')).toBeInTheDocument()
  })

  it('书签和总数都为 0 时不渲染', () => {
    const emptyStats: BookmarkStatsData = {
      totalBookmarks: 0,
      totalFolders: 0,
      rootFolders: [
        { id: '1', title: '书签栏', bookmarks: 0, folders: 0 },
        { id: '2', title: '其他书签', bookmarks: 0, folders: 0 },
        { id: '3', title: '移动设备书签', bookmarks: 0, folders: 0 },
      ],
    }

    const { container } = render(<BookmarkStats stats={emptyStats} />)
    expect(container.firstChild).toBeNull()
  })

  it('有文件夹时即使书签为 0 也应渲染', () => {
    const folderOnly: BookmarkStatsData = {
      totalBookmarks: 0,
      totalFolders: 5,
      rootFolders: [
        { id: '1', title: '书签栏', bookmarks: 0, folders: 5 },
      ],
    }

    const { container } = render(<BookmarkStats stats={folderOnly} />)
    expect(container.firstChild).not.toBeNull()
    expect(screen.getByText('文件夹')).toBeInTheDocument()
  })
})
