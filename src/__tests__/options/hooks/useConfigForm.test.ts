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
  })

  it('updateField 应更新指定字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('githubToken', 'test-token')
    })

    expect(result.current.config.githubToken).toBe('test-token')
  })

  it('updateField 应更新 string 字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('repoOwner', 'test-owner')
    })

    expect(result.current.config.repoOwner).toBe('test-owner')
  })

  it('updateField 应更新 boolean 字段', () => {
    const { result } = renderHook(() => useConfigForm())

    act(() => {
      result.current.updateField('cleanEmptyFolders', false)
    })

    expect(result.current.config.cleanEmptyFolders).toBe(false)
  })

it('save 应在保存后设置 saved 状态', async () => {
    const { result } = renderHook(() => useConfigForm())

    await act(async () => {
      result.current.save()
    })

    expect(result.current.saved).toBe(true)
  })
})
