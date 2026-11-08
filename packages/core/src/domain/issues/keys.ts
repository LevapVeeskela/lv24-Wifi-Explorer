import { SCAN_ISSUE_IDS } from './types';
import type { ScanIssueId, ScanIssueMessageKey } from './types';

const ISSUE_KEY_PREFIX = 'scan.issue.';
const ISSUE_ID_SET: ReadonlySet<string> = new Set(SCAN_ISSUE_IDS);

/** Shared-catalog key for an issue id (`scan.issue.*`). */
export function scanIssueMessageKey(id: ScanIssueId): ScanIssueMessageKey {
  return `scan.issue.${id}`;
}

/**
 * Narrow a row's `issueKeys` entry back to a {@link ScanIssueId}.
 * Returns null for unrelated i18n keys (e.g. `scan.issue.separateNames`).
 */
export function scanIssueIdFromMessageKey(key: string): ScanIssueId | null {
  if (!key.startsWith(ISSUE_KEY_PREFIX)) return null;
  const id = key.slice(ISSUE_KEY_PREFIX.length);
  return ISSUE_ID_SET.has(id) ? (id as ScanIssueId) : null;
}

/** Deduped issue ids from a row's message keys, input order preserved. */
export function scanIssueIdsFromMessageKeys(keys: readonly string[]): ScanIssueId[] {
  const ids: ScanIssueId[] = [];
  for (const key of keys) {
    const id = scanIssueIdFromMessageKey(key);
    if (id !== null && !ids.includes(id)) ids.push(id);
  }
  return ids;
}
