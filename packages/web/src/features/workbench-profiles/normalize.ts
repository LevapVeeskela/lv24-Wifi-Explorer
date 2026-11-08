import {
  DEFAULT_COLUMN_VISIBILITY,
  SCAN_GRID_COLUMNS,
} from '@/features/scan-settings/columnCatalog';
import { normalizeFilterPresetFilters } from '@/features/scan-filters/presets/persist';
import {
  SCAN_INTERVAL_SEC_MIN,
  SCAN_INTERVAL_SEC_OPTIONS,
} from '@/features/scan-settings/constants';
import { ORGANIZE_BY_DEFAULT, type OrganizeByValue } from '@/features/scan-organize';
import { FILTER_DEFAULTS } from '@/features/scan-filters/types';
import {
  BUILT_IN_DEFAULT_PROFILE_ID,
  BUILT_IN_DEFAULT_PROFILE_NAME,
  MAX_PROFILE_NAME_LENGTH,
  MAX_WORKBENCH_PROFILES,
  type WorkbenchProfile,
  type WorkbenchProfilesStoreV1,
} from './types';

/** Mirrors `OrganizeByValue`; typed so an unknown literal fails to compile. */
const ORGANIZE_VALUES: ReadonlySet<OrganizeByValue> = new Set<OrganizeByValue>([
  'none',
  'ssid',
  'ap',
  'vendor',
]);

const KNOWN_COLUMN_FIELDS: readonly string[] = SCAN_GRID_COLUMNS.map((column) => column.field);

/** Trim + clamp a profile name; `null` for empty/garbage input. */
export function normalizeProfileName(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, MAX_PROFILE_NAME_LENGTH);
  return trimmed ? trimmed : null;
}

/** Keep only known grid columns, coercing every value to a boolean. */
export function normalizeWorkbenchColumnVisibility(value: unknown): Record<string, boolean> {
  const result: Record<string, boolean> = { ...DEFAULT_COLUMN_VISIBILITY };
  if (!value || typeof value !== 'object') return result;
  const rec = value as Record<string, unknown>;
  for (const field of KNOWN_COLUMN_FIELDS) {
    if (typeof rec[field] === 'boolean') result[field] = rec[field] as boolean;
  }
  return result;
}

export function normalizeOrganizeBy(value: unknown): OrganizeByValue {
  return typeof value === 'string' && ORGANIZE_VALUES.has(value as OrganizeByValue)
    ? (value as OrganizeByValue)
    : ORGANIZE_BY_DEFAULT;
}

/** Snap an untrusted interval to the nearest supported option. */
export function normalizeScanIntervalSec(value: unknown): number | undefined {
  if (typeof value !== 'number' || !Number.isFinite(value)) return undefined;
  const floored = Math.max(SCAN_INTERVAL_SEC_MIN, Math.floor(value));
  let best: number = SCAN_INTERVAL_SEC_OPTIONS[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const option of SCAN_INTERVAL_SEC_OPTIONS) {
    const dist = Math.abs(option - floored);
    if (dist < bestDist) {
      bestDist = dist;
      best = option;
    }
  }
  return best;
}

/** The built-in `Default` profile — always present, never persisted. */
export function builtInDefaultWorkbenchProfile(): WorkbenchProfile {
  return {
    id: BUILT_IN_DEFAULT_PROFILE_ID,
    name: BUILT_IN_DEFAULT_PROFILE_NAME,
    builtIn: true,
    columnVisibility: { ...DEFAULT_COLUMN_VISIBILITY },
    filters: { ...FILTER_DEFAULTS },
    organizeBy: ORGANIZE_BY_DEFAULT,
  };
}

/**
 * Coerce an untrusted value into a {@link WorkbenchProfile}.
 * Unknown properties are dropped; the built-in profile id is rejected here and
 * re-synthesized by {@link normalizeWorkbenchProfilesStore}.
 */
export function normalizeProfile(value: unknown): WorkbenchProfile | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : null;
  const name = normalizeProfileName(rec.name);
  if (!id || !name || id === BUILT_IN_DEFAULT_PROFILE_ID) return null;
  const scanIntervalSec = normalizeScanIntervalSec(rec.scanIntervalSec);
  return {
    id,
    name,
    columnVisibility: normalizeWorkbenchColumnVisibility(rec.columnVisibility),
    filters: normalizeFilterPresetFilters(
      (rec.filters ?? undefined) as Parameters<typeof normalizeFilterPresetFilters>[0]
    ),
    organizeBy: normalizeOrganizeBy(rec.organizeBy),
    ...(scanIntervalSec == null ? {} : { scanIntervalSec }),
  };
}

function dedupeProfiles(candidates: readonly WorkbenchProfile[]): WorkbenchProfile[] {
  const seenIds = new Set<string>([BUILT_IN_DEFAULT_PROFILE_ID]);
  const seenNames = new Set<string>([BUILT_IN_DEFAULT_PROFILE_NAME.toLowerCase()]);
  const result: WorkbenchProfile[] = [];
  for (const profile of candidates) {
    if (result.length >= MAX_WORKBENCH_PROFILES) break;
    const nameKey = profile.name.toLowerCase();
    if (seenIds.has(profile.id) || seenNames.has(nameKey)) continue;
    seenIds.add(profile.id);
    seenNames.add(nameKey);
    result.push(profile);
  }
  return result;
}

/** Coerce a parsed store (or nothing at all) into a valid V1 store. */
export function normalizeWorkbenchProfilesStore(value: unknown): WorkbenchProfilesStoreV1 {
  const fallback: WorkbenchProfilesStoreV1 = {
    version: 1,
    profiles: [builtInDefaultWorkbenchProfile()],
    activeProfileId: null,
  };
  if (!value || typeof value !== 'object') return fallback;
  const rec = value as Record<string, unknown>;
  if (rec.version !== 1) return fallback;
  const parsed = Array.isArray(rec.profiles)
    ? rec.profiles.map(normalizeProfile).filter((p): p is WorkbenchProfile => p != null)
    : [];
  const profiles = [builtInDefaultWorkbenchProfile(), ...dedupeProfiles(parsed)];
  const rawActive = typeof rec.activeProfileId === 'string' ? rec.activeProfileId.trim() : '';
  const activeProfileId = profiles.some((p) => p.id === rawActive) ? rawActive : null;
  return { version: 1, profiles, activeProfileId };
}
