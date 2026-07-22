import { describe, it, expect, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCommands } from '../../../extension/options/hooks/useCommands'

describe('useCommands', () => {
  it('应加载注册的快捷键列表', async () => {
    const { result } = renderHook(() => useCommands())

    await waitFor(() => {
      expect(result.current.commands.length).toBeGreaterThan(0)
    })

    // _execute_action 应被过滤掉
    const executeAction = result.current.commands.find(c => c.name === '_execute_action')
    expect(executeAction).toBeUndefined()

    // save-bookmark 应正常显示
    const saveCmd = result.current.commands.find(c => c.name === 'save-bookmark')
    expect(saveCmd).toBeDefined()
    expect(saveCmd?.description).toBe('保存当前页面到书签')
    expect(saveCmd?.shortcut).toBe('Alt+B')
  })

  it('commands.getAll 被调用时快捷键列表应为空', async () => {
    vi.spyOn(chrome.commands, 'getAll').mockImplementation(
      (cb?: (cmds: chrome.commands.Command[]) => void) => {
        if (cb) cb([])
        return Promise.resolve([])
      }
    )

    const { result } = renderHook(() => useCommands())

    await waitFor(() => {
      expect(result.current.commands).toHaveLength(0)
    })
  })
})
