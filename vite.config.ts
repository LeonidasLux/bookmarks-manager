import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { crx } from '@crxjs/vite-plugin'

export default defineConfig({
  plugins: [
    react(),
    crx({
      manifest: {
        manifest_version: 3,
        name: 'Bookmarks Manager',
        version: '0.1.1',
        description: 'Browser bookmark manager with GitHub sync',
        permissions: ['storage', 'bookmarks'],
        host_permissions: ['https://api.github.com/*'],
        action: {
          default_popup: 'src/extension/popup/index.html',
          default_title: 'Bookmarks Manager',
          default_icon: {
            '16': 'icon16.png',
            '32': 'icon32.png',
            '48': 'icon48.png',
            '128': 'icon128.png',
          },
        },
        options_ui: {
          page: 'src/extension/options/index.html',
          open_in_tab: true,
        },
        background: {
          service_worker: 'src/extension/background/service-worker.ts',
          type: 'module',
        },
        icons: {
          '16': 'icon16.png',
          '32': 'icon32.png',
          '48': 'icon48.png',
          '128': 'icon128.png',
        },
      },
    }),
  ],
})
