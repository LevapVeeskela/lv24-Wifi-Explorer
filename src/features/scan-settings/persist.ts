import {
  SCAN_INTERVAL_SEC_MIN,
  SCAN_INTERVAL_SEC_OPTIONS,
  SCAN_SETTINGS_DEFAULTS,
  SCAN_SETTINGS_STORAGE_KEY,
} from './constants';
import type { ScanSettings, ScanSettingsStoreV1, SignalDisplayUnit } from './types';

export { SCAN_SETTINGS_STORAGE_KEY };

function isSignalUnit(value: unknown): value is SignalDisplayUnit {
  return value === 'dbm' || value === 'percent';
}

function snapIntervalSec(raw: number): number {
  const floored = Math.max(SCAN_INTERVAL_SEC_MIN, Math.floor(raw));
  let best: number = SCAN_SETTINGS_DEFAULTS.scanIntervalSec;
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

function normalizeMinRssi(value: unknown): number | null {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n <= -95) return null;
  return Math.min(-40, Math.max(-95, n));
}

export function normalizeScanSettings(partial: Partial<ScanSettings> | null | undefined): ScanSettings {
  const base = SCAN_SETTINGS_DEFAULTS;
  const signalUnit = isSignalUnit(partial?.signalUnit) ? partial.signalUnit : base.signalUnit;
  const minRssiDbm =
    partial && 'minRssiDbm' in partial ? normalizeMinRssi(partial.minRssiDbm) : base.minRssiDbm;
  const scanIntervalSec =
    typeof partial?.scanIntervalSec === 'number'
      ? snapIntervalSec(partial.scanIntervalSec)
      : base.scanIntervalSec;
  return { signalUnit, minRssiDbm, scanIntervalSec };
}

function parseStore(raw: string | null): ScanSettings {
  if (!raw) return SCAN_SETTINGS_DEFAULTS;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return SCAN_SETTINGS_DEFAULTS;
    const rec = parsed as Partial<ScanSettingsStoreV1>;
    return normalizeScanSettings(rec);
  } catch {
    return SCAN_SETTINGS_DEFAULTS;
  }
}

export type ScanSettingsStorage = Pick<Storage, 'getItem' | 'setItem'>;

export function defaultScanSettingsStorage(): ScanSettingsStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadScanSettings(
  storage: ScanSettingsStorage | null = defaultScanSettingsStorage()
): ScanSettings {
  if (!storage) return SCAN_SETTINGS_DEFAULTS;
  try {
    return parseStore(storage.getItem(SCAN_SETTINGS_STORAGE_KEY));
  } catch {
    return SCAN_SETTINGS_DEFAULTS;
  }
}

export function saveScanSettings(
  settings: ScanSettings,
  storage: ScanSettingsStorage | null = defaultScanSettingsStorage()
): void {
  if (!storage) return;
  const normalized = normalizeScanSettings(settings);
  const payload: ScanSettingsStoreV1 = { version: 1, ...normalized };
  try {
    storage.setItem(SCAN_SETTINGS_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // quota / private mode
  }
}
