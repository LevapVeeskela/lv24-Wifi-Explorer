#!/usr/bin/env node
/**
 * Preflight for `dist:mac`: fail loudly when the universal ScanCore helper is
 * missing before electron-builder silently ships an app without live scanning.
 *
 * Requirements:
 *  - native/ScanCore/.build/ScanCore.app/Contents/MacOS/ScanCore exists
 *  - `lipo -info` lists both arm64 and x86_64 (universal binary)
 */
import { execFileSync } from 'node:child_process';
import { existsSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const binary = join(root, 'native/ScanCore/.build/ScanCore.app/Contents/MacOS/ScanCore');
const REQUIRED_ARCHS = ['arm64', 'x86_64'];

function fail(message, hint) {
  console.error(`[check-scancore] FAIL: ${message}`);
  if (hint) console.error(`[check-scancore] hint: ${hint}`);
  process.exit(1);
}

if (process.platform !== 'darwin') {
  fail(
    'dist:mac requires macOS (ScanCore is a Swift/CoreWLAN helper).',
    'run dist:win / dist:linux on their own platforms.'
  );
}

if (!existsSync(binary)) {
  fail(
    `missing ${binary}`,
    'run `yarn build:scancore` (needs Xcode or Command Line Tools) before packaging.'
  );
}

const size = statSync(binary).size;
if (size === 0) {
  fail(`${binary} is empty`, 'rebuild with `yarn build:scancore`.');
}

let lipoInfo = '';
try {
  lipoInfo = execFileSync('lipo', ['-info', binary], { encoding: 'utf8' }).trim();
} catch (error) {
  fail(
    `cannot read architectures of ${binary}: ${error instanceof Error ? error.message : String(error)}`,
    'install Xcode Command Line Tools (`xcode-select --install`).'
  );
}

const missing = REQUIRED_ARCHS.filter((arch) => !lipoInfo.includes(arch));
if (missing.length > 0) {
  fail(
    `ScanCore is not universal (missing: ${missing.join(', ')}).\n  ${lipoInfo}`,
    'the swiftc fallback only builds the host arch: accept an Xcode license and rerun `yarn build:scancore`, or build on both archs and lipo them together.'
  );
}

console.log(`[check-scancore] OK: ${binary}`);
console.log(`[check-scancore] ${lipoInfo}`);
