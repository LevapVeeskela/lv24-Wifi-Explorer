import { describe, expect, it } from 'vitest';
import { COLORING_RULES_STORAGE_KEY } from './constants';
import { loadColoringRules, saveColoringRules, type ColoringRulesStorage } from './persist';
import type { ColoringRule, ColoringRulesConfig } from './types';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map<string, string>(Object.entries(initial));
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

function rule(partial: Partial<ColoringRule> = {}): ColoringRule {
  return {
    id: 'r1',
    name: 'Home',
    enabled: true,
    priority: 0,
    color: '#ff0000',
    field: 'ssid',
    op: 'contains',
    value: 'home',
    ...partial,
  };
}

const config: ColoringRulesConfig = {
  enabled: true,
  rules: [rule(), rule({ id: 'r2', priority: 1, field: 'rssi', op: 'lt', value: '-70' })],
};

describe('coloring-rules persist', () => {
  it('round-trips through the storage key', () => {
    const storage = memoryStorage();
    expect(saveColoringRules(config, storage)).toBe(true);

    const raw = storage.getItem(COLORING_RULES_STORAGE_KEY);
    expect(raw).toContain('"version":1');
    expect(loadColoringRules(storage)).toEqual(config);
  });

  it('leaves no temp key behind after a successful save', () => {
    const storage = memoryStorage();
    saveColoringRules(config, storage);
    expect(storage.getItem(`${COLORING_RULES_STORAGE_KEY}.tmp`)).toBeNull();
  });

  it('returns defaults when nothing is stored', () => {
    expect(loadColoringRules(memoryStorage())).toEqual({
      enabled: true,
      rules: [],
    });
  });

  it('recovers from corrupted JSON', () => {
    const storage = memoryStorage({
      [COLORING_RULES_STORAGE_KEY]: '{"version":1,',
    });
    expect(loadColoringRules(storage)).toEqual({ enabled: true, rules: [] });
  });

  it('drops invalid stored rules but keeps valid ones', () => {
    const storage = memoryStorage({
      [COLORING_RULES_STORAGE_KEY]: JSON.stringify({
        version: 1,
        enabled: false,
        rules: [rule(), rule({ id: 'bad', color: 'red' })],
      }),
    });
    const loaded = loadColoringRules(storage);
    expect(loaded.enabled).toBe(false);
    expect(loaded.rules.map((r) => r.id)).toEqual(['r1']);
  });

  it('ignores an unsupported store version', () => {
    const storage = memoryStorage({
      [COLORING_RULES_STORAGE_KEY]: JSON.stringify({
        version: 2,
        enabled: false,
        rules: [rule()],
      }),
    });
    expect(loadColoringRules(storage)).toEqual({ enabled: true, rules: [] });
  });

  it('keeps the previous value when the commit write fails', () => {
    const previous = JSON.stringify({ version: 1, enabled: false, rules: [] });
    const base = memoryStorage({ [COLORING_RULES_STORAGE_KEY]: previous });
    let failCommit = false;
    const failing: ColoringRulesStorage = {
      getItem: (key) => base.getItem(key),
      setItem: (key, value) => {
        if (failCommit && key === COLORING_RULES_STORAGE_KEY) throw new Error('quota');
        base.setItem(key, value);
      },
    };

    failCommit = true;
    expect(saveColoringRules(config, failing)).toBe(false);
    expect(base.getItem(COLORING_RULES_STORAGE_KEY)).toBe(previous);
  });

  it('loads a staged temp payload after an interrupted save', () => {
    const storage = memoryStorage({
      [`${COLORING_RULES_STORAGE_KEY}.tmp`]: JSON.stringify({
        version: 1,
        enabled: false,
        rules: [rule()],
      }),
    });
    expect(loadColoringRules(storage)).toEqual({
      enabled: false,
      rules: [rule()],
    });
  });

  it('refuses to write when no storage is available', () => {
    expect(saveColoringRules(config, null)).toBe(false);
    expect(loadColoringRules(null)).toEqual({ enabled: true, rules: [] });
  });
});
