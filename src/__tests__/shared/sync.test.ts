import { describe, it, expect } from 'vitest'
import { normalizeFolderPath, SyncEngine } from '../../shared/sync'
import type { Bookmark } from '../../shared/types'

describe('normalizeFolderPath', () => {
  it('应该返回根路径 "/" 对于空字符串', () => {
    expect(normalizeFolderPath('')).toBe('/')
  })

  it('应该去掉多余斜杠', () => {
    expect(normalizeFolderPath('//a//b//')).toBe('/a/b')
  })

  it('应该保证以单斜杠开头', () => {
    expect(normalizeFolderPath('a/b')).toBe('/a/b')
  })

  it('应该保留已有正确格式', () => {
    expect(normalizeFolderPath('/书签栏/子文件夹')).toBe('/书签栏/子文件夹')
  })
})

describe('SyncEngine.computeDiff', () => {
  const makeBookmark = (overrides: Partial<Bookmark> = {}): Bookmark => ({
    id: '1',
    title: 'Test',
    url: 'https://example.com',
    folder: '/',
    tags: [],
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    ...overrides,
  })

  it('应该检测远程新增的书签', () => {
    const remote: Bookmark[] = [makeBookmark({ id: 'r1', title: 'New', url: 'https://new.com' })]
    const local: Bookmark[] = []

    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('added')
    expect(diffs[0].remote.title).toBe('New')
  })

  it('应该检测本地独有的书签为删除', () => {
    const remote: Bookmark[] = []
    const local: Bookmark[] = [makeBookmark({ id: 'l1', title: 'Local Only', url: 'https://local.com' })]

    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('deleted')
    expect(diffs[0].local!.title).toBe('Local Only')
  })

  it('应该检测标题修改', () => {
    const remote: Bookmark[] = [makeBookmark({ id: 'r1', title: 'Updated', url: 'https://same.com' })]
    const local: Bookmark[] = [makeBookmark({ id: 'l1', title: 'Original', url: 'https://same.com' })]

    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('modified')
    expect(diffs[0].changes).toHaveLength(1)
    expect(diffs[0].changes![0].from).toBe('Original')
    expect(diffs[0].changes![0].to).toBe('Updated')
  })

  it('应该检测文件夹路径修改', () => {
    const remote: Bookmark[] = [makeBookmark({ id: 'r1', title: 'Same', url: 'https://same.com', folder: '/new-folder' })]
    const local: Bookmark[] = [makeBookmark({ id: 'l1', title: 'Same', url: 'https://same.com', folder: '/old-folder' })]

    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs).toHaveLength(1)
    expect(diffs[0].type).toBe('modified')
    expect(diffs[0].changes![0].field).toBe('folder')
  })

  it('完全相同时应返回空差异', () => {
    const remote: Bookmark[] = [makeBookmark({ id: 'r1', title: 'Same', url: 'https://same.com' })]
    const local: Bookmark[] = [makeBookmark({ id: 'l1', title: 'Same', url: 'https://same.com' })]

    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs).toHaveLength(0)
  })

  it('应正确匹配重复URL的书签', () => {
    const remote: Bookmark[] = [
      makeBookmark({ id: 'r1', title: 'A', url: 'https://dup.com' }),
      makeBookmark({ id: 'r2', title: 'B', url: 'https://dup.com' }),
    ]
    const local: Bookmark[] = [
      makeBookmark({ id: 'l1', title: 'A', url: 'https://dup.com' }),
    ]

    const diffs = SyncEngine.computeDiff(remote, local)

    // 第一个匹配成功，第二个是新增
    const added = diffs.filter(d => d.type === 'added')
    expect(added).toHaveLength(1)
  })
})
