import { describe, expect, it } from 'vitest';
import {
  PINNED_COLORS_STORAGE_KEY,
  isValidHexColor,
  loadPinnedColors,
  pinnedColorFor,
  removePinnedColor,
  savePinnedColors,
  setPinnedColor,
} from '../pinnedColors';

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear() {
      map.clear();
    },
    getItem(key) {
      return map.get(key) ?? null;
    },
    key(index) {
      return [...map.keys()][index] ?? null;
    },
    removeItem(key) {
      map.delete(key);
    },
    setItem(key, value) {
      map.set(key, value);
    },
  };
}

describe('pinned colors', () => {
  it('validates hex and persists atomically', () => {
    const storage = memoryStorage();
    expect(isValidHexColor('#fb6e4a')).toBe(true);
    expect(isValidHexColor('fb6e4a')).toBe(false);
    savePinnedColors([{ bssid: 'aa:bb:cc:00:00:01', color: '#fb6e4a' }], storage);
    expect(storage.getItem(PINNED_COLORS_STORAGE_KEY)).toContain('aa:bb:cc:00:00:01');
    expect(loadPinnedColors(storage)).toEqual([{ bssid: 'aa:bb:cc:00:00:01', color: '#fb6e4a' }]);
  });

  it('sets, resolves and removes a color case-insensitively', () => {
    const next = setPinnedColor([], 'AA:BB:CC:00:00:01', '#34D399');
    expect(next).not.toBeNull();
    expect(pinnedColorFor(next!, 'aa:bb:cc:00:00:01')).toBe('#34d399');
    expect(removePinnedColor(next!, 'AA:BB:CC:00:00:01')).toEqual([]);
  });

  it('rejects invalid input without mutation', () => {
    expect(setPinnedColor([], 'aa:bb:cc:00:00:01', 'red')).toBeNull();
    expect(setPinnedColor([], '', '#34d399')).toBeNull();
  });
});
