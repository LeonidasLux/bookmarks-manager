import type { Bookmark, AppConfig, SyncResult } from './types'

const BOOKMARK_PATH = 'bookmarks.json'

/** 解码 GitHub API 返回的 base64 内容（兼容 SW 环境） */
function decodeGitHubContent(encoded: string): string {
  // 注意：不能使用 atob()，它返回 Latin-1 字符串，会破坏 UTF-8 编码的中文等多字节字符
  // 必须走字节 → TextDecoder 路径，保证非 ASCII 字符正确解码
  const bytes = base64ToBytesFallback(encoded)
  return new TextDecoder().decode(bytes)
}

function base64ToBytesFallback(base64: string): Uint8Array {
  // GitHub Content API 返回的 base64 每 60 字符插入 \n，需先去除
  base64 = base64.replace(/[\n\r]/g, '')

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const lookup = new Uint8Array(256)
  for (let j = 0; j < chars.length; j++) {
    lookup[chars.charCodeAt(j)] = j
  }

  const len = base64.length
  // 计算有效长度（去除末尾 = 填充）
  let validLen = len
  while (validLen > 0 && base64[validLen - 1] === '=') {
    validLen--
  }
  const outputLen = (validLen * 3) / 4
  const bytes = new Uint8Array(outputLen)

  for (let j = 0, k = 0; j < validLen; j += 4) {
    const a = lookup[base64.charCodeAt(j)]
    const b = lookup[base64.charCodeAt(j + 1)]
    const c = lookup[base64.charCodeAt(j + 2)]
    const d = lookup[base64.charCodeAt(j + 3)]

    bytes[k++] = (a << 2) | (b >> 4)
    if (k < outputLen) {
      bytes[k++] = ((b & 15) << 4) | (c >> 2)
    }
    if (k < outputLen) {
      bytes[k++] = ((c & 3) << 6) | d
    }
  }
  return bytes
}

/** 编码为 base64（兼容 SW 环境，用于上传 GitHub） */
function encodeGitHubContent(str: string): string {
  try {
    if (typeof btoa === 'function') {
      return btoa(str)
    }
  } catch {
    // btoa 不可用，使用回退方案
  }
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

interface PullResult {
  bookmarks: Bookmark[]
  sha: string | undefined
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

  /** 拉取远程书签，同时返回 sha（供后续 push 使用，避免额外 API 调用） */
  async pull(steps: string[]): Promise<PullResult> {
    steps.push(`GET .../contents/${BOOKMARK_PATH}`)
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      headers: this.headers,
    })

    if (res.status === 404) {
      steps.push('远程文件不存在 (404)')
      return { bookmarks: [], sha: undefined }
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const content = decodeGitHubContent(data.content)
    const bookmarks = JSON.parse(content) as Bookmark[]
    steps.push(`远程: ${bookmarks.length} 条书签`)
    return { bookmarks, sha: data.sha }
  }

  async push(bookmarks: Bookmark[], sha: string | undefined, steps: string[]): Promise<void> {
    steps.push(`PUT ${bookmarks.length} 条书签`)
    const content = encodeGitHubContent(JSON.stringify(bookmarks, null, 2))

    const body: Record<string, string> = {
      message: `sync bookmarks: ${bookmarks.length} items`,
      content,
    }

    if (sha) {
      body.sha = sha
    }

    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      method: 'PUT',
      headers: {
        ...this.headers,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`GitHub push error: ${res.status} — ${err}`)
    }
    steps.push('PUT 成功')
  }

  async sync(localBookmarks: Bookmark[], steps: string[]): Promise<{
    bookmarks: Bookmark[]
    result: SyncResult
  }> {
    try {
      const { bookmarks: remote, sha } = await this.pull(steps)
      steps.push(`合并: 远程${remote.length} + 本地${localBookmarks.length}`)
      const merged = this.merge(remote, localBookmarks)
      steps.push(`合并结果: ${merged.length} 条`)
      await this.push(merged, sha, steps)

      return {
        bookmarks: merged,
        result: {
          success: true,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (e) {
      steps.push(`❌ ${(e as Error).message}`)
      return {
        bookmarks: localBookmarks,
        result: {
          success: false,
          timestamp: new Date().toISOString(),
          error: (e as Error).message,
        },
      }
    }
  }

  private merge(remote: Bookmark[], local: Bookmark[]): Bookmark[] {
    const map = new Map<string, Bookmark>()

    for (const b of remote) {
      map.set(b.id, b)
    }

    for (const b of local) {
      const existing = map.get(b.id)
      if (!existing || new Date(b.updatedAt) > new Date(existing.updatedAt)) {
        map.set(b.id, b)
      }
    }

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
  }
}
