import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  base: mode === 'github-pages' ? '/PreCardia/' : '/',
  define: {
    'import.meta.env.VITE_GITHUB_PAGES': JSON.stringify(mode === 'github-pages'),
  },
  plugins: [react()],
  build: {
    // Optimize chunk size warnings
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor code for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', '@headlessui/react'],
        }
      }
    }
  }
}))
