import '@testing-library/jest-dom'

// Mock chrome API globally for tests
const mockChrome = {
  runtime: {
    openOptionsPage: () => {},
    sendMessage: (_msg: unknown, cb?: (res: unknown) => void) => {
      if (cb) cb({})
      return Promise.resolve()
    },
    onMessage: {
      addListener: () => {},
      removeListener: () => {},
    },
    onInstalled: {
      addListener: () => {},
    },
  },
  storage: {
    local: {
      get: (_keys: unknown, cb: (result: Record<string, unknown>) => void) => {
        cb({})
      },
      set: (_items: unknown, cb?: () => void) => {
        if (cb) cb()
        return Promise.resolve()
      },
      remove: (_keys: unknown, cb?: () => void) => {
        if (cb) cb()
        return Promise.resolve()
      },
    },
  },
  bookmarks: {
    getTree: () => Promise.resolve([]),
    getSubTree: () => Promise.resolve([]),
    getChildren: () => Promise.resolve([]),
    get: () => Promise.resolve([]),
    create: () => Promise.resolve({ id: 'test-id', title: 'test' }),
    remove: () => Promise.resolve(),
    update: () => Promise.resolve(),
    move: () => Promise.resolve(),
    search: () => Promise.resolve([]),
  },
  tabs: {
    create: () => {},
    query: (_info: unknown, cb?: (tabs: chrome.tabs.Tab[]) => void): Promise<chrome.tabs.Tab[]> => {
      const tabs: chrome.tabs.Tab[] = [{ id: 1, url: 'https://example.com', title: 'Test' } as chrome.tabs.Tab]
      if (cb) cb(tabs)
      return Promise.resolve(tabs)
    },
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
    setTitle: () => {},
    openPopup: () => Promise.resolve(),
  },
  commands: {
    getAll: (cb?: (cmds: chrome.commands.Command[]) => void) => {
      const cmds: chrome.commands.Command[] = [
        { name: '_execute_action', description: 'Open popup', shortcut: '' },
        { name: 'save-bookmark', description: '保存当前页面到书签', shortcut: 'Alt+B' },
      ]
      if (cb) cb(cmds)
      return Promise.resolve(cmds)
    },
    onCommand: {
      addListener: () => {},
      removeListener: () => {},
    },
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).chrome = mockChrome
