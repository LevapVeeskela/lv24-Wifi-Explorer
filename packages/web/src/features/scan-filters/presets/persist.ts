import { STORAGE_FILTER_PRESETS } from '@/shared/lib/persistence/keys';
import { SCAN_ISSUE_IDS, type ScanIssueId } from '@/domain';
import { FILTER_DEFAULTS, type ScanWorkbenchFilters } from '../types';
import type { FilterPreset, FilterPresetsStoreV1, FilterPresetsStorage } from './types';

const MAX_PRESET_NAME_LENGTH = 64;
const MAX_PRESETS = 32;

function newPresetId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `fpreset-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const BAND_VALUES: ReadonlySet<string> = new Set(['all', '24', '5', '6']);
const SECURITY_VALUES: ReadonlySet<string> = new Set(['open', 'secure']);
const ISSUE_VALUES: ReadonlySet<string> = new Set(SCAN_ISSUE_IDS);
const WIDTH_VALUES: ReadonlySet<number> = new Set([20, 40, 80, 160]);
const NETWORK_TYPE_VALUES: ReadonlySet<string> = new Set(['infrastructure', 'ibss']);
const MAX_CHANNEL = 233;
const MAX_PHY_LENGTH = 8;

function normalizeBand(value: unknown): ScanWorkbenchFilters['band'] {
  return typeof value === 'string' && BAND_VALUES.has(value)
    ? (value as ScanWorkbenchFilters['band'])
    : FILTER_DEFAULTS.band;
}

function normalizeSecurity(value: unknown): ScanWorkbenchFilters['security'] {
  if (!Array.isArray(value)) return [...FILTER_DEFAULTS.security];
  const seen = new Set<string>();
  const result: ScanWorkbenchFilters['security'] = [];
  for (const item of value) {
    if (typeof item === 'string' && SECURITY_VALUES.has(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item as ScanWorkbenchFilters['security'][number]);
    }
  }
  return result;
}

function normalizeIssueIds(value: unknown): ScanIssueId[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  const result: ScanIssueId[] = [];
  for (const item of value) {
    if (typeof item === 'string' && ISSUE_VALUES.has(item) && !seen.has(item)) {
      seen.add(item);
      result.push(item as ScanIssueId);
    }
  }
  return result;
}

function normalizeMinRssi(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n <= -95) return null;
  return Math.min(-40, Math.max(-95, n));
}

function normalizeText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeChannel(value: unknown): number | null {
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < 1 || n > MAX_CHANNEL) return null;
  return n;
}

function normalizeWidthMhz(value: unknown): ScanWorkbenchFilters['widthMhz'] {
  if (typeof value !== 'number' || !WIDTH_VALUES.has(value)) return null;
  return value as ScanWorkbenchFilters['widthMhz'];
}

function normalizePhy(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().slice(0, MAX_PHY_LENGTH);
  return trimmed ? trimmed : null;
}

function normalizeNetworkType(value: unknown): ScanWorkbenchFilters['networkType'] {
  return typeof value === 'string' && NETWORK_TYPE_VALUES.has(value)
    ? (value as ScanWorkbenchFilters['networkType'])
    : null;
}

function normalizeFlag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

/** Coerce an untrusted filter object into a valid {@link ScanWorkbenchFilters}. */
export function normalizeFilterPresetFilters(
  partial: Partial<ScanWorkbenchFilters> | null | undefined
): ScanWorkbenchFilters {
  const base = FILTER_DEFAULTS;
  return {
    band: normalizeBand(partial?.band),
    security: normalizeSecurity(partial?.security),
    searchQuery: normalizeText(partial?.searchQuery),
    vendorQuery: normalizeText(partial?.vendorQuery),
    minRssiDbm:
      partial && 'minRssiDbm' in partial ? normalizeMinRssi(partial.minRssiDbm) : base.minRssiDbm,
    includeHiddenSsid:
      typeof partial?.includeHiddenSsid === 'boolean'
        ? partial.includeHiddenSsid
        : base.includeHiddenSsid,
    issueIds: normalizeIssueIds(partial?.issueIds),
    channel: normalizeChannel(partial?.channel),
    widthMhz: normalizeWidthMhz(partial?.widthMhz),
    phy: normalizePhy(partial?.phy),
    networkType: normalizeNetworkType(partial?.networkType),
    annotatedOnly: normalizeFlag(partial?.annotatedOnly, base.annotatedOnly ?? false),
    selectedOnly: normalizeFlag(partial?.selectedOnly, base.selectedOnly ?? false),
  };
}

function parsePreset(value: unknown): FilterPreset | null {
  if (!value || typeof value !== 'object') return null;
  const rec = value as Record<string, unknown>;
  const id = typeof rec.id === 'string' && rec.id.trim() ? rec.id.trim() : null;
  const name =
    typeof rec.name === 'string' && rec.name.trim()
      ? rec.name.trim().slice(0, MAX_PRESET_NAME_LENGTH)
      : null;
  if (!id || !name) return null;
  return {
    id,
    name,
    filters: normalizeFilterPresetFilters(rec.filters as Partial<ScanWorkbenchFilters>),
  };
}

function emptyStore(): FilterPresetsStoreV1 {
  return { version: 1, presets: [] };
}

export function defaultFilterPresetsStorage(): FilterPresetsStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadFilterPresetsStore(
  storage: FilterPresetsStorage | null = defaultFilterPresetsStorage()
): FilterPresetsStoreV1 {
  if (!storage) return emptyStore();
  try {
    const raw = storage.getItem(STORAGE_FILTER_PRESETS);
    if (!raw) return emptyStore();
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return emptyStore();
    const rec = parsed as Record<string, unknown>;
    if (rec.version !== 1) return emptyStore();
    const presets = Array.isArray(rec.presets)
      ? rec.presets.map(parsePreset).filter((p): p is FilterPreset => p != null)
      : [];
    return { version: 1, presets };
  } catch {
    return emptyStore();
  }
}

export function saveFilterPresetsStore(
  store: FilterPresetsStoreV1,
  storage: FilterPresetsStorage | null = defaultFilterPresetsStorage()
): void {
  if (!storage) return;
  const payload: FilterPresetsStoreV1 = { version: 1, presets: store.presets };
  try {
    storage.setItem(STORAGE_FILTER_PRESETS, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}

export function createFilterPreset(
  store: FilterPresetsStoreV1,
  name: string,
  filters: ScanWorkbenchFilters
): FilterPresetsStoreV1 {
  const trimmed = name.trim().slice(0, MAX_PRESET_NAME_LENGTH);
  if (!trimmed || store.presets.length >= MAX_PRESETS) return store;
  const preset: FilterPreset = {
    id: newPresetId(),
    name: trimmed,
    filters: normalizeFilterPresetFilters(filters),
  };
  return { ...store, presets: [...store.presets, preset] };
}

export function deleteFilterPreset(
  store: FilterPresetsStoreV1,
  presetId: string
): FilterPresetsStoreV1 {
  if (!store.presets.some((p) => p.id === presetId)) return store;
  return { ...store, presets: store.presets.filter((p) => p.id !== presetId) };
}
