import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useSync } from '../../../extension/popup/hooks/useSync'

describe('useSync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getCurrentTabInfo', () => {
    it('应正确获取当前标签页的 URL 和标题', async () => {
      const { result } = renderHook(() => useSync())

      const info = await act(async () => {
        return await result.current.getCurrentTabInfo()
      })

      expect(info).not.toBeNull()
      expect(info!.url).toBe('https://example.com')
      expect(info!.title).toBe('Test')
    })

    it('tabs.query 无结果时应返回 null', async () => {
      vi.spyOn(chrome.tabs, 'query').mockResolvedValue([])

      const { result } = renderHook(() => useSync())

      const info = await act(async () => {
        return await result.current.getCurrentTabInfo()
      })

      expect(info).toBeNull()
    })

    it('tabs.query 返回 tab 但无 url 时应返回 null', async () => {
      vi.spyOn(chrome.tabs, 'query').mockResolvedValue([
        { id: 1, url: undefined } as unknown as chrome.tabs.Tab,
      ])

      const { result } = renderHook(() => useSync())

      const info = await act(async () => {
        return await result.current.getCurrentTabInfo()
      })

      expect(info).toBeNull()
    })
  })

  describe('handleSaveCurrent', () => {
    it('应调用 chrome.bookmarks.create 并刷新文件夹', async () => {
      const createSpy = vi.spyOn(chrome.bookmarks, 'create')
      createSpy.mockImplementation(() => Promise.resolve({ id: 'new-id', title: '测试标题' } as chrome.bookmarks.BookmarkTreeNode))

      const loadFolder = vi.fn().mockResolvedValue(undefined)
      const setSyncStatus = vi.fn()

      const { result } = renderHook(() => useSync())

      const success = await act(async () => {
        return await result.current.handleSaveCurrent(
          '11',
          '测试标题',
          'https://example.com',
          '1',
          loadFolder,
          setSyncStatus,
        )
      })

      expect(success).toBe(true)
      expect(createSpy).toHaveBeenCalledWith({
        parentId: '11',
        title: '测试标题',
        url: 'https://example.com',
      })
      expect(loadFolder).toHaveBeenCalledWith('1')
      expect(setSyncStatus).toHaveBeenCalled()
    })

    it('bookmarks.create 失败时应返回 false 并调用 setSyncStatus', async () => {
      vi.spyOn(chrome.bookmarks, 'create')
        .mockImplementation(() => Promise.reject(new Error('创建失败')))

      const { result } = renderHook(() => useSync())
      const setSyncStatus = vi.fn()

      const success = await act(async () => {
        return await result.current.handleSaveCurrent(
          '11', '标题', 'https://example.com', '1', vi.fn(), setSyncStatus,
        )
      })

      expect(success).toBe(false)
      expect(setSyncStatus).toHaveBeenCalledWith(
        expect.stringContaining('❌'),
      )
    })
  })
})
