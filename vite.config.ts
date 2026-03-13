import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { execSync } from 'child_process';
import { readFileSync } from 'fs';

function getGitSha(): string {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); }
  catch { return 'unknown'; }
}

function getPkgVersion(): string {
  try { return JSON.parse(readFileSync('package.json', 'utf-8')).version; }
  catch { return '0.0.0'; }
}

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(getPkgVersion()),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString().slice(0, 10)),
    __GIT_SHA__: JSON.stringify(getGitSha()),
  },
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
      '/api/admin-console': {
        target: 'http://localhost:3020',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/admin-console/, ''),
      },
    },
  },
});
