import { useState, useCallback, useRef, useEffect } from 'react'
import { BOOKMARKS_BAR_ID, OTHER_BOOKMARKS_ID, MOBILE_BOOKMARKS_ID } from '../constants'

async function getFolderChildren(folderId: string): Promise<chrome.bookmarks.BookmarkTreeNode[]> {
  try {
    const [node] = await chrome.bookmarks.getSubTree(folderId)
    return node.children ?? []
  } catch {
    return []
  }
}

export function isFolderNode(node: chrome.bookmarks.BookmarkTreeNode): boolean {
  return !node.url && !!node.children
}

/**
 * 文件夹导航和书签浏览逻辑
 */
export function useBookmarkNavigation() {
  const [currentFolder, setCurrentFolder] = useState<{ id: string; title: string }>({
    id: BOOKMARKS_BAR_ID,
    title: '书签栏',
  })
  const [breadcrumbs, setBreadcrumbs] = useState<Array<{ id: string; title: string }>>([])
  const [currentItems, setCurrentItems] = useState<chrome.bookmarks.BookmarkTreeNode[]>([])

  const currentFolderRef = useRef(currentFolder)
  currentFolderRef.current = currentFolder

  const loadSeqRef = useRef(0)

  const loadFolder = useCallback(async (id: string) => {
    const seq = ++loadSeqRef.current
    const children = await getFolderChildren(id)
    if (seq === loadSeqRef.current) {
      setCurrentItems(children)
    }
  }, [])

  /** 初始化：加载书签栏数据 */
  const initNavigation = useCallback(async () => {
    const children = await getFolderChildren(BOOKMARKS_BAR_ID)
    setCurrentItems(children)
  }, [])

  // 挂载时自动加载初始数据
  useEffect(() => { initNavigation() }, [initNavigation])

  const enterFolder = useCallback(async (id: string, title: string) => {
    const children = await getFolderChildren(id)

    const prev = currentFolderRef.current
    const isSiblingRoot = (id === OTHER_BOOKMARKS_ID || id === MOBILE_BOOKMARKS_ID)
      && prev.id === BOOKMARKS_BAR_ID
    if (!isSiblingRoot) {
      setBreadcrumbs(b => [...b, prev])
    }
    setCurrentFolder({ id, title })
    setCurrentItems(children)
  }, [])

  const goBack = useCallback(async () => {
    if (breadcrumbs.length === 0) {
      if (currentFolderRef.current.id !== BOOKMARKS_BAR_ID) {
        const children = await getFolderChildren(BOOKMARKS_BAR_ID)
        setCurrentFolder({ id: BOOKMARKS_BAR_ID, title: '书签栏' })
        setCurrentItems(children)
      }
      return
    }
    const prev = breadcrumbs[breadcrumbs.length - 1]
    const children = await getFolderChildren(prev.id)
    setBreadcrumbs(b => b.slice(0, -1))
    setCurrentFolder(prev)
    setCurrentItems(children)
  }, [breadcrumbs])

  const navigateToBreadcrumb = useCallback(async (index: number) => {
    const target = breadcrumbs[index]
    const children = await getFolderChildren(target.id)
    setBreadcrumbs(b => b.slice(0, index))
    setCurrentFolder(target)
    setCurrentItems(children)
  }, [breadcrumbs])

  const openBookmark = useCallback((url: string) => {
    chrome.tabs.create({ url })
  }, [])

  const isRootView = breadcrumbs.length === 0
  const isHomeView = currentFolder.id === BOOKMARKS_BAR_ID && isRootView

  return {
    currentFolder,
    breadcrumbs,
    currentItems,
    isRootView,
    isHomeView,
    loadFolder,
    enterFolder,
    goBack,
    navigateToBreadcrumb,
    openBookmark,
  }
}
