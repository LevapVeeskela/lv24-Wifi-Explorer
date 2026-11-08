import { normalizeColumnVisibility } from './normalizeVisibility';
import type { ColumnProfilesStoreV1, ColumnVisibilityProfile } from './types';

/** Portable column-profile payload (no ids/active state — those are device-local). */
export type ColumnProfilesExportV1 = {
  version: 1;
  profiles: { name: string; visibility: Record<string, boolean> }[];
};

export type ColumnProfilesImportError = 'invalid_json' | 'invalid_shape';

export type ColumnProfilesImportResult = {
  store: ColumnProfilesStoreV1;
  imported: number;
  skipped: number;
  error?: ColumnProfilesImportError;
};

const MAX_PROFILES = 50;

function newProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `colprof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function exportColumnProfilesJson(store: ColumnProfilesStoreV1): string {
  const payload: ColumnProfilesExportV1 = {
    version: 1,
    profiles: store.profiles.map((profile) => ({
      name: profile.name,
      visibility: { ...profile.visibility },
    })),
  };
  return JSON.stringify(payload, null, 2);
}

/**
 * Merge exported profiles into the local store. Names are matched
 * case-insensitively; duplicates and malformed entries are skipped.
 */
export function importColumnProfilesJson(
  raw: string,
  store: ColumnProfilesStoreV1
): ColumnProfilesImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { store, imported: 0, skipped: 0, error: 'invalid_json' };
  }
  if (!isRecord(parsed) || parsed.version !== 1 || !Array.isArray(parsed.profiles)) {
    return { store, imported: 0, skipped: 0, error: 'invalid_shape' };
  }

  const seenNames = new Set(store.profiles.map((profile) => profile.name.trim().toLowerCase()));
  const imported: ColumnVisibilityProfile[] = [];
  let skipped = 0;

  for (const candidate of parsed.profiles) {
    if (!isRecord(candidate) || typeof candidate.name !== 'string') {
      skipped += 1;
      continue;
    }
    const name = candidate.name.trim();
    const visibility = candidate.visibility;
    if (!name || !isRecord(visibility)) {
      skipped += 1;
      continue;
    }
    const normalizedName = name.toLowerCase();
    if (seenNames.has(normalizedName) || store.profiles.length + imported.length >= MAX_PROFILES) {
      skipped += 1;
      continue;
    }
    seenNames.add(normalizedName);
    const clean: Record<string, boolean> = {};
    for (const [field, value] of Object.entries(visibility)) {
      if (typeof value === 'boolean') clean[field] = value;
    }
    imported.push({
      id: newProfileId(),
      name,
      visibility: normalizeColumnVisibility(clean),
    });
  }

  return {
    store: {
      ...store,
      profiles: [...store.profiles, ...imported],
    },
    imported: imported.length,
    skipped,
  };
}
