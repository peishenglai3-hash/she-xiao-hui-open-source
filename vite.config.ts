import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['expressions/*.png'],
      manifest: {
        name: '社小会 - 社会学学习陪伴 AI',
        short_name: '社小会',
        description: '一个独立、透明、可自托管的社会学学习陪伴 AI 示例',
        theme_color: '#2B5A8E',
        background_color: '#F3F4F6',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /\/expressions\/.*/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'expressions-cache',
              expiration: { maxEntries: 10 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
