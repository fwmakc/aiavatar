import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    ssr: 'src/main.ts',
    rollupOptions: {
      external: ['better-sqlite3'],
      output: {
        format: 'es',
        entryFileNames: 'main.js',
      },
    },
    minify: false,
  },
});
