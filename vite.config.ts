import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const music = ['calm-day', 'night', 'focus', 'celebration']
  .filter((track) => existsSync(new URL(`./public/audio/${track}.mp3`, import.meta.url)))

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        game: fileURLToPath(new URL('./index.html', import.meta.url)),
        privacy: fileURLToPath(new URL('./privacy.html', import.meta.url)),
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      manifest: false,
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest,woff,woff2,mp3}'],
        maximumFileSizeToCacheInBytes: 8 * 1024 * 1024,
      },
    }),
  ],
  define: { __MUSIC_TRACKS__: JSON.stringify(music) },
  optimizeDeps: { include: ['zustand', 'zustand/middleware', 'recharts', 'idb-keyval'] },
})
