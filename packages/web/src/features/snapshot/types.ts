import type { AnnotationRule } from '../annotations/types';
import type { ObservedBss } from '@/domain/bss';
import type { LocationAuthorization } from '@/domain/identity';
import type { RssiHistoryPoint } from '@/domain/timeseries';
import type { LV24_SCAN_APP_NAME, LV24_SCAN_FORMAT_VERSION, LV24_SCAN_KIND } from './constants';

export type Lv24PinnedColor = {
  bssid: string;
  color: string;
};

export type Lv24ScanMetadata = {
  appName: typeof LV24_SCAN_APP_NAME;
  appVersion: string;
  os: string | null;
  capturedAt: string;
  endedAt: string | null;
  interfaceName: string | null;
  scanIntervalMs: number | null;
  location: LocationAuthorization | null;
};

export type Lv24ScanDocument = {
  kind: typeof LV24_SCAN_KIND;
  formatVersion: typeof LV24_SCAN_FORMAT_VERSION;
  metadata: Lv24ScanMetadata;
  networks: ObservedBss[];
  /** Per-BSSID RSSI history (also present on each network). */
  historyById: Record<string, RssiHistoryPoint[]>;
  annotations: AnnotationRule[];
  pinnedColors: Lv24PinnedColor[];
};

export type Lv24ScanParseCode =
  | 'invalid-json'
  | 'foreign-format'
  | 'unsupported-format'
  | 'invalid-document';

export type Lv24ScanParseResult =
  | { ok: true; document: Lv24ScanDocument }
  | { ok: false; error: string; code: Lv24ScanParseCode };

export type CreateLv24ScanInput = {
  networks: readonly ObservedBss[];
  annotations?: readonly AnnotationRule[];
  pinnedColors?: readonly Lv24PinnedColor[];
  appVersion: string;
  os?: string | null;
  capturedAt?: string;
  endedAt?: string | null;
  interfaceName?: string | null;
  scanIntervalMs?: number | null;
  location?: LocationAuthorization | null;
};
