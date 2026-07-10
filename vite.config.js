import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    host: true,
    port: 3000
  },
  build: {
    assetsInlineLimit: 0 // Keep assets loaded as external files so Phaser can preload them properly
  }
})
