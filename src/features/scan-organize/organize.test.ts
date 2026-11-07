import { describe, expect, it } from 'vitest';
import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { STORAGE_ORGANIZE_BY } from '@/shared/lib/persistence/keys';
import { loadOrganizeBy, saveOrganizeBy } from './persist';
import { treeDataPathForOrganize } from './useScanOrganize';

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

function row(overrides: Partial<ScanGridRow> = {}): ScanGridRow {
  return {
    id: 'row-1',
    bssid: 'aa:bb:cc:dd:ee:ff',
    ssid: 'HomeNet',
    ssidHidden: false,
    vendor: 'Apple',
    annotation: '',
    signalQuality: 'good',
    signalBarPct: 80,
    rssiDbm: -55,
    noiseDbm: null,
    snrDb: null,
    channel: 6,
    channelWidth: 20,
    band: 2.4,
    phyMode: 'ax',
    securityLabel: 'WPA2',
    securityOpen: false,
    networkType: 'infrastructure',
    lastSeenAt: new Date().toISOString(),
    seriesColor: '#fff',
    connected: false,
    stale: false,
    issueKeys: [],
    source: {} as ScanGridRow['source'],
    ...overrides,
  };
}

describe('scan-organize', () => {
  it('returns null path getter when grouping is off', () => {
    expect(treeDataPathForOrganize('none')).toBeNull();
  });

  it('groups by SSID with a unique per-row path', () => {
    const getPath = treeDataPathForOrganize('ssid');
    expect(getPath).not.toBeNull();
    expect(getPath!(row())).toEqual(['HomeNet', 'row-1']);
    // distinct rows under the same SSID must not collide
    expect(getPath!(row({ id: 'row-2' }))).toEqual(['HomeNet', 'row-2']);
  });

  it('groups by AP (BSSID) and vendor, with fallbacks for empty values', () => {
    expect(treeDataPathForOrganize('ap')!(row())).toEqual(['aa:bb:cc:dd:ee:ff', 'row-1']);
    expect(treeDataPathForOrganize('vendor')!(row())).toEqual(['Apple', 'row-1']);
    expect(treeDataPathForOrganize('vendor')!(row({ vendor: null }))).toEqual(['—', 'row-1']);
    expect(treeDataPathForOrganize('ssid')!(row({ ssid: '' }))).toEqual(['‹hidden›', 'row-1']);
  });

  it('round-trips the organize-by value via storage', () => {
    const storage = memoryStorage();
    saveOrganizeBy('ssid', storage);
    expect(storage.getItem(STORAGE_ORGANIZE_BY)).toBe('ssid');
    expect(loadOrganizeBy(storage)).toBe('ssid');
  });

  it('falls back to none for missing or invalid values', () => {
    const storage = memoryStorage();
    expect(loadOrganizeBy(storage)).toBe('none');
    storage.setItem(STORAGE_ORGANIZE_BY, 'bogus');
    expect(loadOrganizeBy(storage)).toBe('none');
  });
});
