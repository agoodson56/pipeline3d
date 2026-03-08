import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Target modern browsers only (no legacy polyfills)
    target: 'es2020',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // React core — rarely changes, cached long-term
          'vendor-react': ['react', 'react-dom'],
        },
      },
    },
    // Enable CSS code splitting (loads per-chunk CSS)
    cssCodeSplit: true,
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8788',
        changeOrigin: true,
      },
    },
  },
})
