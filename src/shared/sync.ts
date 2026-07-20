import type { Bookmark, AppConfig, SyncResult } from './types'

const BOOKMARK_PATH = 'bookmarks.json'

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

  async pull(): Promise<Bookmark[]> {
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      headers: this.headers,
    })

    if (res.status === 404) {
      return []
    }

    if (!res.ok) {
      throw new Error(`GitHub API error: ${res.status} ${res.statusText}`)
    }

    const data = await res.json()
    const content = atob(data.content)
    return JSON.parse(content)
  }

  async push(bookmarks: Bookmark[], sha?: string): Promise<void> {
    const content = btoa(JSON.stringify(bookmarks, null, 2))

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
  }

  async getSha(): Promise<string | undefined> {
    const res = await fetch(`${this.repoUrl}/contents/${BOOKMARK_PATH}`, {
      headers: this.headers,
    })

    if (!res.ok) return undefined

    const data = await res.json()
    return data.sha as string
  }

  async sync(localBookmarks: Bookmark[]): Promise<{
    bookmarks: Bookmark[]
    result: SyncResult
  }> {
    try {
      const remote = await this.pull()
      const merged = this.merge(remote, localBookmarks)
      const sha = await this.getSha()
      await this.push(merged, sha)

      return {
        bookmarks: merged,
        result: {
          success: true,
          timestamp: new Date().toISOString(),
        },
      }
    } catch (e) {
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
