import type { BookmarkDiff } from '../../shared/types'
import { resolveFolderPath } from './bookmark-utils'
import { removeEmptyAncestorFolders } from './folder-utils'

/** 将差异应用到浏览器原生书签 */
export async function applyDiffsToBrowser(
  diffs: BookmarkDiff[],
  steps: string[],
  cleanEmptyFolders: boolean,
): Promise<void> {
  for (const diff of diffs) {
    switch (diff.type) {
      case 'added': {
        const parentId = await resolveFolderPath(diff.remote.folder || '/', steps)
        const node = await chrome.bookmarks.create({
          parentId,
          title: diff.remote.title,
          url: diff.remote.url,
        })
        steps.push(`+ browser: ${node.title}`)
        break
      }
      case 'deleted': {
        const nodeId = diff.local?.id
        if (nodeId) {
          try {
            const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(nodeId)
            const node = nodes[0]
            if (node) {
              const oldParentId = node.parentId
              await chrome.bookmarks.remove(nodeId)
              if (cleanEmptyFolders && oldParentId) {
                await removeEmptyAncestorFolders(oldParentId, steps)
              }
            }
          } catch {
            // 节点可能已不存在，忽略
          }
        } else {
          const searchUrl = diff.local?.url ?? diff.remote.url
          const found = await chrome.bookmarks.search({ url: searchUrl })
          for (const node of found) {
            const oldParentId = node.parentId
            await chrome.bookmarks.remove(node.id)
            if (cleanEmptyFolders && oldParentId) {
              await removeEmptyAncestorFolders(oldParentId, steps)
            }
          }
        }
        steps.push(`- browser: ${diff.remote.title}`)
        break
      }
      case 'modified': {
        const nodeId = diff.local?.id
        if (!nodeId) break
        try {
          const nodes: chrome.bookmarks.BookmarkTreeNode[] = await chrome.bookmarks.get(nodeId)
          const node = nodes[0]
          if (!node) break

          await chrome.bookmarks.update(nodeId, {
            title: diff.remote.title,
            url: diff.remote.url,
          })

          const hasFolderChange = diff.changes?.some(c => c.field === 'folder')
          if (hasFolderChange) {
            const oldParentId = node.parentId
            const newParentId = await resolveFolderPath(diff.remote.folder || '/', steps)
            if (oldParentId && oldParentId !== newParentId) {
              await chrome.bookmarks.move(nodeId, { parentId: newParentId })
              steps.push(`→ browser: ${diff.remote.title} → ${diff.remote.folder}`)
              if (cleanEmptyFolders) {
                await removeEmptyAncestorFolders(oldParentId, steps)
              }
            }
          }
          steps.push(`~ browser: ${diff.remote.title}`)
        } catch {
          // 节点可能已不存在，忽略
        }
        break
      }
    }
  }
}

/** 在扩展图标上显示执行结果 */
export function showResult(steps: string[], ok: boolean) {
  chrome.action.setBadgeText({ text: ok ? 'ok' : 'ERR' })
  chrome.action.setBadgeBackgroundColor({ color: ok ? '#4caf50' : '#f44336' })
  chrome.action.setTitle({ title: steps.join(' | ') })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000)
}
