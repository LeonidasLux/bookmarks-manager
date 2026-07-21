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
        permissions: ['storage', 'alarms', 'bookmarks', 'notifications'],
        host_permissions: ['https://api.github.com/*'],
        action: {
          default_popup: 'src/extension/popup/index.html',
          default_title: 'Bookmarks Manager',
        },
        options_ui: {
          page: 'src/extension/options/index.html',
          open_in_tab: true,
        },
        background: {
          service_worker: 'src/extension/background/service-worker.ts',
          type: 'module',
        },
      },
    }),
  ],
})
