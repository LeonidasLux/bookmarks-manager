import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { Bookmark } from '../../shared/types'

/**
 * 真正的 Chrome bookmarks API 模拟——维护树状态，
 * create/move/remove 实际改变 children 数组和 index。
 */
class BookmarksTreeMock {
  private nextId = 1000
  private nodes = new Map<string, chrome.bookmarks.BookmarkTreeNode>()
  private parentChildren = new Map<string, chrome.bookmarks.BookmarkTreeNode[]>()

  /** 从 getTree 格式构建内部树 */
  setTree(tree: chrome.bookmarks.BookmarkTreeNode[]) {
    this.nodes.clear()
    this.parentChildren.clear()

    const walk = (nodes: chrome.bookmarks.BookmarkTreeNode[], parentId?: string) => {
      for (let i = 0; i < nodes.length; i++) {
        const n = { ...nodes[i], index: i, parentId } as chrome.bookmarks.BookmarkTreeNode
        this.nodes.set(n.id, n)
        if (n.children) {
          const kids = n.children
          this.parentChildren.set(n.id, kids)
          walk(kids, n.id)
        } else if (!n.url) {
          this.parentChildren.set(n.id, [])
        }
        delete (n as any).children
      }
    }
    walk(tree)
  }

  /** 从扁平 Bookmark[] 重建树（仅用于测试，忽略原始 id） */
  buildFromBookmarks(bookmarks: Bookmark[]) {
    this.nodes.clear()
    this.parentChildren.clear()
    this.nextId = 1000 // 预留 1000+ 给文件夹

    // 根
    this.nodes.set('0', { id: '0', title: '', index: 0 })
    // 三个已知根目录
    for (const { id, title } of [
      { id: '1', title: '书签栏' },
      { id: '2', title: '其他书签' },
      { id: '3', title: '移动设备书签' },
    ]) {
      this.nodes.set(id, { id, title, parentId: '0', index: Number(id) - 1 })
      this.parentChildren.set(id, [])
    }
    this.parentChildren.set('0', [
      this.nodes.get('1')!,
      this.nodes.get('2')!,
      this.nodes.get('3')!,
    ])

    // 确保目录层级都存在
    const ensureFolder = (path: string): string => {
      const parts = path.split('/').filter(p => p !== '')
      let currentId = '0'
      for (const part of parts) {
        const siblings = this.parentChildren.get(currentId) ?? []
        let child = siblings.find(n => !n.url && n.title === part)
        if (!child) {
          const id = String(this.nextId++)
          child = { id, title: part, parentId: currentId, index: siblings.length }
          this.nodes.set(id, child)
          siblings.push(child)
          this.parentChildren.set(id, [])
          this.reindex(siblings)
        } else {
          this.nodes.set(child.id, child) // 确保 nodes 中有引用
        }
        currentId = child.id
      }
      return currentId
    }

    // 创建所有书签
    for (const bm of bookmarks) {
      const parentId = ensureFolder(bm.folder)
      const siblings = this.parentChildren.get(parentId)!
      const id = String(this.nextId++)
      const node: chrome.bookmarks.BookmarkTreeNode = {
        id,
        title: bm.title,
        url: bm.url,
        parentId,
        index: siblings.length,
      }
      this.nodes.set(id, node)
      siblings.push(node)
    }
  }

  // ---- API methods ----

