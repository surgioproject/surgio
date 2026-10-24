import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const backendProxy = {
  target: 'http://localhost:4000',
  changeOrigin: true,
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': backendProxy,
      '/get-artifact': backendProxy,
      '/export-providers': backendProxy,
      '/render': backendProxy,
    },
  },
  preview: {
    port: 3000,
  },
  build: {
    outDir: 'build',
  },
})
