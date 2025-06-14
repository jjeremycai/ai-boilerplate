import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@boilerplate/ui': path.resolve(__dirname, '../../packages/ui'),
      '@boilerplate/types': path.resolve(__dirname, '../../packages/types'),
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', '@clerk/clerk-react'],
    exclude: ['@boilerplate/ui', '@boilerplate/types'],
  },
  server: {
    port: 5173,
    host: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
      external: [],
    },
    target: 'es2015',
    minify: 'esbuild',
    chunkSizeWarningLimit: 2000,
    cssCodeSplit: true,
    assetsInlineLimit: 4096,
  },
})