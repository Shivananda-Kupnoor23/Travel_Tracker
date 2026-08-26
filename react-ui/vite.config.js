import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/travel': 'http://localhost:4004',
      '/api': 'http://localhost:5000',
      '/login': 'http://localhost:4004',
      '/index.html': 'http://localhost:4004'
    }
  },
  base: './',
  build: {
    outDir: 'dist',
    emptyOutDir: true
  }
})
