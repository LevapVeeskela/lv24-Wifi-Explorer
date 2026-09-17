import { defineConfig, mergeConfig } from 'vitest/config';
import viteConfig from './vite.config';

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'electron/**/*.test.ts'],
      // node:test suite — compiled and run by `yarn test:scan`, not Vitest.
      exclude: ['src/scan/tests/**'],
      alias: {
        'node:test': 'vitest',
      },
      css: true,
      server: {
        deps: {
          inline: [/@mui\/x-data-grid/, /@mui\/x-data-grid-pro/, /@mui\/x-license/],
        },
      },
    },
  })
);
