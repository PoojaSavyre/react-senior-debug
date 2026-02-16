import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

/**
 * Vite configuration with bundle optimization.
 *
 * Competency: Bundle Optimization Strategies
 * Bug surface: incorrect code splitting, missing lazy loading, oversized vendor bundles,
 *              tree shaking failures, chunk size issues, manual chunks misconfiguration
 */
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://localhost:3001',
        ws: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        /**
         * Manual chunk splitting strategy.
         * Bug surface:
         *   - Moving too much into vendor chunks → oversized bundles
         *   - Not splitting enough → all code in one chunk
         *   - Splitting cache/api services away from components that use them → extra requests
         *   - Incorrect regex matching → wrong modules in wrong chunks
         */
        manualChunks(id) {
          // React core in its own chunk (large, rarely changes)
          if (id.includes('node_modules/react-dom') || id.includes('node_modules/react/')) {
            return 'vendor-react';
          }
          // Router in its own chunk
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // API client and cache services shared across pages
          if (id.includes('/src/api/') || id.includes('/src/services/cache/')) {
            return 'shared-services';
          }
        },
      },
    },
    chunkSizeWarningLimit: 500,
    sourcemap: true,
    minify: 'esbuild',
    // Tree shaking is enabled by default in production builds.
    // The `unusedHeavyFunction` in heavyUtils.js should be eliminated.
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
  },
});
