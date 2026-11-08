/** User-defined row coloring rules (v1). */

/** Row attribute a rule can test. */
export type ColoringField =
  | 'ssid'
  | 'bssid'
  | 'vendor'
  | 'security'
  | 'band'
  | 'channel'
  | 'rssi'
  | 'phy'
  | 'issue';

/** Match operation. `gt`/`gte`/`lt`/`lte` are numeric only. */
export type ColoringOp = 'contains' | 'equals' | 'gt' | 'gte' | 'lt' | 'lte';

export type ColoringRule = {
  id: string;
  name: string;
  enabled: boolean;
  /** Lower number wins; unique after normalization. */
  priority: number;
  /** `#rgb` or `#rrggbb`, lowercase in storage. */
  color: string;
  field: ColoringField;
  op: ColoringOp;
  value: string;
};

export type ColoringRulesStoreV1 = {
  version: 1;
  enabled: boolean;
  rules: ColoringRule[];
};

/** Store payload without the schema version (runtime config). */
export type ColoringRulesConfig = Omit<ColoringRulesStoreV1, 'version'>;

export type ColoringImportError =
  | 'empty'
  | 'invalid-json'
  | 'invalid-shape'
  | 'too-many-rules'
  | 'invalid-rule';

export type ColoringImportResult =
  | { ok: true; store: ColoringRulesStoreV1 }
  | { ok: false; error: ColoringImportError; index?: number };
