#!/usr/bin/env node
/**
 * Cheap production-bundle smoke check (no Electron launch, no signing).
 * Prerequisite: `yarn build` produced dist/ and dist-electron/.
 *
 * Verifies:
 *  - dist/index.html exists and declares a restrictive CSP
 *  - dist-electron/main.js and dist-electron/preload.js exist and are non-empty
 *  - preload.js requires nothing but the `electron` builtin
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const problems = [];

function readArtifact(relativePath) {
  const path = join(root, relativePath);
  if (!existsSync(path)) {
    problems.push(`missing ${relativePath} (run \`yarn build\` first)`);
    return null;
  }
  if (statSync(path).size === 0) {
    problems.push(`empty ${relativePath} (run \`yarn build\` first)`);
    return null;
  }
  return readFileSync(path, 'utf8');
}

const html = readArtifact('dist/index.html');
if (html !== null) {
  if (html.includes('http://localhost') || html.includes('http://127.0.0.1')) {
    problems.push('dist/index.html points at a dev server URL');
  }
  const cspMeta =
    html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*content="([^"]+)"/i) ??
    html.match(/<meta[^>]+http-equiv=["']Content-Security-Policy["'][^>]*content='([^']+)'/i);
  if (!cspMeta) {
    problems.push('dist/index.html has no Content-Security-Policy meta tag');
  } else {
    const csp = cspMeta[1];
    if (!/default-src\s+'self'/.test(csp)) problems.push('CSP is missing "default-src \'self\'"');
    if (!/script-src\s+'self'/.test(csp)) problems.push('CSP is missing "script-src \'self\'"');
    if (/'unsafe-eval'/.test(csp)) problems.push("CSP allows 'unsafe-eval'");
    if (/script-src[^;]*'unsafe-inline'/.test(csp)) {
      problems.push("CSP allows 'unsafe-inline' scripts");
    }
    if (/connect-src[^;]*http/.test(csp) && !/connect-src[^;]*'self'/.test(csp)) {
      problems.push('CSP allows remote connect-src targets');
    }
  }
}

readArtifact('dist-electron/main.js');

const preload = readArtifact('dist-electron/preload.js');
if (preload !== null) {
  const required = new Set();
  for (const match of preload.matchAll(/\brequire\(\s*["']([^"']+)["']\s*\)/g)) {
    required.add(match[1]);
  }
  if (required.size === 0) {
    problems.push('preload.js has no require("electron") — is it the bundled preload?');
  }
  for (const moduleName of required) {
    if (moduleName !== 'electron') {
      problems.push(`preload.js requires "${moduleName}" (only "electron" is allowed)`);
    }
  }
  if (!preload.includes('contextBridge.exposeInMainWorld')) {
    problems.push('preload.js does not expose a contextBridge API');
  }
}

if (problems.length > 0) {
  for (const problem of problems) console.error(`[smoke:dist] FAIL: ${problem}`);
  process.exit(1);
}

console.log('[smoke:dist] OK: CSP, main/preload bundles and preload isolation verified');
