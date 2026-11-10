#!/usr/bin/env node
/**
 * Generate the production-only package.json for the container runtime stage.
 *
 * The image needs the four built workspace packages plus @lv24/wifi-mcp's
 * third-party dependencies (MCP SDK, zod). The web/desktop UI stack is not
 * part of the CLI/MCP path, so it must not be installed into the image.
 *
 * Workspace packages are referenced as `file:` dependencies pinned at their
 * real version: npm then resolves the CLI/MCP imports of `@lv24/*@1.0.0` to
 * the locally built copies instead of downloading them from npmjs.
 *
 * Usage: node docker/runtime-manifest.mjs <runtime-dir> [repo-root]
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const runtimeDir = resolve(process.argv[2] ?? '/runtime');
const repoRoot = resolve(process.argv[3] ?? '/src');
const workspacePackages = ['core', 'backend', 'cli', 'mcp'];

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

/** Resolve an installed dependency: hoisted at the root (Yarn 1) or nested. */
function installedVersion(name) {
  for (const candidate of [
    join(repoRoot, 'node_modules', name, 'package.json'),
    join(repoRoot, 'packages', 'mcp', 'node_modules', name, 'package.json'),
  ]) {
    try {
      return readJson(candidate).version;
    } catch {
      // try the next location
    }
  }
  throw new Error(`cannot resolve installed version of ${name}; run yarn install first`);
}

const dependencies = {};
for (const pkg of workspacePackages) {
  const manifest = readJson(join(repoRoot, 'packages', pkg, 'package.json'));
  dependencies[manifest.name] = `file:./pkgs/${pkg}`;
}

// Nothing else may reference @lv24/* here: everything must come from the build.
const mcpDependencies = readJson(join(repoRoot, 'packages', 'mcp', 'package.json')).dependencies;
for (const name of Object.keys(mcpDependencies)) {
  if (name.startsWith('@lv24/')) continue;
  // Pin the exact version installed during the build (Yarn 1 + frozen lockfile),
  // so the image does not drift from the tree that was compiled and tested.
  dependencies[name] = installedVersion(name);
}

const manifest = {
  name: 'lv24-wifi-runtime',
  version: '0.0.0',
  private: true,
  description: 'Production dependency tree for the LV24 WiFi Explorer container image.',
  license: 'MIT',
  dependencies,
};

writeFileSync(join(runtimeDir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.error(`runtime manifest: ${Object.keys(dependencies).length} dependencies`);
