import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api/identity': {
        target: 'http://localhost:3099',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/identity/, ''),
      },
      '/api/authorization': {
        target: 'http://localhost:3098',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/authorization/, ''),
      },
      '/api/navigation': {
        target: 'http://localhost:3097',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/navigation/, ''),
      },
      '/api/messaging': {
        target: 'http://localhost:3096',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/messaging/, ''),
      },
      '/api/pii-vault': {
        target: 'http://localhost:3095',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/pii-vault/, ''),
      },
      '/api/audit': {
        target: 'http://localhost:3094',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/audit/, ''),
      },
      '/api/customer': {
        target: 'http://localhost:3093',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/customer/, ''),
      },
    },
  },
});
