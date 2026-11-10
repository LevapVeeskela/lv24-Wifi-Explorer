#!/usr/bin/env node
/**
 * Fails if the commercial MUI X license key is present in plaintext in the
 * built renderer. Release builds receive the key from the
 * `MUI_X_LICENSE_KEY` secret; the Vite plugin in `vite.config.ts` replaces it
 * with a coded decoder, so this check proves the obfuscation ran. Public
 * keyless builds (`dist:mac:public`) must not contain the key at all.
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

const key = (process.env.VITE_MUI_LICENSE_KEY || readLocalKey()).trim();
if (!key) {
  console.log('[check-public-bundle] no MUI key configured — OK');
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
  console.error('[check-public-bundle] plaintext MUI key found in the public bundle:');
  for (const file of leaked) console.error(`  ${file}`);
  console.error('The MUI key codec in vite.config.ts did not run; rebuild before shipping.');
  process.exit(1);
}

console.log(`[check-public-bundle] OK: key absent from ${files.length} built files`);
