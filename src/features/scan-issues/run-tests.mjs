#!/usr/bin/env node
/**
 * Run Vitest for scan-issues without adding vitest to the app package.json.
 * Installs vitest into .tmp/vitest-scan-issues on first run.
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const featureDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(featureDir, '../../..');
const vitestHome = path.join(root, '.tmp/vitest-scan-issues');

function ensureVitest() {
  const vitestBin = path.join(vitestHome, 'node_modules/vitest/vitest.mjs');
  if (existsSync(vitestBin)) return vitestBin;
  mkdirSync(vitestHome, { recursive: true });
  writeFileSync(
    path.join(vitestHome, 'package.json'),
    JSON.stringify({ name: 'vitest-scan-issues-runner', private: true }, null, 2)
  );
  const install = spawnSync(
    'npm',
    ['install', '--no-save', 'vitest@3.2.4', 'vite@6.3.5'],
    { cwd: vitestHome, stdio: 'inherit' }
  );
  if (install.status !== 0) process.exit(install.status ?? 1);
  if (!existsSync(vitestBin)) {
    console.error('vitest install failed');
    process.exit(1);
  }
  return vitestBin;
}

const vitestBin = ensureVitest();
const run = spawnSync(
  process.execPath,
  [vitestBin, 'run', '--config', path.join(featureDir, 'vitest.config.ts')],
  { cwd: root, stdio: 'inherit', env: { ...process.env, NODE_PATH: path.join(vitestHome, 'node_modules') } }
);
process.exit(run.status ?? 1);
