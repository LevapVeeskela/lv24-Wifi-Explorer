/**
 * Local IEEE registry lookup for the MCP server.
 *
 * Reads the public IEEE MA-L CSV (`data/oui/ieee-mal.csv`) and exposes an
 * `OuiLookup` compatible with `@lv24/wifi-core`. When the file is absent the
 * lookup is disabled (vendor is reported as `null`) — a scan never fails just
 * because the registry is missing.
 */

import { existsSync, readFileSync } from 'node:fs';
import * as path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { OuiLookup } from '@lv24/wifi-core/scan';

export const OUI_REGISTRY_FILE_NAME = 'ieee-mal.csv';

/** 24-bit registries only: MA-S/MA-M are keyed by their 24-bit prefix here. */
const ACCEPTED_REGISTRIES = new Set(['MA-L', 'MA-S', 'MA-M']);

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));

let cachedLookup: OuiLookup | null | undefined;

/** Minimal CSV field splitter that understands double-quoted values. */
export function splitCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quoted) {
      if (char === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i += 1;
        } else {
          quoted = false;
        }
      } else {
        current += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ',') {
      fields.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  fields.push(current);
  return fields;
}

/**
 * Parse `Registry,Assignment,Organization Name,...` CSV.
 * Header rows and malformed assignments are skipped.
 */
export function parseOuiCsv(csv: string, registryFile: string): OuiLookup {
  const map = new Map<string, string>();
  for (const line of csv.split(/\r?\n/)) {
    if (!line.trim()) continue;
    const [registry, assignment, organization] = splitCsvLine(line);
    if (!registry || !assignment || !organization) continue;
    if (!ACCEPTED_REGISTRIES.has(registry)) continue;
    const oui = assignment.trim().toLowerCase();
    if (!/^[0-9a-f]{6,9}$/.test(oui)) continue;
    map.set(oui.slice(0, 6), organization.trim());
  }
  return (oui) => {
    const key = oui
      .toLowerCase()
      .replace(/[^0-9a-f]/g, '')
      .slice(0, 6);
    const organization = map.get(key);
    return organization ? { organization, registryFile } : null;
  };
}

function repoCandidateRoots(): string[] {
  const roots: string[] = [];
  let dir = MODULE_DIR;
  for (let depth = 0; depth < 6; depth += 1) {
    roots.push(path.join(dir, 'data', 'oui', OUI_REGISTRY_FILE_NAME));
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return roots;
}

/** Resolve the registry path: env override → cwd → repo root. */
export function resolveOuiRegistryPath(
  env: NodeJS.ProcessEnv = process.env,
  cwd: string = process.cwd()
): string | null {
  const override = env.LV24_OUI_REGISTRY;
  const candidates = [
    override && override.trim().length > 0 ? path.resolve(cwd, override) : null,
    path.join(cwd, 'data', 'oui', OUI_REGISTRY_FILE_NAME),
    ...repoCandidateRoots(),
  ].filter((value): value is string => typeof value === 'string' && value.length > 0);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null;
}

/** Load the lookup once per process. `null` means "no registry, no vendor data". */
export function loadOuiLookup(): OuiLookup | null {
  if (cachedLookup !== undefined) return cachedLookup;
  const registryPath = resolveOuiRegistryPath();
  if (!registryPath) {
    cachedLookup = null;
    return cachedLookup;
  }
  try {
    const csv = readFileSync(registryPath, 'utf8');
    cachedLookup = parseOuiCsv(csv, path.basename(registryPath));
  } catch {
    cachedLookup = null;
  }
  return cachedLookup;
}

/** Test helper: drop the module-level cache. */
export function resetOuiLookupCache(): void {
  cachedLookup = undefined;
}
