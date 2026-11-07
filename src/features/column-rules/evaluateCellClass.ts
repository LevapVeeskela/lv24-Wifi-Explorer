import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { RSSI_HIGHLIGHT_FIELDS, SECURITY_HIGHLIGHT_FIELDS } from './constants';
import type { ColumnRuleCellClass, ColumnRulesConfig } from './types';
import { QUALITY_TO_CELL_CLASS } from './types';

function isWeakSecurity(row: ScanGridRow): boolean {
  if (row.securityOpen) return true;
  const primary = row.source.security.primary;
  return primary === 'wep' || primary === 'dynamic-wep';
}

/**
 * Returns CSS class names for a grid cell under the active column color rules.
 * Empty when rules are off or the field is not targeted by the active highlights.
 */
export function columnRuleClassesForCell(
  row: ScanGridRow,
  field: string,
  config: ColumnRulesConfig,
): ColumnRuleCellClass[] {
  if (!config.enabled) return [];

  const classes: ColumnRuleCellClass[] = [];

  if (config.highlights.includes('rssi') && RSSI_HIGHLIGHT_FIELDS.has(field)) {
    classes.push(QUALITY_TO_CELL_CLASS[row.signalQuality]);
  }

  if (config.highlights.includes('security') && SECURITY_HIGHLIGHT_FIELDS.has(field)) {
    if (row.securityOpen) {
      classes.push('scan-grid-cell--security-open');
    } else if (isWeakSecurity(row)) {
      classes.push('scan-grid-cell--security-weak');
    }
  }

  return classes;
}

export function columnRuleClassNameForCell(
  row: ScanGridRow,
  field: string,
  config: ColumnRulesConfig,
): string {
  return columnRuleClassesForCell(row, field, config).join(' ');
}
