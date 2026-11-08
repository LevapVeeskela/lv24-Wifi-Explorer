import type { ObservedBss } from '@/domain/bss';
import type { MessageKey } from '@/shared/i18n';
import {
  evaluateIssues,
  evaluateScanIssues,
  scanIssueBssFromObserved,
} from '@/features/scan-issues';
import type { EvaluateIssuesOptions } from '@/features/scan-issues';

export function computeIssueKeys(
  bss: ObservedBss,
  all: readonly ObservedBss[],
  options?: EvaluateIssuesOptions
): MessageKey[] {
  const self = scanIssueBssFromObserved(bss);
  const neighbors = all.map(scanIssueBssFromObserved);
  return evaluateIssues(self, neighbors, options).map((flag) => flag.i18nKey);
}

/**
 * Whole-scan batch: maps neighbors and SSID groups once, then evaluates every
 * row. Returns `index → issue keys` in the same order as the input array.
 */
export function computeIssueKeysForScan(
  all: readonly ObservedBss[],
  options?: EvaluateIssuesOptions
): Map<string, MessageKey[]> {
  const rows = all.map((bss, index) => ({
    ...scanIssueBssFromObserved(bss),
    id: String(index),
  }));
  const result = evaluateScanIssues(rows, options);
  const byIndex = new Map<string, MessageKey[]>();
  for (const [id, flags] of result.byRowId) {
    byIndex.set(
      id,
      flags.map((flag) => flag.i18nKey)
    );
  }
  return byIndex;
}
