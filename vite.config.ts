import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(rootDir, 'packages/web');

/** Single source of truth for the version shown in the UI and saved in snapshots. */
const appVersion = (
  JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as { version: string }
).version;

const DEV_CONNECT_SRC = ' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*';

/** envDir = repo root — reads .env.local → VITE_MUI_LICENSE_KEY (lv24 org key). */
export default defineConfig(({ command }) => ({
  root: webRoot,
  base: './',
  envDir: rootDir,
  define: {
    __APP_VERSION__: JSON.stringify(appVersion),
  },
  plugins: [
    react(),
    {
      name: 'lv24-csp-connect-src',
      transformIndexHtml(html) {
        const dev = command === 'serve';
        return html
          .replace('__LV24_CSP_CONNECT__', dev ? DEV_CONNECT_SRC : '')
          .replace('__LV24_CSP_SCRIPT__', dev ? " 'unsafe-inline'" : '')
          .replace('__LV24_CSP_WORKER__', dev ? " worker-src 'self' blob:;" : '');
      },
    },
  ],
  resolve: {
    alias: [
      {
        find: /^@\/domain$/,
        replacement: path.resolve(rootDir, 'packages/core/src/domain/index.ts'),
      },
      {
        find: /^@\/domain\/(.*)$/,
        replacement: `${path.resolve(rootDir, 'packages/core/src/domain')}/$1`,
      },
      {
        find: /^@\/scan$/,
        replacement: path.resolve(rootDir, 'packages/core/src/scan/index.ts'),
      },
      {
        find: /^@\/scan\/(.*)$/,
        replacement: `${path.resolve(rootDir, 'packages/core/src/scan')}/$1`,
      },
      { find: '@resources', replacement: path.resolve(rootDir, 'resources') },
      {
        find: '@pcap',
        replacement: path.resolve(rootDir, 'packages/core/src/import/pcap/index.ts'),
      },
      { find: '@', replacement: path.resolve(webRoot, 'src') },
    ],
    dedupe: ['react', 'react-dom'],
  },
  build: {
    outDir: path.resolve(rootDir, 'dist'),
    emptyOutDir: true,
    target: 'es2022',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
}));
