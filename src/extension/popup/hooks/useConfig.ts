import { useState, useCallback, useEffect } from 'react'
import type { AppConfig, SyncResult } from '../../../shared/types'

/**
 * 加载扩展配置和上次同步状态
 */
export function useConfig() {
  const [config, setConfig] = useState<AppConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [syncStatus, setSyncStatus] = useState<string | null>(null)

  const initConfig = useCallback(async () => {
    // 加载配置
    chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
      if (response?.config) setConfig(response.config)
      else setConfig(null)
    })

    // 加载上次同步状态
    chrome.storage.local.get(['lastSync', 'syncLog'], (result) => {
      const log = result.syncLog as SyncResult | undefined
      if (log) {
        if (log.success && log.timestamp) {
          setSyncStatus(`✅ 同步成功 — ${new Date(log.timestamp).toLocaleString('zh-CN')}`)
        } else if (log.error) {
          setSyncStatus(`❌ ${log.error}`)
        }
      } else if (result.lastSync) {
        setSyncStatus(`上次同步: ${new Date(result.lastSync as string).toLocaleString('zh-CN')}`)
      }
    })

    setLoading(false)
  }, [])

  useEffect(() => { initConfig() }, [initConfig])

  const isConfigured = !!(config?.githubToken && config?.repoOwner && config?.repoName)

  return { config, loading, syncStatus, setSyncStatus, isConfigured }
}
