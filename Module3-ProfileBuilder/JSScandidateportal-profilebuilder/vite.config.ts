
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/module1': {
        target: 'http://127.0.0.1:8020',
        changeOrigin: true,
        rewrite: () => '/api/extract-jd',
      },
      '/api/module2': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/api/module5': {
        target: 'http://127.0.0.1:8030',
        changeOrigin: true,
        rewrite: () => '/api/v1/skill-match',
      },
    },
  },
});
