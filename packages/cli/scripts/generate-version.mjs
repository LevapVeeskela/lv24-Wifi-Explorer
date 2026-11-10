#!/usr/bin/env node
/**
 * Generates `src/generated/version.ts` from `packages/cli/package.json`.
 *
 * `tsc` has no bundler-style define, so the build injects the manifest version
 * as a generated source constant. The file is checked in (so tests and editors
 * work on a fresh checkout) and a test fails if it drifts from package.json.
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const packageDir = dirname(dirname(fileURLToPath(import.meta.url)));
const manifestPath = join(packageDir, 'package.json');
const targetPath = join(packageDir, 'src', 'generated', 'version.ts');

/** @type {{ version?: unknown }} */
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
const version = manifest.version;

if (typeof version !== 'string' || version.trim() === '') {
  throw new Error(`${manifestPath}: expected a non-empty "version" string`);
}

const contents = [
  '// Generated from packages/cli/package.json by scripts/generate-version.mjs.',
  '// Do not edit by hand: run `yarn workspace @lv24/wifi-cli build`.',
  `export const CLI_VERSION = '${version}';`,
  '',
].join('\n');

mkdirSync(dirname(targetPath), { recursive: true });
writeFileSync(targetPath, contents, 'utf8');
process.stdout.write(`CLI version: ${version}\n`);
