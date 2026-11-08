import { describe, expect, it } from 'vitest';
import { STORAGE_FILTER_PRESETS } from '@/shared/lib/persistence/keys';
import { FILTER_DEFAULTS } from '../types';
import type { ScanWorkbenchFilters } from '../types';
import {
  createFilterPreset,
  deleteFilterPreset,
  loadFilterPresetsStore,
  normalizeFilterPresetFilters,
  saveFilterPresetsStore,
} from './persist';

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

function filters(overrides: Partial<ScanWorkbenchFilters> = {}): ScanWorkbenchFilters {
  return { ...FILTER_DEFAULTS, ...overrides };
}

describe('filter-presets persist', () => {
  it('round-trips via storage key with version 1', () => {
    const storage = memoryStorage();
    const store = createFilterPreset(
      { version: 1, presets: [] },
      'My preset',
      filters({ band: '5' })
    );
    saveFilterPresetsStore(store, storage);
    expect(storage.getItem(STORAGE_FILTER_PRESETS)).toContain('"version":1');
    const loaded = loadFilterPresetsStore(storage);
    expect(loaded).toEqual(store);
  });

  it('returns empty store for missing/corrupt data', () => {
    const storage = memoryStorage();
    expect(loadFilterPresetsStore(storage)).toEqual({ version: 1, presets: [] });
    storage.setItem(STORAGE_FILTER_PRESETS, 'not-json');
    expect(loadFilterPresetsStore(storage)).toEqual({ version: 1, presets: [] });
    storage.setItem(STORAGE_FILTER_PRESETS, '{"version":2,"presets":[]}');
    expect(loadFilterPresetsStore(storage)).toEqual({ version: 1, presets: [] });
  });

  it('normalizes untrusted filter fields on load', () => {
    const storage = memoryStorage();
    storage.setItem(
      STORAGE_FILTER_PRESETS,
      JSON.stringify({
        version: 1,
        presets: [
          {
            id: 'p1',
            name: 'bad',
            filters: { band: '99', security: ['open', 'weird'], minRssiDbm: -20, searchQuery: 42 },
          },
        ],
      })
    );
    const loaded = loadFilterPresetsStore(storage);
    expect(loaded.presets).toHaveLength(1);
    expect(loaded.presets[0]?.filters).toEqual(filters({ security: ['open'], minRssiDbm: -40 }));
  });

  it('drops presets missing id or name', () => {
    const storage = memoryStorage();
    storage.setItem(
      STORAGE_FILTER_PRESETS,
      JSON.stringify({
        version: 1,
        presets: [
          { id: '', name: 'no id' },
          { id: 'p2', name: '   ' },
          { id: 'p3', name: 'ok', filters: {} },
        ],
      })
    );
    const loaded = loadFilterPresetsStore(storage);
    expect(loaded.presets.map((p) => p.id)).toEqual(['p3']);
  });

  it('createFilterPreset trims name and ignores empty names', () => {
    const base = { version: 1, presets: [] } as const;
    expect(createFilterPreset(base, '   ', filters()).presets).toHaveLength(0);
    const created = createFilterPreset(base, '  Trimmed  ', filters({ band: '24' }));
    expect(created.presets).toHaveLength(1);
    expect(created.presets[0]?.name).toBe('Trimmed');
    expect(created.presets[0]?.filters.band).toBe('24');
  });

  it('deleteFilterPreset is a no-op for unknown ids', () => {
    const store = createFilterPreset({ version: 1, presets: [] }, 'A', filters());
    expect(deleteFilterPreset(store, 'missing')).toBe(store);
    const deleted = deleteFilterPreset(store, store.presets[0]!.id);
    expect(deleted.presets).toHaveLength(0);
  });

  it('normalizeFilterPresetFilters clamps minRssi and defaults the rest', () => {
    const normalized = normalizeFilterPresetFilters({ minRssiDbm: -95 });
    expect(normalized).toEqual(FILTER_DEFAULTS);
    expect(normalizeFilterPresetFilters({ minRssiDbm: 0 }).minRssiDbm).toBe(-40);
    expect(normalizeFilterPresetFilters(null)).toEqual(FILTER_DEFAULTS);
  });
});
