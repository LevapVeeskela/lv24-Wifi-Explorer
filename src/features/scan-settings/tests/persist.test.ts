import { describe, expect, it } from 'vitest';
import { SCAN_SETTINGS_DEFAULTS, SCAN_SETTINGS_STORAGE_KEY } from '../constants';
import { loadScanSettings, normalizeScanSettings, saveScanSettings } from '../persist';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key: string) {
      return map.get(key) ?? null;
    },
    key(index: number) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key: string) {
      map.delete(key);
    },
    setItem(key: string, value: string) {
      map.set(key, value);
    },
  };
}

describe('scan-settings persist', () => {
  it('normalizes interval to allowed options with floor 3s', () => {
    expect(normalizeScanSettings({ scanIntervalSec: 2 }).scanIntervalSec).toBe(3);
    expect(normalizeScanSettings({ scanIntervalSec: 4 }).scanIntervalSec).toBe(3);
    expect(normalizeScanSettings({ scanIntervalSec: 7 }).scanIntervalSec).toBe(5);
    expect(normalizeScanSettings({ scanIntervalSec: 12 }).scanIntervalSec).toBe(10);
  });

  it('round-trips via storage key lv24.wifi-explorer.settings', () => {
    const storage = memoryStorage();
    saveScanSettings(
      {
        signalUnit: 'dbm',
        minRssiDbm: -72,
        scanIntervalSec: 10,
      },
      storage
    );
    expect(storage.getItem(SCAN_SETTINGS_STORAGE_KEY)).toContain('"version":1');
    expect(loadScanSettings(storage)).toEqual({
      signalUnit: 'dbm',
      minRssiDbm: -72,
      scanIntervalSec: 10,
    });
  });

  it('falls back to defaults for invalid payload', () => {
    const storage = memoryStorage();
    storage.setItem(SCAN_SETTINGS_STORAGE_KEY, '{not json');
    expect(loadScanSettings(storage)).toEqual(SCAN_SETTINGS_DEFAULTS);
  });

  it('treats minRssi at or below -95 as off', () => {
    expect(normalizeScanSettings({ minRssiDbm: -95 }).minRssiDbm).toBeNull();
    expect(normalizeScanSettings({ minRssiDbm: -100 }).minRssiDbm).toBeNull();
  });
});
