import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// API server chạy riêng bằng `npm run dev:server` (cổng 4000)
const API = 'http://localhost:4000'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  server: {
    proxy: { '/api': API, '/uploads': API }
  },
  preview: {
    proxy: { '/api': API, '/uploads': API }
  }
})
