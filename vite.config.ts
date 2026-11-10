import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { encodeLicenseKey, licenseKeyDecoderSource } from './scripts/mui-key-cipher';

const rootDir = path.dirname(fileURLToPath(import.meta.url));
const webRoot = path.resolve(rootDir, 'packages/web');

/** Single source of truth for the version shown in the UI and saved in snapshots. */
const appVersion = (
  JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf8')) as { version: string }
).version;

const DEV_CONNECT_SRC = ' http://127.0.0.1:* http://localhost:* ws://127.0.0.1:* ws://localhost:*';

/**
 * Keeps the MUI X license key out of the readable bundle.
 *
 * The key comes from `VITE_MUI_LICENSE_KEY` (never from source). `transform`
 * swaps the env access for a random placeholder before Vite inlines it;
 * `generateBundle` runs after minification and replaces the placeholder with a
 * XOR-coded decoder. This defeats `grep`/`strings` on `app.asar`, not a
 * determined debugger: the key still exists in memory when MUI validates it.
 */
function muiKeyCodec(key: string): Plugin {
  const placeholder = `__LV24_MUI_KEY_${randomBytes(8).toString('hex')}__`;
  const decoder = licenseKeyDecoderSource(encodeLicenseKey(key, randomBytes(16)));
  const quoted = new RegExp(`(["'${String.fromCharCode(96)}])${placeholder}\\1`, 'g');

  return {
    name: 'lv24-mui-key-codec',
    apply: 'build',
    enforce: 'pre',
    transform(code) {
      if (!code.includes('import.meta.env.VITE_MUI_LICENSE_KEY')) return null;
      return {
        code: code.replaceAll('import.meta.env.VITE_MUI_LICENSE_KEY', JSON.stringify(placeholder)),
        map: null,
      };
    },
    generateBundle(_options, bundle) {
      let replaced = 0;
      for (const output of Object.values(bundle)) {
        if (output.type !== 'chunk' || !output.code.includes(placeholder)) continue;
        output.code = output.code.replace(quoted, decoder);
        replaced += 1;
      }
      if (replaced === 0) {
        this.warn('MUI license key is configured but was not found in the bundle');
      }
      for (const output of Object.values(bundle)) {
        if (output.type === 'chunk' && output.code.includes(placeholder)) {
          this.error('MUI license key placeholder survived the build; refusing to ship it');
        }
      }
    },
  };
}

/** envDir = repo root — reads .env.local → VITE_MUI_LICENSE_KEY (lv24 org key). */
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, rootDir, '');
  const muiKey = String(env.VITE_MUI_LICENSE_KEY ?? '').trim();

  return {
    root: webRoot,
    base: './',
    envDir: rootDir,
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    plugins: [
      ...(muiKey ? [muiKeyCodec(muiKey)] : []),
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
      minify: 'esbuild',
      sourcemap: false,
    },
    esbuild: {
      drop: ['debugger'],
    },
    server: {
      port: 5173,
      strictPort: true,
    },
  };
});
