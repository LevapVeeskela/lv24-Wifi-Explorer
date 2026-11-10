import { describe, expect, it } from 'vitest';
import { STORAGE_COLUMNS } from '@/shared/lib/persistence/keys';
import {
  DEFAULT_COLUMN_VISIBILITY,
  DEFAULT_HIDDEN_FIELDS,
  SCAN_GRID_COLUMNS,
} from '@/entities/columns';
import { loadColumnVisibility, saveColumnVisibility } from '../columnVisibilityPersist';

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

describe('column visibility persist', () => {
  it('merges stored flags with defaults', () => {
    const storage = memoryStorage();
    saveColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, security: true }, storage);
    expect(storage.getItem(STORAGE_COLUMNS)).toContain('"security":true');
    const loaded = loadColumnVisibility(storage);
    expect(loaded.security).toBe(true);
    expect(loaded.bssid).toBe(true);
  });

  it('includes the extended parity columns, hidden by default', () => {
    const required = [
      'firstSeenAt',
      'uptimeSec',
      'centerFreqMhz',
      'maxRateMbps',
      'streams',
      'amendments',
      'generation',
      'countryCode',
      'beaconIntervalMs',
      'dtimPeriod',
      'bssLoadStations',
      'bssLoadUtilPct',
      'channelUtilPct',
      'ieCount',
      'ieBytes',
      'wps',
      'mfp',
      'ft',
    ] as const;
    for (const field of required) {
      expect(SCAN_GRID_COLUMNS.some((column) => column.field === field)).toBe(true);
      expect(DEFAULT_HIDDEN_FIELDS).toContain(field);
      expect(DEFAULT_COLUMN_VISIBILITY[field]).toBe(false);
    }
  });

  it('shows the issue counter by default', () => {
    expect(DEFAULT_COLUMN_VISIBILITY.issueFlags).toBe(true);
    expect(DEFAULT_HIDDEN_FIELDS).not.toContain('issueFlags');
  });

  it('reveals the issue counter once for states saved by older builds', () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_COLUMNS, JSON.stringify({ issueFlags: false }));

    expect(loadColumnVisibility(storage).issueFlags).toBe(true);

    saveColumnVisibility({ ...DEFAULT_COLUMN_VISIBILITY, issueFlags: false }, storage);
    expect(loadColumnVisibility(storage).issueFlags).toBe(false);
  });

  it('returns defaults when storage is empty', () => {
    expect(loadColumnVisibility(memoryStorage())).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});
