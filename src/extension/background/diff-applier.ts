import type { BookmarkDiff } from '../../shared/types'
import { resolveFolderPath } from './bookmark-utils'
import { removeEmptyAncestorFolders } from './folder-utils'

/** 将差异应用到浏览器原生书签 */
export async function applyDiffsToBrowser(
  diffs: BookmarkDiff[],
  steps: string[],
  cleanEmptyFolders: boolean,
): Promise<void> {
  // 收集所有被影响的原父文件夹 ID，在全部 diff 处理完后统一清理
  const affectedParents = new Set<string>()

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
              if (node.parentId) affectedParents.add(node.parentId)
              await chrome.bookmarks.remove(nodeId)
            }
          } catch {
            // 节点可能已不存在，忽略
          }
        } else {
          const searchUrl = diff.local?.url ?? diff.remote.url
          const found = await chrome.bookmarks.search({ url: searchUrl })
          for (const node of found) {
            if (node.parentId) affectedParents.add(node.parentId)
            await chrome.bookmarks.remove(node.id)
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
              affectedParents.add(oldParentId)
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

  // 所有 diff 处理完毕后再统一清理空文件夹
  // 避免在循环中逐个清理时错误移除后续 diff 所需的文件夹（例如：同一文件夹下的多个书签都被移走，
  // 前一个 diff 的清理把共享的祖先文件夹删除了，导致后一个 diff 需要重建）
  if (cleanEmptyFolders) {
    for (const parentId of affectedParents) {
      await removeEmptyAncestorFolders(parentId, steps)
    }
  }
}

/** 在扩展图标上显示执行结果（仅 badge，不污染标题） */
export function showResult(_steps: string[], ok: boolean) {
  chrome.action.setBadgeText({ text: ok ? 'ok' : 'ERR' })
  chrome.action.setBadgeBackgroundColor({ color: ok ? '#4caf50' : '#f44336' })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000)
}
