import type { Bookmark, BookmarkDiff } from '../../shared/types'
import { normalizeFolderPath } from '../../shared/sync'
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

/**
 * 按远程书签数组顺序重排所有层级。
 *
 * 远程 bookmarks.json 数组保持用户原始顺序，其顺序是跨文件夹交织的。
 * 但 applyDiffsToBrowser 创建书签时不指定 index，新书签插到末尾，
 * 且子文件夹不参与重排，导致文件夹间顺序错乱。
 *
 * 修复：为远程数组中出现的**每一级祖先目录**（不仅仅是叶子文件夹）
 * 计算子节点（文件夹 + 书签）的远程顺序，然后逐个 move 到正确位置。
 */
export async function reorderBookmarks(
  remoteBookmarks: Bookmark[],
  steps: string[],
): Promise<void> {
  // 1. 构建每级目录的子元素远程顺序表
  //    parentPath -> [childKey1, childKey2, ...]
  //    childKey = 子文件夹名（非书签）| 书签 URL（叶子层）
  const childOrder = new Map<string, string[]>()

  for (const bm of remoteBookmarks) {
    const folder = normalizeFolderPath(bm.folder || '/')
    const parts = folder.split('/').filter(p => p !== '')
    const lastIdx = parts.length // 叶子层：parts.length = 父级目录深度，书签URL放最后一层

    // 为每一层深度注册子节点
    for (let depth = 1; depth <= lastIdx; depth++) {
      const parentPath = '/' + parts.slice(0, depth).join('/')
      // depth === lastIdx → 叶子文件夹，child = bookmark URL
      // depth < lastIdx  → 中间文件夹，child = 子文件夹名
      const childKey = depth < lastIdx ? parts[depth] : bm.url

      if (!childOrder.has(parentPath)) {
        childOrder.set(parentPath, [])
      }
      const list = childOrder.get(parentPath)!
      if (!list.includes(childKey)) {
        list.push(childKey)
      }
    }
  }

  // 2. 重排每层目录
  let totalMoves = 0

  for (const [parentPath, expectedOrder] of childOrder) {
    if (parentPath === '/') continue // 跳过根级

    const parentId = await resolveFolderPath(parentPath, steps)
    const children = await chrome.bookmarks.getChildren(parentId)

    // 构建 childKey → node 映射
    const nodeMap = new Map<string, chrome.bookmarks.BookmarkTreeNode>()
    for (const child of children) {
      const key = child.url || child.title
      nodeMap.set(key, child)
    }

    let idx = 0
    let moves = 0
    for (const childKey of expectedOrder) {
      const node = nodeMap.get(childKey)
      if (node) {
        await chrome.bookmarks.move(node.id, { index: idx })
        moves++
        idx++ // 仅在找到节点时递增
      }
    }

    if (moves > 0) {
      steps.push(`重排 ${parentPath}: ${moves} 项`)
      totalMoves += moves
    }
  }

  if (totalMoves > 0) {
    steps.push(`重排完成: 共 ${totalMoves} 项`)
  }
}

/** 在扩展图标上显示执行结果（仅 badge，不污染标题） */
export function showResult(_steps: string[], ok: boolean) {
  chrome.action.setBadgeText({ text: ok ? 'ok' : 'ERR' })
  chrome.action.setBadgeBackgroundColor({ color: ok ? '#4caf50' : '#f44336' })
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000)
}
