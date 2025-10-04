import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
<<<<<<< HEAD
    host: '0.0.0.0',
    port: 5000,
    strictPort: false,
    allowedHosts: [
      '.replit.dev',
      '.repl.co',
      'localhost',
    ],
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:8000',
=======
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
>>>>>>> refs/remotes/origin/master
        changeOrigin: true,
        secure: false,
      },
    },
  },
})