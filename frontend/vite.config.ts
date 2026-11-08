import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // The React hook below owns registration and exposes update state.
      injectRegister: null,
      // Let the app show a visible update action instead of reloading in the
      // middle of a sale or while an offline operation is being edited.
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        skipWaiting: false,
        clientsClaim: false,
      },
      // Manifest is dynamically served by the backend, so we disable static manifest generation
      manifest: false,
    })
  ],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        // rewrite: (path) => path.replace(/^\/api/, ''), // Removed this because backend expects /api
      },
      // Product photos, logos, delivery proofs — served by Nest ServeStatic at /uploads
      '/uploads': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});
