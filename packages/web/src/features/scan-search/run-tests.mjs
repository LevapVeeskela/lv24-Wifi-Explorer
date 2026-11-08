#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const featureDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(featureDir, '../../..');
const vitestBin = path.join(root, 'node_modules/vitest/vitest.mjs');

if (!existsSync(vitestBin)) {
  console.error('vitest not found at', vitestBin);
  process.exit(1);
}

const run = spawnSync(
  process.execPath,
  [vitestBin, 'run', featureDir, '--config', path.join(root, 'vitest.config.ts')],
  { cwd: root, stdio: 'inherit' }
);
process.exit(run.status ?? 1);
