import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// Production build lives at /admin on the API server (see backend/server.js); dev server stays at /.
export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/admin/' : '/',
  build: { outDir: '../backend/admin-dist', emptyOutDir: true },
}))
