import type { BookmarkDiff } from '../../shared/types'

const ROOT_FOLDER_IDS = new Set(['0', '1', '2', '3'])

/** 递归删除空父文件夹，从 parentId 向上遍历，直到遇到非空文件夹或根级别 */
export async function removeEmptyAncestorFolders(parentId: string, steps: string[]): Promise<void> {
  let currentId = parentId
  while (currentId && !ROOT_FOLDER_IDS.has(currentId)) {
    const children = await chrome.bookmarks.getChildren(currentId)
    if (children.length > 0) return
    try {
      const [node] = await chrome.bookmarks.get(currentId)
      const grandParent = node?.parentId
      await chrome.bookmarks.remove(currentId)
      steps.push(`- folder: ${node?.title ?? currentId}`)
      currentId = grandParent ?? ''
    } catch {
      return
    }
  }
}

/** 计算应用全部 diffs 后会变空的文件夹路径列表 */
export async function computeEmptyFolders(diffs: BookmarkDiff[]): Promise<string[]> {
  const parentsToCheck = new Set<string>()

  for (const d of diffs) {
    if (d.type === 'deleted' && d.local?.id) {
      try {
        const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(d.local.id)
        const node = nodes[0]
        if (node?.parentId && !ROOT_FOLDER_IDS.has(node.parentId)) {
          parentsToCheck.add(node.parentId)
        }
      } catch { /* 忽略 */ }
    } else if (d.type === 'modified' && d.changes?.some(c => c.field === 'folder') && d.local?.id) {
      try {
        const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(d.local.id)
        const node = nodes[0]
        if (node?.parentId && !ROOT_FOLDER_IDS.has(node.parentId)) {
          parentsToCheck.add(node.parentId)
        }
      } catch { /* 忽略 */ }
    }
  }

  if (parentsToCheck.size === 0) return []

  const removedUrls = new Set<string>()
  for (const d of diffs) {
    if (d.type === 'deleted') {
      removedUrls.add(d.local?.url ?? d.remote.url)
    } else if (d.type === 'modified' && d.changes?.some(c => c.field === 'folder')) {
      removedUrls.add(d.local?.url ?? d.remote.url)
    }
  }

  const emptyPaths: string[] = []
  for (const parentId of parentsToCheck) {
    const children: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.getChildren(parentId)
    const hasSubfolders = children.some(c => !c.url)
    if (hasSubfolders) continue

    const allGone = children.every(c => {
      if (!c.url) return true
      return removedUrls.has(c.url)
    })

    if (allGone && children.some(c => c.url)) {
      const path = await getFolderPathFromId(parentId)
      emptyPaths.push(path)
    }
  }

  return emptyPaths.sort()
}

/** 从书签节点向上遍历，构建文件夹路径 */
async function getFolderPathFromId(nodeId: string): Promise<string> {
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