  getTree(): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const buildTree = (id: string): chrome.bookmarks.BookmarkTreeNode => {
      const node = this.nodes.get(id)
      if (!node) throw new Error(`Node ${id} not found in mock tree`)
      const kids = this.parentChildren.get(id)
      if (kids !== undefined) {
        return { ...node, children: kids.map(k => buildTree(k.id)) }
      }
      return { ...node }
    }
    return Promise.resolve([buildTree('0')])
  }

  get(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    const n = this.nodes.get(id)
    return Promise.resolve(n ? [{ ...n }] : [])
  }

  getChildren(id: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
    return Promise.resolve((this.parentChildren.get(id) ?? []).map(n => ({ ...n })))
  }

  create(opts: {
    parentId: string
    title: string
    url?: string
    index?: number
  }): Promise<chrome.bookmarks.BookmarkTreeNode> {
    const id = String(this.nextId++)
    const siblings = this.parentChildren.get(opts.parentId) ?? []
    const idx = opts.index ?? siblings.length

    const node: chrome.bookmarks.BookmarkTreeNode = {
      id,
      title: opts.title,
      parentId: opts.parentId,
      index: idx,
      ...(opts.url ? { url: opts.url } : {}),
    }
    this.nodes.set(id, node)
    siblings.splice(idx, 0, node)
    this.parentChildren.set(opts.parentId, siblings)
    this.reindex(siblings)
    return Promise.resolve({ ...node })
  }

  move(id: string, dest: { parentId?: string; index?: number }): Promise<chrome.bookmarks.BookmarkTreeNode> {
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Node ${id} not found`)
    const oldParentId = node.parentId!

    if (oldParentId) {
      const oldSiblings = this.parentChildren.get(oldParentId) ?? []
      const oldIdx = oldSiblings.findIndex(n => n.id === id)
      if (oldIdx !== -1) {
        oldSiblings.splice(oldIdx, 1)
        this.reindex(oldSiblings)
      }
    }

    const newParentId = dest.parentId ?? oldParentId
    const newSiblings = this.parentChildren.get(newParentId) ?? []
    const idx = Math.min(dest.index ?? newSiblings.length, newSiblings.length)
    newSiblings.splice(idx, 0, node)
    this.parentChildren.set(newParentId, newSiblings)
    this.reindex(newSiblings)

    node.parentId = newParentId
    node.index = idx
    return Promise.resolve({ ...node })
  }

  remove(id: string): Promise<void> {
    const node = this.nodes.get(id)
    if (!node) return Promise.resolve()
    const parentId = node.parentId!
    const siblings = this.parentChildren.get(parentId) ?? []
    const idx = siblings.findIndex(n => n.id === id)
    if (idx !== -1) {
      siblings.splice(idx, 1)
      this.reindex(siblings)
    }
    this.nodes.delete(id)
    this.parentChildren.delete(id)
    return Promise.resolve()
  }

  update(id: string, changes: { title?: string; url?: string }): Promise<chrome.bookmarks.BookmarkTreeNode> {
    const node = this.nodes.get(id)
    if (!node) throw new Error(`Node ${id} not found`)
    if (changes.title !== undefined) node.title = changes.title
    if (changes.url !== undefined) node.url = changes.url
    return Promise.resolve({ ...node })
  }

  /** 断言辅助：按遍历顺序列出叶子书签的 flat 顺序 */
  getFlatTitles(): string[] {
    const result: string[] = []
    const walk = (id: string) => {
      const kids = this.parentChildren.get(id)
      if (!kids) return
      for (const child of kids) {
        if (child.url) {
          result.push(child.title)
        } else {
          walk(child.id)
        }
      }
    }
    // 从三个根目录开始
    for (const root of this.parentChildren.get('0') ?? []) {
      walk(root.id)
    }
    return result
  }

  getFlatUrls(): string[] {
    const result: string[] = []
    const walk = (id: string) => {
      const kids = this.parentChildren.get(id)
      if (!kids) return
      for (const child of kids) {
        if (child.url) {
          result.push(child.url)
        } else {
          walk(child.id)
        }
      }
    }
    for (const root of this.parentChildren.get('0') ?? []) {
      walk(root.id)
    }
    return result
  }

  /** 获取指定父节点下的子节点名称（含文件夹和书签） */
  getChildrenTitles(id: string): string[] {
    return (this.parentChildren.get(id) ?? []).map(n => n.title)
  }

  private reindex(siblings: chrome.bookmarks.BookmarkTreeNode[]) {
    for (let i = 0; i < siblings.length; i++) {
      siblings[i].index = i
    }
  }
}

// ---- 全局 mock 设置 ----
let mockTree: BookmarksTreeMock

vi.stubGlobal('chrome', {
  bookmarks: {
    getTree: vi.fn(),
    get: vi.fn(),
    getChildren: vi.fn(),
    create: vi.fn(),
    move: vi.fn(),
    remove: vi.fn(),
    update: vi.fn(),
  },
})

function setupMockTree(rootFolders: chrome.bookmarks.BookmarkTreeNode[]) {
  mockTree = new BookmarksTreeMock()
  mockTree.setTree([
    {
      id: '0',
      title: '',
      children: rootFolders,
    },
  ])

  const bm = chrome.bookmarks as any
  bm.getTree = vi.fn(() => mockTree.getTree())
  bm.get = vi.fn((id: string) => mockTree.get(id))
  bm.getChildren = vi.fn((id: string) => mockTree.getChildren(id))
  bm.create = vi.fn((opts: any) => mockTree.create(opts))
  bm.move = vi.fn((id: string, dest: any) => mockTree.move(id, dest))
  bm.remove = vi.fn((id: string) => mockTree.remove(id))
  bm.update = vi.fn((id: string, changes: any) => mockTree.update(id, changes))
}

function setupMockTreeFromBookmarks(bookmarks: Bookmark[]) {
  mockTree = new BookmarksTreeMock()
  mockTree.buildFromBookmarks(bookmarks)

  const bm = chrome.bookmarks as any
  bm.getTree = vi.fn(() => mockTree.getTree())
  bm.get = vi.fn((id: string) => mockTree.get(id))
  bm.getChildren = vi.fn((id: string) => mockTree.getChildren(id))
  bm.create = vi.fn((opts: any) => mockTree.create(opts))
  bm.move = vi.fn((id: string, dest: any) => mockTree.move(id, dest))
  bm.remove = vi.fn((id: string) => mockTree.remove(id))
  bm.update = vi.fn((id: string, changes: any) => mockTree.update(id, changes))
}

// ---- 导入被测模块 ----
import { getBrowserBookmarks } from '../../extension/background/bookmark-utils'
import { applyDiffsToBrowser, reorderBookmarks } from '../../extension/background/diff-applier'
import { SyncEngine } from '../../shared/sync'

describe('reorderBookmarks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('新增书签后按远程顺序重排', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'C', url: 'http://c.com', dateAdded: 1000 },
          { id: '11', title: 'A', url: 'http://a.com', dateAdded: 1000 },
          { id: '12', title: 'E', url: 'http://e.com', dateAdded: 1000 },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: 'C', url: 'http://c.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r4', title: 'D', url: 'http://d.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r5', title: 'E', url: 'http://e.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
    ]

    const local = await getBrowserBookmarks([])
    const diffs = SyncEngine.computeDiff(remote, local)

    await applyDiffsToBrowser(diffs, [], false)
    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('1')).toEqual(['A', 'B', 'C', 'D', 'E'])
  })

  it('完全反转顺序', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'A', url: 'http://a.com', dateAdded: 1000 },
          { id: '11', title: 'B', url: 'http://b.com', dateAdded: 1000 },
          { id: '12', title: 'C', url: 'http://c.com', dateAdded: 1000 },
          { id: '13', title: 'D', url: 'http://d.com', dateAdded: 1000 },
          { id: '14', title: 'E', url: 'http://e.com', dateAdded: 1000 },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'r5', title: 'E', url: 'http://e.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r4', title: 'D', url: 'http://d.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: 'C', url: 'http://c.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
    ]

    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('1')).toEqual(['E', 'D', 'C', 'B', 'A'])
  })

  it('重排子文件夹顺序', async () => {
    // 本地树：书签栏下 folderX, folderB, folderA 按此顺序
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'folderX', children: [{ id: '100', title: 'X', url: 'http://x.com', dateAdded: 1000 }] },
          { id: '11', title: 'folderB', children: [{ id: '110', title: 'B', url: 'http://b.com', dateAdded: 1000 }] },
          { id: '12', title: 'folderA', children: [{ id: '120', title: 'A', url: 'http://a.com', dateAdded: 1000 }] },
        ],
      },
    ])

    // 远程顺序：A, B, X → 跨文件夹交织
    const remote: Bookmark[] = [
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏/folderA', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏/folderB', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: 'X', url: 'http://x.com', folder: '/书签栏/folderX', tags: [], createdAt: '', updatedAt: '' },
    ]

    await reorderBookmarks(remote, [])

    // 书签栏的子节点应该按远程首次出现顺序排：folderA, folderB, folderX
    const barChildren = mockTree.getChildrenTitles('1')
    const folderAIdx = barChildren.indexOf('folderA')
    const folderBIdx = barChildren.indexOf('folderB')
    const folderXIdx = barChildren.indexOf('folderX')
    expect(folderAIdx).toBeLessThan(folderBIdx)
    expect(folderBIdx).toBeLessThan(folderXIdx)
  })

  it('复杂场景：跨文件夹交织顺序', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'D', url: 'http://d.com', dateAdded: 1000 },
          { id: '11', title: 'tools', children: [
            { id: '110', title: 'B', url: 'http://b.com', dateAdded: 1000 },
          ]},
          { id: '12', title: 'home', children: [
            { id: '120', title: 'A', url: 'http://a.com', dateAdded: 1000 },
          ]},
          { id: '13', title: 'C', url: 'http://c.com', dateAdded: 1000 },
        ],
      },
    ])

    // 远程交织顺序：A(home), B(tools), C(根), D(根)
    const remote: Bookmark[] = [
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏/home', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏/tools', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: 'C', url: 'http://c.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r4', title: 'D', url: 'http://d.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
    ]

    await reorderBookmarks(remote, [])

    // /书签栏 的子节点顺序：home, tools, C(url), D(url)
    const barChildren = mockTree.getChildrenTitles('1')
    const homeIdx = barChildren.indexOf('home')
    const toolsIdx = barChildren.indexOf('tools')
    const cIdx = barChildren.indexOf('C')
    const dIdx = barChildren.indexOf('D')
    expect(homeIdx).toBeLessThan(toolsIdx)
    expect(toolsIdx).toBeLessThan(cIdx)
    expect(cIdx).toBeLessThan(dIdx)
  })

  it('复杂场景：新增 + 修改 + 删除 + 跨文件夹', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'Google', url: 'http://google.com', dateAdded: 1000 },
          { id: '11', title: '旧标题', url: 'http://old.com', dateAdded: 1000 },
          { id: '12', title: '多余', url: 'http://extra.com', dateAdded: 1000 },
          { id: '13', title: 'Bing', url: 'http://bing.com', dateAdded: 1000 },
          { id: '14', title: '稳定', url: 'http://stable.com', dateAdded: 1000 },
        ],
      },
      {
        id: '2',
        title: '其他书签',
        children: [
          { id: '20', title: '旧书签', url: 'http://old-work.com', dateAdded: 1000 },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'r1', title: 'GitHub', url: 'http://github.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'Google', url: 'http://google.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: '新标题', url: 'http://old.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r4', title: 'Bing', url: 'http://bing.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r5', title: 'StackOverflow', url: 'http://stackoverflow.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r6', title: '稳定', url: 'http://stable.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r7', title: '新书签', url: 'http://new-work.com', folder: '/其他书签', tags: [], createdAt: '', updatedAt: '' },
    ]

    const local = await getBrowserBookmarks([])
    const diffs = SyncEngine.computeDiff(remote, local)

    await applyDiffsToBrowser(diffs, [], false)
    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('1')).toEqual([
      'GitHub',
      'Google',
      '新标题',
      'Bing',
      'StackOverflow',
      '稳定',
    ])
    expect(mockTree.getChildrenTitles('2')).toEqual(['新书签'])
  })

  it('部分应用时已存在书签仍按远程顺序重排', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'C', url: 'http://c.com', dateAdded: 1000 },
          { id: '11', title: 'A', url: 'http://a.com', dateAdded: 1000 },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r3', title: 'C', url: 'http://c.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
    ]

    const local = await getBrowserBookmarks([])
    const diffs = SyncEngine.computeDiff(remote, local)

    const onlyAdded = diffs.filter(d => d.type === 'added')
    expect(onlyAdded).toHaveLength(1)

    await applyDiffsToBrowser(onlyAdded, [], false)
    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('1')).toEqual(['A', 'B', 'C'])
  })

  it('跨文件夹移动后重排', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          { id: '10', title: 'A', url: 'http://a.com', dateAdded: 1000 },
        ],
      },
      {
        id: '2',
        title: '其他书签',
        children: [
          { id: '11', title: 'B', url: 'http://b.com', dateAdded: 1000 },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'r2', title: 'B', url: 'http://b.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'r1', title: 'A', url: 'http://a.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
    ]

    const local = await getBrowserBookmarks([])
    const diffs = SyncEngine.computeDiff(remote, local)

    expect(diffs.filter(d => d.type === 'modified')).toHaveLength(1)

    await applyDiffsToBrowser(diffs, [], false)
    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('1')).toEqual(['B', 'A'])
    expect(mockTree.getChildrenTitles('2')).toHaveLength(0)
  })

  it('多级子文件夹书签排序', async () => {
    setupMockTree([
      {
        id: '1',
        title: '书签栏',
        children: [
          {
            id: '10',
            title: '工作',
            children: [
              { id: '100', title: 'B', url: 'http://b.com', dateAdded: 1000 },
              { id: '101', title: 'A', url: 'http://a.com', dateAdded: 1000 },
              { id: '102', title: 'C', url: 'http://c.com', dateAdded: 1000 },
            ],
          },
        ],
      },
    ])

    const remote: Bookmark[] = [
      { id: 'ra', title: 'A', url: 'http://a.com', folder: '/书签栏/工作', tags: [], createdAt: '', updatedAt: '' },
      { id: 'rb', title: 'B', url: 'http://b.com', folder: '/书签栏/工作', tags: [], createdAt: '', updatedAt: '' },
      { id: 'rc', title: 'C', url: 'http://c.com', folder: '/书签栏/工作', tags: [], createdAt: '', updatedAt: '' },
    ]

    await reorderBookmarks(remote, [])

    expect(mockTree.getChildrenTitles('10')).toEqual(['A', 'B', 'C'])
  })

  it('仿真端到端：小规模本地 + 大规模远程，多级文件夹排序', async () => {
    // 模拟用户场景：本地少量书签，远程大量多级文件夹书签
    // 远程 JSON 按深度优先树遍历产生，所以数据构造也按此顺序

    // 本地书签（7条）- 顺序错乱
    const localBookmarks: Bookmark[] = [
      { id: 'l1', title: '主页', url: 'http://homepage.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l2', title: '工作台', url: 'http://workbench.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l3', title: '在线工具', url: 'http://tool1.com', folder: '/书签栏/tools', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l4', title: '百度翻译', url: 'http://fanyi.com', folder: '/书签栏/tools', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l5', title: '进制转换', url: 'http://hex.com', folder: '/书签栏/tools/常用工具', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l6', title: 'My Reviews', url: 'http://gerrit.com/reviews', folder: '/书签栏/gerrit', tags: [], createdAt: '', updatedAt: '' },
      { id: 'l7', title: 'Doc A', url: 'http://docs.com/a', folder: '/书签栏/work/projectA', tags: [], createdAt: '', updatedAt: '' },
    ]

    const urlGen = (prefix: string, idx: number) => `http://${prefix}-${idx}.com`
    const remoteBookmarks: Bookmark[] = []

    // 按照深度优先树遍历构建远程序列
    // 结构：/书签栏/home → /书签栏/home/旅游 → /书签栏/home/WUT
    //       /书签栏/AI  → /书签栏/AI/tools → /书签栏/AI/platform → /书签栏/AI/docs
    //       /书签栏/tools → /书签栏/tools/常用工具 → /书签栏/tools/不常用
    //       /书签栏/gerrit
    //       /书签栏/work → /书签栏/work/projectA → /书签栏/work/projectB
    //       最后 /书签栏 根级书签

    // 1) /书签栏/home/旅游
    for (let i = 0; i < 3; i++) {
      remoteBookmarks.push({ id: `r-lv-${i}`, title: `旅游${i}`, url: urlGen('lvyou', i), folder: '/书签栏/home/旅游', tags: [], createdAt: '', updatedAt: '' })
    }
    // 2) /书签栏/home/WUT
    for (let i = 0; i < 5; i++) {
      remoteBookmarks.push({ id: `r-wut-${i}`, title: `WUT${i}`, url: urlGen('wut', i), folder: '/书签栏/home/WUT', tags: [], createdAt: '', updatedAt: '' })
    }

    // 3) /书签栏/AI/tools
    for (let i = 0; i < 8; i++) {
      remoteBookmarks.push({ id: `r-ai-t-${i}`, title: `AI工具${i}`, url: urlGen('ai-tool', i), folder: '/书签栏/AI/tools', tags: [], createdAt: '', updatedAt: '' })
    }
    // 4) /书签栏/AI/platform
    for (let i = 0; i < 6; i++) {
      remoteBookmarks.push({ id: `r-ai-p-${i}`, title: `AI平台${i}`, url: urlGen('ai-platform', i), folder: '/书签栏/AI/platform', tags: [], createdAt: '', updatedAt: '' })
    }
    // 5) /书签栏/AI/docs
    for (let i = 0; i < 4; i++) {
      remoteBookmarks.push({ id: `r-ai-d-${i}`, title: `AI文档${i}`, url: urlGen('ai-docs', i), folder: '/书签栏/AI/docs', tags: [], createdAt: '', updatedAt: '' })
    }

    // 6) /书签栏/tools（本地已有的在线工具和百度翻译也在其中）
    for (let i = 0; i < 7; i++) {
      remoteBookmarks.push({ id: `r-t-${i}`, title: `工具${i}`, url: urlGen('tool', i), folder: '/书签栏/tools', tags: [], createdAt: '', updatedAt: '' })
    }
    // 7) /书签栏/tools/常用工具（本地已有进制转换）
    for (let i = 0; i < 10; i++) {
      remoteBookmarks.push({ id: `r-cy-${i}`, title: `常用工具${i}`, url: urlGen('changyong', i), folder: '/书签栏/tools/常用工具', tags: [], createdAt: '', updatedAt: '' })
    }
    // 8) /书签栏/tools/不常用
    for (let i = 0; i < 5; i++) {
      remoteBookmarks.push({ id: `r-bc-${i}`, title: `不常用${i}`, url: urlGen('buchangyong', i), folder: '/书签栏/tools/不常用', tags: [], createdAt: '', updatedAt: '' })
    }

    // 9) /书签栏/gerrit
    for (let i = 0; i < 6; i++) {
      remoteBookmarks.push({ id: `r-g-${i}`, title: `Gerrit${i}`, url: urlGen('gerrit', i), folder: '/书签栏/gerrit', tags: [], createdAt: '', updatedAt: '' })
    }

    // 10) /书签栏/work/projectA（本地已有 Doc A）
    for (let i = 0; i < 5; i++) {
      remoteBookmarks.push({ id: `r-pa-${i}`, title: `ProjA${i}`, url: urlGen('proja', i), folder: '/书签栏/work/projectA', tags: [], createdAt: '', updatedAt: '' })
    }
    // 11) /书签栏/work/projectB
    for (let i = 0; i < 4; i++) {
      remoteBookmarks.push({ id: `r-pb-${i}`, title: `ProjB${i}`, url: urlGen('projb', i), folder: '/书签栏/work/projectB', tags: [], createdAt: '', updatedAt: '' })
    }

    // 12) /书签栏 根级书签（最后出现）
    remoteBookmarks.push({ id: 'r-main', title: '主页', url: 'http://homepage.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' })
    remoteBookmarks.push({ id: 'r-work', title: '工作台', url: 'http://workbench.com', folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' })
    for (let i = 0; i < 3; i++) {
      remoteBookmarks.push({ id: `r-root-${i}`, title: `根级${i}`, url: urlGen('root', i), folder: '/书签栏', tags: [], createdAt: '', updatedAt: '' })
    }

    console.log('本地:', localBookmarks.length, '远程:', remoteBookmarks.length)

    setupMockTreeFromBookmarks(localBookmarks)

    const local = await getBrowserBookmarks([])
    const diffs = SyncEngine.computeDiff(remoteBookmarks, local)
    await applyDiffsToBrowser(diffs, [], false)
    await reorderBookmarks(remoteBookmarks, [])

    // 验证 flat 序列与远程一致（二者都是深度优先树遍历）
    const flatUrls = mockTree.getFlatUrls()
    const remoteUrls = remoteBookmarks.map(b => b.url)

    expect(flatUrls).toEqual(remoteUrls)
  }, 60000)
})
