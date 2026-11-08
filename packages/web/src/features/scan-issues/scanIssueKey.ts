import type { ScanIssueId, ScanIssueMessageKey } from './types';

/** Shared-catalog key for an issue id (`scan.issue.*`). */
export function scanIssueMessageKey(id: ScanIssueId): ScanIssueMessageKey {
  return `scan.issue.${id}`;
}
