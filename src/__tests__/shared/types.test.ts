import { describe, it, expect } from 'vitest'
import { DEFAULT_CONFIG } from '../../shared/types'

describe('DEFAULT_CONFIG', () => {
  it('应该有正确的默认值', () => {
    expect(DEFAULT_CONFIG.githubToken).toBe('')
    expect(DEFAULT_CONFIG.repoOwner).toBe('')
    expect(DEFAULT_CONFIG.repoName).toBe('my-bookmarks')
    expect(DEFAULT_CONFIG.cleanEmptyFolders).toBe(true)
  })
})
