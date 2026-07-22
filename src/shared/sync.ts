import type { Bookmark, AppConfig, BookmarkDiff } from './types'

const BOOKMARK_PATH = 'bookmarks.json'

/** 解码 GitHub API 返回的 base64 内容（兼容 SW 环境） */
function decodeGitHubContent(encoded: string): string {
  const bytes = base64ToBytesFallback(encoded)
  return new TextDecoder().decode(bytes)
}

function base64ToBytesFallback(base64: string): Uint8Array {
  base64 = base64.replace(/[\n\r]/g, '')
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let j = 0; j < chars.length; j++) {
    lookup[chars.charCodeAt(j)] = j
  }
  const len = base64.length
  let validLen = len
  while (validLen > 0 && base64[validLen - 1] === '=') validLen--
  const outputLen = (validLen * 3) / 4
  const bytes = new Uint8Array(outputLen)
  for (let j = 0, k = 0; j < validLen; j += 4) {
    const a = lookup[base64.charCodeAt(j)]
    const b = lookup[base64.charCodeAt(j + 1)]
    const c = lookup[base64.charCodeAt(j + 2)]
    const d = lookup[base64.charCodeAt(j + 3)]
    bytes[k++] = (a << 2) | (b >> 4)
    if (k < outputLen) bytes[k++] = ((b & 15) << 4) | (c >> 2)
    if (k < outputLen) bytes[k++] = ((c & 3) << 6) | d
  }
  return bytes
}

/** 编码为 base64（兼容 SW 环境，用于上传 GitHub） */
function encodeGitHubContent(str: string): string {
  try {
    if (typeof btoa === 'function') return btoa(str)
  } catch { /* fallback */ }
  const bytes = new TextEncoder().encode(str)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i]
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0
    result += chars[a >> 2]
    result += chars[((a & 3) << 4) | (b >> 4)]
    result += i + 1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : '='
    result += i + 2 < bytes.length ? chars[c & 63] : '='
  }
  return result
}

export class SyncEngine {
  private config: AppConfig

  constructor(config: AppConfig) {
    this.config = config
  }

  private get headers(): Record<string, string> {
    return {
      Authorization: `token ${this.config.githubToken}`,
      Accept: 'application/vnd.github.v3+json',
    }
  }

  private get repoUrl(): string {
    return `https://api.github.com/repos/${this.config.repoOwner}/${this.config.repoName}`
  }

  /** 获取远程文件的 sha（PUT 时需要） */
  private async getRemoteSha(steps: string[]): Promise<string | undefined> {
    steps.push(`GET .../contents/${BOOKMARK_PATH} (获取 sha)`)
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      headers: this.headers,
    })
    if (res.status === 404) {
      steps.push('远程文件不存在，将新建')
      return undefined
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    const data = await res.json()
    return data.sha as string
  }

  /**
   * 推送：本地 → GitHub，强制覆盖
   * 先获取远程 sha，再用本地内容完整替换
   */
  async pushOnly(localBookmarks: Bookmark[], steps: string[]): Promise<void> {
    const sha = await this.getRemoteSha(steps)
    const content = encodeGitHubContent(JSON.stringify(localBookmarks, null, 2))

    const body: Record<string, string> = {
      message: `sync bookmarks: ${localBookmarks.length} items`,
      content,
    }
    if (sha) body.sha = sha

    steps.push(`PUT ${localBookmarks.length} 条书签到 GitHub`)
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      method: 'PUT',
      headers: { ...this.headers, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub push error: ${res.status} — ${err}`)
    }
    steps.push('PUT 成功')
  }

  /**
   * 拉取：GitHub → 本地，返回远程书签数组
   */
  async pullOnly(steps: string[]): Promise<Bookmark[]> {
    steps.push(`GET .../contents/${BOOKMARK_PATH}`)
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      headers: this.headers,
    })

    if (res.status === 404) {
      steps.push('远程文件不存在 (404)')
      return []
    }
    if (!res.ok) throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)

    const data = await res.json()
    const content = decodeGitHubContent(data.content)
    const bookmarks = JSON.parse(content) as Bookmark[]
    steps.push(`远程: ${bookmarks.length} 条书签`)
    return bookmarks
  }

  /**
   * 对比远程和本地书签，生成差异列表
   * 以 url 为匹配键（跨浏览器/机器稳定）
   */
  static computeDiff(remote: Bookmark[], local: Bookmark[]): BookmarkDiff[] {
    const diffs: BookmarkDiff[] = []
    const matchedLocal = new Set<string>() // 跟踪已匹配的本地书签 id

    for (const r of remote) {
      // 按 URL 匹配本地书签（处理可能的重复 URL：同 URL 只匹配第一个未匹配的）
      const match = local.find((l) => l.url === r.url && !matchedLocal.has(l.id))

      if (!match) {
        diffs.push({ type: 'added', remote: r })
      } else {
        matchedLocal.add(match.id)
        const changes: BookmarkDiff['changes'] = []
        if (r.title !== match.title) changes.push({ field: 'title', from: match.title, to: r.title })
        if (r.folder !== match.folder) changes.push({ field: 'folder', from: match.folder, to: r.folder })
        if (changes.length > 0) {
          diffs.push({ type: 'modified', remote: r, local: match, changes })
        }
      }
    }

    // 本地有、远程无 → deleted
    for (const l of local) {
      if (!matchedLocal.has(l.id)) {
        diffs.push({ type: 'deleted', remote: l, local: l })
      }
    }

    return diffs
  }
}
