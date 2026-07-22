import '@testing-library/jest-dom'

// Mock chrome API globally for tests
const mockChrome = {
  runtime: {
    openOptionsPage: () => {},
    sendMessage: (_msg: unknown, cb?: (res: unknown) => void) => {
      if (cb) cb({})
    },
    onMessage: {
      addListener: () => {},
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
    query: (_info: unknown, cb: (tabs: chrome.tabs.Tab[]) => void) => {
      cb([])
    },
  },
  action: {
    setBadgeText: () => {},
    setBadgeBackgroundColor: () => {},
    setTitle: () => {},
  },
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(globalThis as any).chrome = mockChrome
