#!/usr/bin/env node
/**
 * Fails if a commercial MUI X license key leaked into the built renderer.
 *
 * The key lives only in `.env.local` (gitignored) and is inlined into `dist/`
 * by Vite for private builds. Public artifacts must be built with an empty
 * `VITE_MUI_LICENSE_KEY`; this check makes the difference enforceable.
 *
 * Usage: node scripts/check-public-bundle.mjs [--dist dist]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const DIST = process.argv.includes('--dist')
  ? process.argv[process.argv.indexOf('--dist') + 1]
  : 'dist';
const ENV_FILE = '.env.local';
const KEY_NAME = 'VITE_MUI_LICENSE_KEY';
const TEXT_FILE = /\.(js|mjs|css|html|json|map)$/;

function readLocalKey() {
  try {
    const line = readFileSync(ENV_FILE, 'utf8')
      .split('\n')
      .find((entry) => entry.startsWith(`${KEY_NAME}=`));
    if (!line) return '';
    return line
      .slice(KEY_NAME.length + 1)
      .trim()
      .replace(/^['"]|['"]$/g, '');
  } catch {
    return '';
  }
}

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (TEXT_FILE.test(entry)) out.push(full);
  }
  return out;
}

const key = readLocalKey();
if (!key) {
  console.log('[check-public-bundle] no local MUI key configured — OK');
  process.exit(0);
}

let files;
try {
  files = walk(DIST);
} catch {
  console.error(`[check-public-bundle] ${DIST} not found; build first`);
  process.exit(1);
}

const leaked = files.filter((file) => readFileSync(file, 'utf8').includes(key));
if (leaked.length > 0) {
  console.error('[check-public-bundle] commercial MUI key found in the public bundle:');
  for (const file of leaked) console.error(`  ${file}`);
  console.error('Rebuild with VITE_MUI_LICENSE_KEY= (see dist:mac:public).');
  process.exit(1);
}

console.log(`[check-public-bundle] OK: key absent from ${files.length} built files`);
