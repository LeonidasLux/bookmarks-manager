export interface Bookmark {
  id: string
  title: string
  url: string
  folder: string
  tags: string[]
  createdAt: string
  updatedAt: string
}

export interface AppConfig {
  githubToken: string
  repoOwner: string
  repoName: string
  syncIntervalHours: number
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
  repoOwner: '',
  repoName: '',
  syncIntervalHours: 6,
}
