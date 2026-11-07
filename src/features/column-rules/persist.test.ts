import { describe, expect, it } from 'vitest';
import { COLUMN_RULES_CHANGED_EVENT, COLUMN_RULES_STORAGE_KEY, DEFAULT_COLUMN_RULES } from './constants';
import { loadColumnRules, saveColumnRules } from './persist';

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

describe('column-rules persist', () => {
  it('round-trips via storage key', () => {
    const storage = memoryStorage();
    const config = { enabled: false, highlights: ['rssi'] as const };
    saveColumnRules(config, storage);
    expect(storage.getItem(COLUMN_RULES_STORAGE_KEY)).toContain('"version":1');
    expect(loadColumnRules(storage)).toEqual(config);
  });

  it('keeps empty highlights array as both off', () => {
    const storage = memoryStorage();
    storage.setItem(
      COLUMN_RULES_STORAGE_KEY,
      '{"version":1,"enabled":true,"highlights":[]}',
    );
    expect(loadColumnRules(storage)).toEqual({ enabled: true, highlights: [] });
    saveColumnRules({ enabled: true, highlights: [] }, storage);
    expect(JSON.parse(storage.getItem(COLUMN_RULES_STORAGE_KEY)!).highlights).toEqual([]);
    expect(loadColumnRules(storage).highlights).toEqual([]);
  });

  it('dispatches same-tab changed event on save', () => {
    const storage = memoryStorage();
    let fired = false;
    const handler = () => {
      fired = true;
    };
    window.addEventListener(COLUMN_RULES_CHANGED_EVENT, handler);
    try {
      saveColumnRules(DEFAULT_COLUMN_RULES, storage);
      expect(fired).toBe(true);
    } finally {
      window.removeEventListener(COLUMN_RULES_CHANGED_EVENT, handler);
    }
  });
});
