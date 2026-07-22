import type { Bookmark } from '../../shared/types'
import { normalizeFolderPath } from '../../shared/sync'

/** 从浏览器原生书签读取并展开为扁平列表（始终取当前浏览器最新数据） */
export async function getBrowserBookmarks(steps: string[]): Promise<Bookmark[]> {
  const tree = await chrome.bookmarks.getTree()
  const flat: Bookmark[] = []

  function walk(nodes: chrome.bookmarks.BookmarkTreeNode[], folderPath: string) {
    for (const node of nodes) {
      if (node.url) {
        flat.push({
          id: node.id,
          title: node.title,
          url: node.url,
          folder: normalizeFolderPath(folderPath || '/'),
          tags: [],
          createdAt: new Date(node.dateAdded ?? Date.now()).toISOString(),
          updatedAt: new Date(node.dateAdded ?? Date.now()).toISOString(),
          source: 'browser',
        })
      }
      if (node.children) {
        walk(node.children, `${folderPath}/${node.title}`)
      }
    }
  }

  walk(tree, '')
  steps.push(`浏览器: ${flat.length} 条书签`)
  return flat
}

/**
 * 将文件夹路径解析为 Chrome 书签文件夹节点 ID
 * 路径格式：'/书签栏/子文件夹'，不存在则逐级创建
 */
export async function resolveFolderPath(folderPath: string, steps: string[]): Promise<string> {
  const parts = folderPath.split('/').filter(p => p !== '')
  if (parts.length === 0) {
    steps.push('空文件夹路径，默认使用书签栏')
    return '1'
  }

  const tree = await chrome.bookmarks.getTree()
  const rootChildren = tree[0]?.children ?? []
  let current: chrome.bookmarks.BookmarkTreeNode | undefined = rootChildren.find(
    (n: chrome.bookmarks.BookmarkTreeNode) => !n.url && n.title === parts[0]
  )

  if (!current) {
    steps.push(`创建一级文件夹: ${parts[0]}`)
    current = await chrome.bookmarks.create({ parentId: '1', title: parts[0] })
  }

  for (let i = 1; i < parts.length; i++) {
    const children: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getChildren(current.id)
    let next: chrome.bookmarks.BookmarkTreeNode | undefined = children.find(
      (n: chrome.bookmarks.BookmarkTreeNode) => !n.url && n.title === parts[i]
    )
    if (!next) {
      steps.push(`创建子文件夹: ${parts[i]}`)
      next = await chrome.bookmarks.create({ parentId: current.id, title: parts[i] })
    }
    current = next
  }

  return current!.id
}

/** 从书签节点向上遍历，构建文件夹路径 */
export async function getFolderPath(nodeId: string): Promise<string> {
  const ROOT_FOLDER_IDS = new Set(['0', '1', '2', '3'])
  const parts: string[] = []
  let currentId: string | undefined = nodeId

  while (currentId && !ROOT_FOLDER_IDS.has(currentId)) {
    try {
      const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(currentId)
      const node = nodes[0]
      if (!node) break
      parts.unshift(node.title)
      currentId = node.parentId
    } catch {
      break
    }
  }

  return '/' + parts.join('/')
}
