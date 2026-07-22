export interface Bookmark {
  id: string
  title: string
  url: string
  folder: string
  tags: string[]
  createdAt: string
  updatedAt: string
  /** 书签来源：浏览器原生 or 扩展手动添加 */
  source?: 'browser' | 'extension'
}

export interface AppConfig {
  githubToken: string
  repoOwner: string
  repoName: string
  syncIntervalHours: number
  /** 扩展加载时是否自动同步书签到 GitHub */
  autoSyncOnLoad: boolean
}

export interface SyncResult {
  success: boolean
  timestamp: string
  error?: string
  /** 调试信息：每步执行详情 */
  steps?: string[]
}

export const DEFAULT_CONFIG: AppConfig = {
  githubToken: '',
  repoOwner: 'LeonidasLux',
  repoName: 'bookmarks-manager',
  syncIntervalHours: 6,
  autoSyncOnLoad: false,
}
