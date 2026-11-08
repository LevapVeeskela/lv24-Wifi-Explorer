import { normalizeProfile, normalizeProfileName } from './normalize';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  MAX_PROFILE_NAME_LENGTH,
  MAX_WORKBENCH_PROFILES,
  type WorkbenchProfile,
  type WorkbenchProfilesExportV1,
  type WorkbenchProfilesStoreV1,
} from './types';

export type WorkbenchProfilesImportMode = 'merge' | 'replace';
export type DuplicateNameStrategy = 'skip' | 'rename';

export type WorkbenchProfilesImportOptions = {
  /** `merge` (default) appends; `replace` swaps out every custom profile. */
  mode?: WorkbenchProfilesImportMode;
  /** What to do when an imported name already exists. Default `skip`. */
  onDuplicateName?: DuplicateNameStrategy;
};

export type WorkbenchProfilesImportError = 'invalid_json' | 'invalid_shape';

export type WorkbenchProfilesImportResult = {
  store: WorkbenchProfilesStoreV1;
  imported: number;
  skipped: number;
  error?: WorkbenchProfilesImportError;
};

function newProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `wbprof-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Serialize custom profiles only — the built-in `Default` is synthesized. */
export function exportWorkbenchProfilesJson(store: WorkbenchProfilesStoreV1): string {
  const payload: WorkbenchProfilesExportV1 = {
    version: 1,
    profiles: store.profiles.filter((profile) => !profile.builtIn),
  };
  return JSON.stringify(payload, null, 2);
}

function collectCandidates(parsed: unknown): WorkbenchProfile[] | null {
  const rawList = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object'
      ? (parsed as { profiles?: unknown }).profiles
      : null;
  if (!Array.isArray(rawList)) return null;
  return rawList.map(normalizeProfile).filter((p): p is WorkbenchProfile => p != null);
}

/** `Base`, `Base (2)`, `Base (3)`… within the 64-char limit. */
function uniqueName(base: string, taken: ReadonlySet<string>): string {
  for (let suffix = 2; suffix < 1000; suffix += 1) {
    const tail = ` (${suffix})`;
    const trimmed = base.slice(0, MAX_PROFILE_NAME_LENGTH - tail.length).trim();
    const candidate = `${trimmed}${tail}`;
    if (!taken.has(candidate.toLowerCase())) return candidate;
  }
  return base;
}

/**
 * Parse and validate an exported payload, then merge/replace it into `store`.
 * Invalid JSON or a non-profile payload leaves the store untouched and reports
 * an error. Unknown properties are stripped by normalization.
 */
export function importWorkbenchProfilesJson(
  raw: string,
  store: WorkbenchProfilesStoreV1,
  options: WorkbenchProfilesImportOptions = {}
): WorkbenchProfilesImportResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { store, imported: 0, skipped: 0, error: 'invalid_json' };
  }
  const candidates = collectCandidates(parsed);
  if (!candidates) return { store, imported: 0, skipped: 0, error: 'invalid_shape' };

  const mode = options.mode ?? 'merge';
  const onDuplicateName = options.onDuplicateName ?? 'skip';
  const base =
    mode === 'replace' ? store.profiles.filter((profile) => profile.builtIn) : store.profiles;
  const kept = [...base];
  const takenIds = new Set(kept.map((profile) => profile.id));
  takenIds.add(BUILT_IN_DEFAULT_PROFILE_ID);
  const takenNames = new Set(kept.map((profile) => profile.name.toLowerCase()));
  let imported = 0;
  let skipped = 0;

  for (const candidate of candidates) {
    if (kept.filter((profile) => !profile.builtIn).length >= MAX_WORKBENCH_PROFILES) {
      skipped += 1;
      continue;
    }
    let name = normalizeProfileName(candidate.name);
    if (!name) {
      skipped += 1;
      continue;
    }
    if (takenNames.has(name.toLowerCase())) {
      if (onDuplicateName === 'skip') {
        skipped += 1;
        continue;
      }
      name = uniqueName(name, takenNames);
    }
    const id = takenIds.has(candidate.id) ? newProfileId() : candidate.id;
    const profile: WorkbenchProfile = {
      id,
      name,
      columnVisibility: candidate.columnVisibility,
      filters: candidate.filters,
      organizeBy: candidate.organizeBy,
      ...(candidate.scanIntervalSec == null ? {} : { scanIntervalSec: candidate.scanIntervalSec }),
    };
    takenIds.add(id);
    takenNames.add(name.toLowerCase());
    kept.push(profile);
    imported += 1;
  }

  const activeProfileId =
    store.activeProfileId && kept.some((profile) => profile.id === store.activeProfileId)
      ? store.activeProfileId
      : null;
  return {
    store: { version: 1, profiles: kept, activeProfileId },
    imported,
    skipped,
  };
}
