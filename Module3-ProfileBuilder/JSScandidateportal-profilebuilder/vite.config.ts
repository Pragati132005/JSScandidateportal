
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/module1': {
        target: 'http://127.0.0.1:8020',
        changeOrigin: true,
        rewrite: (path) => {
          if (path === '/api/module1/health' || path === '/api/module1/health/') {
            return '/health';
          }
          if (path.includes('extract-jd-text')) {
            return '/api/extract-jd-text';
          }
          if (path === '/api/module1' || path === '/api/module1/' || path.includes('extract-jd')) {
            return '/api/extract-jd';
          }
          return path.replace(/^\/api\/module1/, '') || '/health';
        },
      },
      '/api/module2': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        rewrite: (path) =>
          path === '/api/module2' ? '/parse-resume' : path.replace(/^\/api\/module2/, ''),
      },
      '/api/module4': {
        target: 'http://127.0.0.1:8010',
        changeOrigin: true,
        rewrite: (path) =>
          path === '/api/module4' ? '/talent-check' : path.replace(/^\/api\/module4/, ''),
      },
      '/api/module5': {
        target: 'http://127.0.0.1:8030',
        changeOrigin: true,
        rewrite: (path) =>
          path === '/api/module5' ? '/api/v1/skill-match' : path.replace(/^\/api\/module5/, ''),
      },
      '/api/profiles': {
        target: 'http://127.0.0.1:8040',
        changeOrigin: true,
      },
      '/api/backend-health': {
        target: 'http://127.0.0.1:8040',
        changeOrigin: true,
        rewrite: () => '/health',
      },
    },
  },
});
