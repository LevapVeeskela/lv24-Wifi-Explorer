import type { ColoringField, ColoringOp, ColoringRulesConfig } from './types';

export const COLORING_RULES_STORAGE_KEY = 'lv24.wifi-explorer.coloring-rules';

/** Same-tab broadcast when coloring rules are saved (multiple hook instances). */
export const COLORING_RULES_CHANGED_EVENT = 'lv24-coloring-rules-changed';

/** Hard cap on stored rules; imports above this are rejected. */
export const MAX_COLORING_RULES = 100;

/** Accepted color formats: `#rgb` / `#rrggbb`. */
export const HEX_COLOR_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export const COLORING_FIELDS: readonly ColoringField[] = [
  'ssid',
  'bssid',
  'vendor',
  'security',
  'band',
  'channel',
  'rssi',
  'phy',
  'issue',
];

export const COLORING_OPS: readonly ColoringOp[] = ['contains', 'equals', 'gt', 'gte', 'lt', 'lte'];

/** Fields compared numerically; other fields are matched as text. */
export const NUMERIC_COLORING_FIELDS: ReadonlySet<ColoringField> = new Set([
  'band',
  'channel',
  'rssi',
]);

export const DEFAULT_COLORING_RULES: ColoringRulesConfig = {
  enabled: true,
  rules: [],
};
