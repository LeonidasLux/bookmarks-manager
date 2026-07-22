import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock chrome.bookmarks API
const mockBookmarks = {
  getTree: vi.fn(),
  getChildren: vi.fn(),
  get: vi.fn(),
  create: vi.fn(),
}

vi.stubGlobal('chrome', {
  bookmarks: mockBookmarks,
})

import { getBrowserBookmarks } from '../../extension/background/bookmark-utils'

describe('getBrowserBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('应展平书签树为扁平列表', async () => {
    mockBookmarks.getTree.mockResolvedValue([
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: '书签栏',
            children: [
              {
                id: '10',
                title: 'Google',
                url: 'https://google.com',
                dateAdded: 1700000000000,
              },
              {
                id: '11',
                title: 'GitHub',
                url: 'https://github.com',
                dateAdded: 1700000000000,
              },
            ],
          },
        ],
      },
    ])

    const steps: string[] = []
    const result = await getBrowserBookmarks(steps)

    expect(result).toHaveLength(2)
    expect(result[0].title).toBe('Google')
    expect(result[0].url).toBe('https://google.com')
    expect(result[0].folder).toBe('/书签栏')
    expect(result[1].title).toBe('GitHub')
    expect(result[1].source).toBe('browser')
  })

  it('应处理多层嵌套文件夹', async () => {
    mockBookmarks.getTree.mockResolvedValue([
      {
        id: '0',
        title: '',
        children: [
          {
            id: '1',
            title: '书签栏',
            children: [
              {
                id: '10',
                title: 'Work',
                children: [
                  {
                    id: '100',
                    title: 'Docs',
                    url: 'https://docs.example.com',
                    dateAdded: 1700000000000,
                  },
                ],
              },
            ],
          },
        ],
      },
    ])

    const result = await getBrowserBookmarks([])

    expect(result).toHaveLength(1)
    expect(result[0].title).toBe('Docs')
    expect(result[0].folder).toBe('/书签栏/Work')
  })

  it('空书签树应返回空列表', async () => {
    mockBookmarks.getTree.mockResolvedValue([])

    const result = await getBrowserBookmarks([])

    expect(result).toHaveLength(0)
  })
})
