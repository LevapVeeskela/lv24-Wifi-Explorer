#!/usr/bin/env node
/**
 * FSD boundary check for packages/web/src.
 *
 * Rules:
 * 1. Layer order: shared < entities < features < widgets < pages < app.
 *    Imports may only point downward.
 * 2. Cross-slice imports must use the slice public API (its `index.ts`),
 *    never a deep path such as `@/features/scan-search/matchBss`.
 * 3. `@/shared/lib/**` is a public utility namespace and may be imported
 *    deeply; `@/shared/ui/<Component>`, `@/shared/i18n`, `@/shared/ipc` are
 *    slices and require their barrel.
 *
 * Usage: node scripts/check-boundaries.mjs [--json]
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = 'packages/web/src';
const LAYERS = ['shared', 'entities', 'features', 'widgets', 'pages', 'app'];
const CODE_FILE = /\.(ts|tsx)$/;
const SKIP_DIR = new Set(['node_modules', 'vendor']);
const PUBLIC_SHARED_SEGMENTS = new Set(['lib']);

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    if (SKIP_DIR.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, out);
    else if (CODE_FILE.test(entry) && !/\.(test|spec)\.(ts|tsx)$/.test(entry)) out.push(full);
  }
  return out;
}

/** Layer + slice identity for an import path split on `/`. */
function describe(parts) {
  const [layer, second, third] = parts;
  if (layer === 'shared' && second === 'ui') {
    return { layer, slice: `ui/${third ?? ''}`.replace(/\/$/, ''), depth: 3 };
  }
  return { layer, slice: second ?? '', depth: 2 };
}

function isDeepImport(parts) {
  const [layer, second] = parts;
  if (layer === 'shared' && PUBLIC_SHARED_SEGMENTS.has(second)) return false;
  const { depth } = describe(parts);
  return parts.length > depth;
}

const IMPORT_RE = /(?:from\s+|import\s*\(\s*|import\s+)['"]([^'"]+)['"]/g;
const violations = [];
const files = walk(ROOT);

for (const file of files) {
  const rel = relative(ROOT, file).split(sep).join('/');
  const ownParts = rel.split('/');
  const ownLayer = ownParts[0];
  if (!LAYERS.includes(ownLayer)) continue;
  const own = describe(ownParts);

  const source = readFileSync(file, 'utf8');
  for (const match of source.matchAll(IMPORT_RE)) {
    const spec = match[1];
    if (!spec.startsWith('@/')) continue;
    const parts = spec.slice(2).split('/');
    if (parts[0] === 'domain' || parts[0] === 'scan' || parts[0] === 'pcap') continue;
    if (!LAYERS.includes(parts[0])) continue;

    const target = describe(parts);
    const sameSlice = target.layer === ownLayer && target.slice === own.slice;
    const line = source.slice(0, match.index).split('\n').length;

    if (!sameSlice && LAYERS.indexOf(target.layer) > LAYERS.indexOf(ownLayer)) {
      violations.push({ file: `${ROOT}/${rel}`, line, spec, rule: 'layer-order' });
      continue;
    }
    if (!sameSlice && isDeepImport(parts)) {
      violations.push({ file: `${ROOT}/${rel}`, line, spec, rule: 'deep-import' });
    }
  }
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({ count: violations.length, violations }, null, 2));
} else if (violations.length) {
  console.error(`FSD boundaries: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error(`${v.file}:${v.line}  ${v.rule}  ${v.spec}`);
  console.error('\nFix: import from the slice barrel (index.ts) or invert the dependency.');
} else {
  console.log('FSD boundaries: OK');
}
process.exit(violations.length ? 1 : 0);
