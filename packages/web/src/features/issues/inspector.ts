import { SCAN_ISSUE_IDS, SCAN_ISSUE_SEVERITY, scanIssueMessageKey } from '@/domain';
import type { IssueSeverity, ScanIssueId, ScanIssueMessageKey } from '@/domain';

/** One BSS as shown in the issues inspector. */
export type IssueInspectorRow = {
  id: string;
  bssid: string;
  ssid: string;
  ssidHidden: boolean;
  rssiDbm: number;
  issueIds: readonly ScanIssueId[];
};

/** All BSS affected by one issue id. */
export type IssueInspectorGroup = {
  id: ScanIssueId;
  severity: IssueSeverity;
  /** Issue label key (`scan.issue.*`). */
  i18nKey: ScanIssueMessageKey;
  /** Affected rows, strongest signal first. */
  rows: IssueInspectorRow[];
};

const ISSUE_ORDER = new Map<ScanIssueId, number>(SCAN_ISSUE_IDS.map((id, index) => [id, index]));

/** Rows that carry at least one issue. */
export function rowsWithIssues(rows: readonly IssueInspectorRow[]): IssueInspectorRow[] {
  return rows.filter((row) => row.issueIds.length > 0);
}

/**
 * Group affected rows by issue id: biggest groups first, then stable
 * {@link SCAN_ISSUE_IDS} order. Rows inside a group are sorted by RSSI.
 */
export function buildIssueInspectorGroups(
  rows: readonly IssueInspectorRow[]
): IssueInspectorGroup[] {
  const affectedByIssue = new Map<ScanIssueId, IssueInspectorRow[]>();

  for (const row of rows) {
    for (const id of new Set(row.issueIds)) {
      const bucket = affectedByIssue.get(id);
      if (bucket) bucket.push(row);
      else affectedByIssue.set(id, [row]);
    }
  }

  return [...affectedByIssue.entries()]
    .map(([id, affected]) => ({
      id,
      severity: SCAN_ISSUE_SEVERITY[id],
      i18nKey: scanIssueMessageKey(id),
      rows: [...affected].sort((a, b) => b.rssiDbm - a.rssiDbm),
    }))
    .sort(
      (a, b) =>
        b.rows.length - a.rows.length || (ISSUE_ORDER.get(a.id) ?? 0) - (ISSUE_ORDER.get(b.id) ?? 0)
    );
}
