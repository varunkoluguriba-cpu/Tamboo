import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// The customer website. Production build is served by the API server at / (see backend/server.js),
// so the site and /api share one origin. In dev, /api is proxied to a local backend on :4011.
// Strings come straight from the customer app (../customer-app/src/i18n.ts) so both stay in sync.
export default defineConfig({
  plugins: [react()],
  base: '/',
  server: { port: 5180, proxy: { '/api': 'http://localhost:4011' }, fs: { allow: ['..'] } },
  build: { outDir: '../backend/web-dist', emptyOutDir: true },
});
