import {
  COLUMN_RULES_CHANGED_EVENT,
  COLUMN_RULES_STORAGE_KEY,
  DEFAULT_COLUMN_RULES,
} from './constants';
import type { ColumnRulesConfig, ColumnRulesHighlight, ColumnRulesStoreV1 } from './types';

export type ColumnRulesStorage = Pick<Storage, 'getItem' | 'setItem'>;

const VALID_HIGHLIGHTS: ReadonlySet<ColumnRulesHighlight> = new Set(['rssi', 'security']);

function normalizeHighlights(value: unknown): ColumnRulesHighlight[] {
  if (!Array.isArray(value)) return [...DEFAULT_COLUMN_RULES.highlights];
  // `[]` is both highlights off — do not substitute defaults.
  return value.filter(
    (item): item is ColumnRulesHighlight =>
      typeof item === 'string' && VALID_HIGHLIGHTS.has(item as ColumnRulesHighlight),
  );
}

function parseStore(raw: string | null): ColumnRulesConfig {
  if (!raw) return { ...DEFAULT_COLUMN_RULES };
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return { ...DEFAULT_COLUMN_RULES };
    const rec = parsed as Partial<ColumnRulesStoreV1>;
    return {
      enabled: typeof rec.enabled === 'boolean' ? rec.enabled : DEFAULT_COLUMN_RULES.enabled,
      highlights: normalizeHighlights(rec.highlights),
    };
  } catch {
    return { ...DEFAULT_COLUMN_RULES };
  }
}

export function defaultColumnRulesStorage(): ColumnRulesStorage | null {
  try {
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {
    return null;
  }
  return null;
}

export function loadColumnRules(
  storage: ColumnRulesStorage | null = defaultColumnRulesStorage(),
): ColumnRulesConfig {
  if (!storage) return { ...DEFAULT_COLUMN_RULES };
  try {
    return parseStore(storage.getItem(COLUMN_RULES_STORAGE_KEY));
  } catch {
    return { ...DEFAULT_COLUMN_RULES };
  }
}

export function saveColumnRules(
  config: ColumnRulesConfig,
  storage: ColumnRulesStorage | null = defaultColumnRulesStorage(),
): void {
  if (!storage) return;
  const payload: ColumnRulesStoreV1 = { version: 1, ...config };
  try {
    storage.setItem(COLUMN_RULES_STORAGE_KEY, JSON.stringify(payload));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(COLUMN_RULES_CHANGED_EVENT));
    }
  } catch {
    // quota / private mode
  }
}
