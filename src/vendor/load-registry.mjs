/**
 * Node-only: читает data/oui/* в LoadedOuiRegistry и ставит default для lookupVendor(bssid).
 */
import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { createOuiRegistry, setDefaultOuiRegistry } from './lookup.mjs';
import { parseIeeeMal } from './parse-ieee-mal.mjs';

const VENDOR_DIR = path.dirname(fileURLToPath(import.meta.url));
export const DATA_OUI_DIR = path.resolve(VENDOR_DIR, '../../data/oui');

const FILE_CANDIDATES = ['ieee-mal.csv', 'ieee-mal.txt', 'ieee-mal.sample.csv'];

/**
 * @param {string} [filePath]
 * @returns {string}
 */
export function resolveOuiRegistryPath(filePath) {
  if (filePath) {
    return path.resolve(filePath);
  }
  const fromEnv = process.env.LV24_OUI_REGISTRY;
  if (fromEnv) {
    return path.resolve(fromEnv);
  }
  const dir = process.env.LV24_OUI_DIR ? path.resolve(process.env.LV24_OUI_DIR) : DATA_OUI_DIR;
  for (const name of FILE_CANDIDATES) {
    const candidate = path.join(dir, name);
    if (existsSync(candidate)) {
      return candidate;
    }
  }
  return path.join(dir, FILE_CANDIDATES[0]);
}

/**
 * @param {string} [filePath]
 */
export function loadOuiRegistry(filePath) {
  const resolved = resolveOuiRegistryPath(filePath);
  if (!existsSync(resolved)) {
    throw new Error(`IEEE MA-L registry not found: ${resolved}`);
  }
  const text = readFileSync(resolved, 'utf8');
  const records = parseIeeeMal(text);
  if (records.size === 0) {
    throw new Error(`IEEE MA-L registry parsed zero assignments: ${resolved}`);
  }
  const meta = readSidecarMeta(path.dirname(resolved));
  const generatedAt = meta?.generatedAt ?? statSync(resolved).mtime.toISOString();
  const loaded = createOuiRegistry(records, {
    fileName: `oui/${path.basename(resolved)}`,
    generatedAt,
  });
  setDefaultOuiRegistry(loaded);
  return loaded;
}

/**
 * @param {string} dir
 * @returns {{ generatedAt?: string, fileName?: string } | null}
 */
function readSidecarMeta(dir) {
  const metaPath = path.join(dir, 'meta.json');
  if (!existsSync(metaPath)) {
    return null;
  }
  try {
    return JSON.parse(readFileSync(metaPath, 'utf8'));
  } catch {
    return null;
  }
}
