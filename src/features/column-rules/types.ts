import type { SignalQuality } from '@/domain/signal';

/** Which automatic cell highlights are active (SPEC §7.3 tiers + weak security). */
export type ColumnRulesHighlight = 'rssi' | 'security';

export type ColumnRulesStoreV1 = {
  version: 1;
  enabled: boolean;
  highlights: ColumnRulesHighlight[];
};

export type ColumnRulesConfig = Omit<ColumnRulesStoreV1, 'version'>;

export type ColumnRuleQualityClass =
  | 'scan-grid-cell--quality-excellent'
  | 'scan-grid-cell--quality-good'
  | 'scan-grid-cell--quality-fair'
  | 'scan-grid-cell--quality-poor'
  | 'scan-grid-cell--quality-unusable';

export type ColumnRuleSecurityClass =
  | 'scan-grid-cell--security-open'
  | 'scan-grid-cell--security-weak';

export type ColumnRuleCellClass = ColumnRuleQualityClass | ColumnRuleSecurityClass;

export const QUALITY_TO_CELL_CLASS: Record<SignalQuality, ColumnRuleQualityClass> = {
  excellent: 'scan-grid-cell--quality-excellent',
  good: 'scan-grid-cell--quality-good',
  fair: 'scan-grid-cell--quality-fair',
  poor: 'scan-grid-cell--quality-poor',
  unusable: 'scan-grid-cell--quality-unusable',
};
