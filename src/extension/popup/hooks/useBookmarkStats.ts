import { useState, useEffect } from 'react'

/** 单根级文件夹的统计 */
export interface FolderStats {
  id: string
  title: string
  bookmarks: number
  folders: number
}

/** 整体书签统计 */
export interface BookmarkStatsData {
  totalBookmarks: number
  totalFolders: number
  rootFolders: FolderStats[]
}

/** 统计根级文件夹列表（仅用于索引，无 UI 标题） */
const ROOT_IDS = ['1', '2', '3']
const ROOT_TITLES: Record<string, string> = {
  '1': '书签栏',
  '2': '其他书签',
  '3': '移动设备书签',
}

function countNode(node: chrome.bookmarks.BookmarkTreeNode): { bookmarks: number; folders: number } {
  if (!node.children || node.children.length === 0) {
    // 有 url 是书签，无 url 是空文件夹
    return node.url ? { bookmarks: 1, folders: 0 } : { bookmarks: 0, folders: 1 }
  }

  let bookmarks = 0
  let folders = 0

  for (const child of node.children) {
    if (child.url) {
      bookmarks++
    } else {
      folders++
      const sub = countNode(child)
      bookmarks += sub.bookmarks
      folders += sub.folders
    }
  }

  return { bookmarks, folders }
}

export function useBookmarkStats(): BookmarkStatsData {
  const [stats, setStats] = useState<BookmarkStatsData>({
    totalBookmarks: 0,
    totalFolders: 0,
    rootFolders: [],
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const tree = await chrome.bookmarks.getTree()
        if (cancelled) return

        const rootFolders: FolderStats[] = []

        for (const id of ROOT_IDS) {
          const node = findNodeById(tree, id)
          if (node) {
            const counted = countNode(node)
            rootFolders.push({
              id,
              title: ROOT_TITLES[id] ?? node.title,
              bookmarks: counted.bookmarks,
              folders: counted.folders,
            })
          }
        }

        const totalBookmarks = rootFolders.reduce((s, f) => s + f.bookmarks, 0)
        const totalFolders = rootFolders.reduce((s, f) => s + f.folders, 0)

        setStats({ totalBookmarks, totalFolders, rootFolders })
      } catch {
        // chrome.bookmarks API 不可用（如 options 页面）
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  return stats
}

/** 在树中按 id 查找节点 */
function findNodeById(
  nodes: chrome.bookmarks.BookmarkTreeNode[],
  id: string,
): chrome.bookmarks.BookmarkTreeNode | undefined {
  for (const node of nodes) {
    if (node.id === id) return node
    if (node.children) {
      const found = findNodeById(node.children, id)
      if (found) return found
    }
  }
  return undefined
}
