import { defineConfig } from 'vitest/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const featureDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(featureDir, '../../..');

export default defineConfig({
  root: featureDir,
  resolve: {
    alias: {
      '@': path.join(projectRoot, 'src'),
    },
  },
  test: {
    include: ['**/*.test.ts'],
    environment: 'node',
  },
});
