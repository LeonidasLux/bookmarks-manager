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
  /** 应用差异后是否清理空文件夹 */
  cleanEmptyFolders: boolean
  /** 主题：'dark' | 'light' | 'system'（跟随系统） */
  theme: 'dark' | 'light' | 'system'
}

export interface SyncResult {
  success: boolean
  timestamp: string
  error?: string
  /** 调试信息：每步执行详情 */
  steps?: string[]
}

/** 单条书签差异 */
export interface BookmarkDiff {
  type: 'added' | 'deleted' | 'modified'
  remote: Bookmark
  /** deleted/modified 时有值，added 时无 */
  local?: Bookmark
  /** modified 时展示具体变化字段 */
  changes?: Array<{
    field: 'title' | 'url' | 'folder' | 'tags'
    from: string
    to: string
  }>
}

/** 拉取差异结果 */
export interface PullDiffResult {
  success: boolean
  timestamp: string
  diffs: BookmarkDiff[]
  /** 应用所有差异后可能变空的文件夹路径列表 */
  emptyFolders?: string[]
  error?: string
  /** 调试信息：每步执行详情 */
  steps?: string[]
}

export const DEFAULT_CONFIG: AppConfig = {
  githubToken: '',
  repoOwner: '',
  repoName: '',
  syncIntervalHours: 6,
  autoSyncOnLoad: false,
  cleanEmptyFolders: true,
  theme: 'system',
}
