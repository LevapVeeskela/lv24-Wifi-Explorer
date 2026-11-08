import {
  COLORING_RULES_CHANGED_EVENT,
  COLORING_RULES_STORAGE_KEY,
  DEFAULT_COLORING_RULES,
} from './constants';
import { normalizeColoringStore, toColoringRulesStore } from './normalize';
import type { ColoringRulesConfig, ColoringRulesStoreV1 } from './types';

export type ColoringRulesStorage = Pick<Storage, 'getItem' | 'setItem'> &
  Partial<Pick<Storage, 'removeItem'>>;

/** Staging key used for the verify-before-commit save. */
const TEMP_KEY = `${COLORING_RULES_STORAGE_KEY}.tmp`;

export function defaultColoringRulesStorage(): ColoringRulesStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

function parseRaw(raw: string | null): ColoringRulesConfig | null {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    const rec = parsed as Partial<ColoringRulesStoreV1>;
    if (rec.version !== undefined && rec.version !== 1) return null;
    return normalizeColoringStore(rec);
  } catch {
    return null;
  }
}

export function loadColoringRules(
  storage: ColoringRulesStorage | null = defaultColoringRulesStorage()
): ColoringRulesConfig {
  if (!storage) return { ...DEFAULT_COLORING_RULES, rules: [] };
  try {
    const loaded = parseRaw(storage.getItem(COLORING_RULES_STORAGE_KEY));
    if (loaded) return loaded;
    // Recover an interrupted save staged under the temp key.
    return (
      parseRaw(storage.getItem(TEMP_KEY)) ?? {
        ...DEFAULT_COLORING_RULES,
        rules: [],
      }
    );
  } catch {
    return { ...DEFAULT_COLORING_RULES, rules: [] };
  }
}

/**
 * Atomic save: serialize once, verify the staged write, then commit the real
 * key. A quota error or a corrupt read-back leaves the previous value intact.
 */
export function saveColoringRules(
  config: ColoringRulesConfig | ColoringRulesStoreV1,
  storage: ColoringRulesStorage | null = defaultColoringRulesStorage()
): boolean {
  if (!storage) return false;

  let payload: string;
  try {
    payload = JSON.stringify(
      toColoringRulesStore({ enabled: config.enabled, rules: config.rules })
    );
  } catch {
    return false;
  }

  try {
    storage.setItem(TEMP_KEY, payload);
    if (storage.getItem(TEMP_KEY) !== payload) return false;
    storage.setItem(COLORING_RULES_STORAGE_KEY, payload);
    storage.removeItem?.(TEMP_KEY);
  } catch {
    // quota / private mode: keep the previously saved rules
    return false;
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(COLORING_RULES_CHANGED_EVENT));
  }
  return true;
}
