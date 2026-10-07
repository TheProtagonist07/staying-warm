import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  server: {
    host: true,
    port: parseInt(process.env['PORT'] ?? '5173'),
    strictPort: true,
  },
});
