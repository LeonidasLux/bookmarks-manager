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
 * Chrome 书签根目录的固定 ID（与语言无关）
 * - '1' = 书签栏 / Bookmarks bar
 * - '2' = 其他书签 / Other bookmarks
 * - '3' = 移动设备书签 / Mobile bookmarks
 */
const ROOT_FOLDER_MAP: Record<string, string> = {
  '1': '书签栏',
  '2': '其他书签',
  '3': '移动设备书签',
}

/** 反转 ROOT_FOLDER_MAP：名称 → ID */
const ROOT_NAME_TO_ID: Record<string, string> = {}
for (const [id, name] of Object.entries(ROOT_FOLDER_MAP)) {
  ROOT_NAME_TO_ID[name] = id
}

/**
 * 将文件夹路径解析为 Chrome 书签文件夹节点 ID
 * 路径格式：'/书签栏/子文件夹'，不存在则逐级创建
 *
 * 第一级路径段会优先匹配 Chrome 的三个根目录：
 * 1. 先按名称从 getTree() 结果中搜索
 * 2. 若未命中，再用已知根目录名称映射兜底（兼容某些 Chrome 版本返回英文标题的场景）
 * 3. 若都不是已知根，再以 parentId='1'（书签栏）作为父级创建
 */
export async function resolveFolderPath(folderPath: string, steps: string[]): Promise<string> {
  const parts = folderPath.split('/').filter(p => p !== '')
  if (parts.length === 0) {
    steps.push('空文件夹路径，默认使用书签栏')
    return '1'
  }

  // 1. 按名称从根级别查找
  const tree = await chrome.bookmarks.getTree()
  const rootChildren = tree[0]?.children ?? []
  let current: chrome.bookmarks.BookmarkTreeNode | undefined = rootChildren.find(
    (n: chrome.bookmarks.BookmarkTreeNode) => !n.url && n.title === parts[0]
  )

  // 2. 名称查找失败 → 用已知根目录名称映射兜底
  if (!current) {
    const knownRootId = ROOT_NAME_TO_ID[parts[0]]
    if (knownRootId) {
      current = rootChildren.find(
        (n: chrome.bookmarks.BookmarkTreeNode) => n.id === knownRootId
      )
    }
  }

  // 3. 仍然未找到 → 以书签栏 (id='1') 为父级创建新文件夹
  if (!current) {
    steps.push(`创建一级文件夹: ${parts[0]}`)
    current = await chrome.bookmarks.create({ parentId: '1', title: parts[0] })
  }

  // 逐级创建/查找子文件夹
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
