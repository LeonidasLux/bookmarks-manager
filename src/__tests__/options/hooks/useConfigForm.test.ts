import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useConfigForm } from '../../../extension/options/hooks/useConfigForm'
import { DEFAULT_CONFIG } from '../../../shared/types'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useConfigForm', () => {
  it('应使用默认配置初始化', () => {
    const { result } = renderHook(() => useConfigForm())
    expect(result.current.config.githubToken).toBe(DEFAULT_CONFIG.githubToken)
    expect(result.current.config.syncIntervalHours).toBe(DEFAULT_CONFIG.syncIntervalHours)
  })

  it('updateField 应更新指定字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('githubToken', 'test-token')
    })

    expect(result.current.config.githubToken).toBe('test-token')
  })

  it('updateField 应更新 boolean 字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('autoSyncOnLoad', true)
    })

    expect(result.current.config.autoSyncOnLoad).toBe(true)
  })

  it('updateField 应更新数字字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('syncIntervalHours', 12)
    })

    expect(result.current.config.syncIntervalHours).toBe(12)
  })

  it('save 应在保存后设置 saved 状态', async () => {
    const { result } = renderHook(() => useConfigForm())

    await act(async () => {
      result.current.save()
    })

    expect(result.current.saved).toBe(true)
  })
})
