import { describe, expect, it } from 'vitest';
import { STORAGE_COLUMNS } from '@/shared/lib/persistence/keys';
import { DEFAULT_COLUMN_VISIBILITY } from '../columnCatalog';
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

  it('returns defaults when storage is empty', () => {
    expect(loadColumnVisibility(memoryStorage())).toEqual(DEFAULT_COLUMN_VISIBILITY);
  });
});
