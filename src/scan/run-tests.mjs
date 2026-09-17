#!/usr/bin/env node
/**
 * Компиляция scan+domain через tsc (без python) и node:test.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scanDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scanDir, '../..');
const tscJs = path.join(root, 'node_modules/typescript/lib/tsc.js');
const outTests = path.join(root, '.tmp/scan-tests/scan/tests');

if (!existsSync(tscJs)) {
  console.error('typescript not found at', tscJs);
  process.exit(1);
}

const compile = spawnSync(process.execPath, [tscJs, '-p', path.join(scanDir, 'tsconfig.test.json')], {
  cwd: root,
  stdio: 'inherit',
});
if (compile.status !== 0) process.exit(compile.status ?? 1);

const test = spawnSync(process.execPath, ['--test', outTests], {
  cwd: root,
  stdio: 'inherit',
});
process.exit(test.status ?? 1);
