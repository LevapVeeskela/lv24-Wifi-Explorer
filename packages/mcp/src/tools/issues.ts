/**
 * `wifi_issues` — v1 issue heuristics for every BSS of the current scan.
 *
 * Heuristics are scan-relative (neighbor overlap, SSID groups, total BSS), so
 * `counts` always describe the whole scan; `bssid` only narrows `rows`.
 */

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import {
  evaluateScanIssues,
  scanIssueBssFromObserved,
  type IssueSeverity,
  type ObservedBss,
  type ScanIssueId,
  type ScanIssueRow,
} from '@lv24/wifi-core';
import { z } from 'zod';
import { toCompactNetwork } from '../format/compact.js';
import type { ScanService } from '../scan/service.js';
import { normalizeBssid } from './network.js';
import { withErrorHandling, type ToolTextResult } from './shared.js';

export const wifiIssuesShape = {
  refresh: z.boolean().optional().describe('Force a fresh scan instead of the cached snapshot.'),
  bssid: z
    .string()
    .min(1)
    .optional()
    .describe('Only report this BSSID, e.g. `aa:bb:cc:dd:ee:ff` (case/separators insensitive).'),
};

export type WifiIssuesArgs = {
  refresh?: boolean;
  bssid?: string;
};

export type ReportIssue = {
  id: ScanIssueId;
  severity: IssueSeverity;
  messageKey: string;
};

export type IssueReportRow = {
  bssid: string | null;
  ssid: string | null;
  issues: ReportIssue[];
};

export type WifiIssuesPayload = {
  capturedAt: string;
  source: string;
  demo: boolean;
  counts: Partial<Record<ScanIssueId, number>>;
  rowsWithIssues: number;
  rows: IssueReportRow[];
};

export type WifiIssuesNotFound = { error: 'not_found' };

/** One stable, unique heuristic row per scan row (a BSSID may be absent). */
export function toScanIssueRows(rows: readonly ObservedBss[]): ScanIssueRow[] {
  return rows.map((row, index) => ({ ...scanIssueBssFromObserved(row), id: `row:${index}` }));
}

export async function runWifiIssues(
  service: ScanService,
  args: WifiIssuesArgs = {}
): Promise<WifiIssuesPayload | WifiIssuesNotFound> {
  const snapshot = await service.getSnapshot({ refresh: args.refresh ?? false });
  const issueRows = toScanIssueRows(snapshot.rows);
  const evaluation = evaluateScanIssues(issueRows);

  const target = args.bssid === undefined ? null : normalizeBssid(args.bssid);
  if (target === null && args.bssid !== undefined) return { error: 'not_found' };

  const reportRows: IssueReportRow[] = snapshot.rows
    .map((row, index) => {
      const compact = toCompactNetwork(row);
      const flags = evaluation.byRowId.get(issueRows[index]?.id ?? '') ?? [];
      return {
        bssid: compact.bssid,
        ssid: compact.ssid,
        issues: flags.map((flag) => ({
          id: flag.id,
          severity: flag.severity,
          messageKey: flag.i18nKey,
        })),
      };
    })
    // Without a filter only flagged rows are interesting; a requested BSSID is
    // always echoed (empty `issues` means "checked, clean").
    .filter((row) => (target ? row.bssid === target : row.issues.length > 0));

  if (target && reportRows.length === 0) return { error: 'not_found' };

  return {
    capturedAt: snapshot.capturedAt,
    source: snapshot.source,
    demo: snapshot.demo,
    counts: evaluation.counts,
    rowsWithIssues: evaluation.rowsWithIssues,
    rows: reportRows,
  };
}

export function createWifiIssuesHandler(
  service: ScanService
): (args: WifiIssuesArgs) => Promise<ToolTextResult> {
  return withErrorHandling((args: WifiIssuesArgs) => runWifiIssues(service, args));
}

export function registerWifiIssuesTool(server: McpServer, service: ScanService): void {
  server.registerTool(
    'wifi_issues',
    {
      title: 'Detect Wi-Fi configuration issues',
      description:
        'Run v1 heuristics over the cached scan: 40 MHz on 2.4 GHz, channel overlap/crowding, low RSSI/SNR, open or legacy security, hidden SSID, legacy-only PHY, high utilization, DFS, 2.4-only, too many networks, large SSID groups. Returns per-issue counts, `rowsWithIssues` and flagged rows with stable issue ids, severity and i18n message keys. `bssid` narrows rows; counts stay whole-scan.',
      inputSchema: wifiIssuesShape,
      annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
    },
    createWifiIssuesHandler(service)
  );
}
