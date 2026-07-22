import { useState, useEffect } from 'react'

interface CommandInfo {
  name: string
  description?: string
  shortcut: string
}

/**
 * 读取扩展注册的快捷键及其当前绑定
 */
export function useCommands() {
  const [commands, setCommands] = useState<CommandInfo[]>([])

  useEffect(() => {
    chrome.commands.getAll((cmds) => {
      setCommands(
        cmds
          .filter(cmd => cmd.name !== '_execute_action')
          .map(cmd => ({
            name: cmd.name ?? '',
            description: cmd.description,
            shortcut: cmd.shortcut ?? '',
          }))
      )
    })
  }, [])

  return { commands }
}
