import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
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
      { find: '@', replacement: path.resolve(rootDir, 'packages/web/src') },
      // `packages/core/src/scan/tests` uses node:test; run it under Vitest too.
      { find: 'node:test', replacement: 'vitest' },
    ],
    dedupe: ['react', 'react-dom'],
  },
  test: {
    environment: 'jsdom',
    include: [
      'packages/web/src/**/*.test.ts',
      'packages/web/src/**/*.test.tsx',
      'packages/core/src/**/*.test.ts',
      'packages/desktop/src/**/*.test.ts',
      'packages/backend/src/**/*.test.ts',
      'packages/cli/src/**/*.test.ts',
      'packages/mcp/src/**/*.test.ts',
    ],
    css: true,
    server: {
      deps: {
        inline: [/@mui\/x-data-grid/, /@mui\/x-data-grid-pro/, /@mui\/x-license/],
      },
    },
  },
});
