import type { ObservedBss } from '@/domain/bss';
import type { MessageKey } from '@/shared/i18n';
import { evaluateIssues, scanIssueBssFromObserved } from '@/features/scan-issues';
import type { EvaluateIssuesOptions } from '@/features/scan-issues';

export function computeIssueKeys(
  bss: ObservedBss,
  all: readonly ObservedBss[],
  options?: EvaluateIssuesOptions,
): MessageKey[] {
  const self = scanIssueBssFromObserved(bss);
  const neighbors = all.map(scanIssueBssFromObserved);
  return evaluateIssues(self, neighbors, options).map((flag) => flag.i18nKey);
}
