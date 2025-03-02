import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    open: true
  },
  resolve: {
    alias: {
      'three': resolve('./node_modules/three')
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
}); 