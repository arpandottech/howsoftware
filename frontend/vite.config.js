import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'HOW',
        short_name: 'HOW',
        description: 'HOW - House Of Wedding',
        theme_color: '#ffffff',
        icons: [
          {
            src: '/logo-new.jpg',
            sizes: '192x192',
            type: 'image/jpeg'
          },
          {
            src: '/logo-new.jpg',
            sizes: '512x512',
            type: 'image/jpeg'
          }
        ]
      }
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
