import type { ColumnRulesConfig } from './types';

export const COLUMN_RULES_STORAGE_KEY = 'lv24.wifi-explorer.column-rules';

/** Same-tab broadcast when column rules are saved (multiple hook instances). */
export const COLUMN_RULES_CHANGED_EVENT = 'lv24-column-rules-changed';

/** Columns tinted when RSSI / quality highlighting is on. */
export const RSSI_HIGHLIGHT_FIELDS = new Set([
  'signal',
  'rssiDbm',
  'snrDb',
  'noiseDbm',
]);

/** Columns tinted when security highlighting is on. */
export const SECURITY_HIGHLIGHT_FIELDS = new Set(['securityLock', 'security']);

export const DEFAULT_COLUMN_RULES: ColumnRulesConfig = {
  enabled: true,
  highlights: ['rssi', 'security'],
};
