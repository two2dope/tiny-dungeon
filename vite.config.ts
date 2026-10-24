import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    watch: {
      ignored: ['**/node_modules/**', '**/.git/**', '**/assets/**'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@engine': path.resolve(__dirname, './src/engine'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
  },
});
