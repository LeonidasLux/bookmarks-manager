import { useState, useEffect } from 'react'

/**
 * 批量获取书签 URL 的访问次数
 * 从 chrome.history 中查询，入参 urls 变化时重新获取
 */
export function useBookmarkVisitCounts(urls: string[]): Record<string, number> {
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    if (urls.length === 0) {
      setVisitCounts({})
      return
    }

    let cancelled = false

    ;(async () => {
      try {
        const historyItems = await chrome.history.search({ text: '', maxResults: 10000, startTime: 0 })
        if (cancelled) return

        const map: Record<string, number> = {}
        for (const item of historyItems) {
          if (item.url && item.visitCount != null) {
            map[item.url] = item.visitCount
          }
        }
        // 未在 history 中的 URL 访问次数为 0
        for (const url of urls) {
          if (!(url in map)) {
            map[url] = 0
          }
        }
        setVisitCounts(map)
      } catch {
        // chrome.history 不可用时静默跳过
      }
    })()

    return () => { cancelled = true }
  }, [urls.join(',')])

  return visitCounts
}
