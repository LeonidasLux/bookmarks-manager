import { useState, useEffect, useCallback } from 'react'
import type { AppConfig } from '../../../shared/types'
import { DEFAULT_CONFIG } from '../../../shared/types'

export function useConfigForm() {
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    chrome.storage.local.get('config', (result) => {
      if (result.config) {
        setConfig({ ...DEFAULT_CONFIG, ...result.config })
      }
    })
  }, [])

  const save = useCallback(() => {
    chrome.runtime.sendMessage({ type: 'SAVE_CONFIG', config }, () => {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }, [config])

  const updateField = useCallback(<K extends keyof AppConfig>(key: K, value: AppConfig[K]) => {
    setConfig(prev => ({ ...prev, [key]: value }))
  }, [])

  return { config, saved, save, updateField }
}
