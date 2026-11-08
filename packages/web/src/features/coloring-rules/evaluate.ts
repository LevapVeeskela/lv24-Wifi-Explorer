import type { ScanGridRow } from '@/entities/bss/scanGridRow';
import { NUMERIC_COLORING_FIELDS } from './constants';
import { compactBssid, matchBssidGlob, matchGlob, parseNumericToken } from './match';
import type { ColoringField, ColoringOp, ColoringRule, ColoringRulesConfig } from './types';

/** Values a row exposes for a field; multi-valued only for `issue`. */
export function coloringFieldValues(row: ScanGridRow, field: ColoringField): string[] {
  switch (field) {
    case 'ssid':
      return [row.ssid];
    case 'bssid':
      return [row.bssid];
    case 'vendor':
      return [row.vendor ?? ''];
    case 'security':
      return [row.securityLabel];
    case 'band':
      return [String(row.band)];
    case 'channel':
      return [String(row.channel)];
    case 'rssi':
      return [String(row.rssiDbm)];
    case 'phy':
      return [row.phyMode];
    case 'issue':
      return row.issueKeys.map(String);
  }
}

function compareNumeric(actual: number, op: ColoringOp, expected: number): boolean {
  switch (op) {
    case 'gt':
      return actual > expected;
    case 'gte':
      return actual >= expected;
    case 'lt':
      return actual < expected;
    case 'lte':
      return actual <= expected;
    default:
      return false;
  }
}

function matchBssid(value: string, op: ColoringOp, needle: string): boolean {
  if (op === 'equals') return matchBssidGlob(needle, value);
  if (op === 'contains') {
    const haystack = compactBssid(value);
    const fragment = needle
      .trim()
      .toLowerCase()
      .replace(/[^0-9a-f*?]/g, '');
    if (!fragment) return false;
    return /[*?]/.test(fragment) ? matchBssidGlob(fragment, value) : haystack.includes(fragment);
  }
  // Ordering comparisons are meaningless for a hardware address.
  return false;
}

function matchText(value: string, op: ColoringOp, needle: string): boolean {
  const lowerValue = value.toLowerCase();
  const lowerNeedle = needle.toLowerCase();

  if (op === 'contains') return lowerValue.includes(lowerNeedle);
  if (op === 'equals') {
    return /[*?]/.test(needle) ? matchGlob(needle, value) : lowerValue === lowerNeedle;
  }

  const actual = parseNumericToken(value);
  const expected = parseNumericToken(needle);
  if (Number.isNaN(actual) || Number.isNaN(expected)) return false;
  return compareNumeric(actual, op, expected);
}

function matchNumeric(value: string, op: ColoringOp, needle: string): boolean {
  if (op === 'contains') return value.toLowerCase().includes(needle.toLowerCase());

  const actual = parseNumericToken(value);
  const expected = parseNumericToken(needle);

  if (op === 'equals') {
    if (Number.isNaN(actual) || Number.isNaN(expected)) {
      return value.toLowerCase() === needle.toLowerCase();
    }
    return actual === expected;
  }

  if (Number.isNaN(actual) || Number.isNaN(expected)) return false;
  return compareNumeric(actual, op, expected);
}

/**
 * True when `row` satisfies the rule predicate.
 * `rule.enabled` is intentionally ignored here — gating lives in
 * `resolveColoringColor`, so a single rule can be tested in isolation.
 */
export function evaluateColoringRule(row: ScanGridRow, rule: ColoringRule): boolean {
  const values = coloringFieldValues(row, rule.field);
  if (values.length === 0) return false;

  const numeric = NUMERIC_COLORING_FIELDS.has(rule.field);

  return values.some((value) => {
    if (rule.field === 'bssid') return matchBssid(value, rule.op, rule.value);
    return numeric
      ? matchNumeric(value, rule.op, rule.value)
      : matchText(value, rule.op, rule.value);
  });
}

/**
 * First enabled rule (lowest `priority`) that matches wins.
 * Array order is the fallback for duplicate priorities.
 */
export function resolveColoringColor(
  row: ScanGridRow,
  rules: readonly ColoringRule[]
): string | null {
  const candidates = rules
    .map((rule, index) => ({ rule, index }))
    .filter((entry) => entry.rule.enabled)
    .sort((a, b) => a.rule.priority - b.rule.priority || a.index - b.index);

  for (const { rule } of candidates) {
    if (evaluateColoringRule(row, rule)) return rule.color;
  }
  return null;
}

/** Same as `resolveColoringColor`, but honors the store-level `enabled` flag. */
export function resolveColoringColorFromStore(
  row: ScanGridRow,
  config: ColoringRulesConfig
): string | null {
  if (!config.enabled) return null;
  return resolveColoringColor(row, config.rules);
}
