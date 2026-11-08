import type { BandGhz, ChannelWidthMhz } from '../channel';
import type { PhyLetter } from '../phy';
import type { SecurityKind } from '../security';

export type ScanIssueId =
  | 'width40on24'
  | 'overlap24'
  | 'crowdedChannel'
  | 'lowSignal'
  | 'lowSnr'
  | 'weakSecurity'
  | 'hiddenSsid'
  | 'legacyOnly'
  | 'highUtil'
  | 'dfs'
  | 'band24only'
  | 'tooManyNetworks'
  | 'largeGroup';

export type ScanIssueMessageKey = `scan.issue.${ScanIssueId}`;

export type IssueSeverity = 'warning' | 'info';

/** Stable display/ordering list of all issue ids. */
export const SCAN_ISSUE_IDS = [
  'width40on24',
  'overlap24',
  'crowdedChannel',
  'lowSignal',
  'lowSnr',
  'weakSecurity',
  'hiddenSsid',
  'legacyOnly',
  'highUtil',
  'dfs',
  'band24only',
  'tooManyNetworks',
  'largeGroup',
] as const satisfies readonly ScanIssueId[];

export const SCAN_ISSUE_SEVERITY: Record<ScanIssueId, IssueSeverity> = {
  width40on24: 'warning',
  overlap24: 'warning',
  crowdedChannel: 'warning',
  lowSignal: 'warning',
  lowSnr: 'warning',
  weakSecurity: 'warning',
  hiddenSsid: 'warning',
  legacyOnly: 'warning',
  highUtil: 'warning',
  dfs: 'info',
  band24only: 'info',
  tooManyNetworks: 'warning',
  largeGroup: 'info',
};

export interface IssueFlag {
  id: ScanIssueId;
  severity: IssueSeverity;
  i18nKey: ScanIssueMessageKey;
}

/** Fields needed for issue heuristics (subset of ObservedBss + optional load/DFS hints). */
export interface ScanIssueBss {
  channel: {
    band: BandGhz | 'unknown';
    number: number;
    widthMhz: ChannelWidthMhz | 'unknown';
  };
  signal: {
    rssiDbm: number;
    snrDb: number | null;
  };
  security: {
    primary: SecurityKind;
    isOpen: boolean;
  };
  hiddenSsid: boolean;
  phy: {
    highest: PhyLetter | null;
    supported: readonly PhyLetter[];
  };
  /** Normalized BSSID; used to exclude self from neighbor counting and dedupe context. */
  bssid?: string | null;
  /** Visible SSID text; used by SSID-group heuristics (band24only, largeGroup). */
  ssid?: string | null;
  /** BSS Load / QBSS utilization, 0–100. Omitted when IE unavailable. */
  channelUtilPct?: number | null;
  /** When set, overrides DFS inference from channel number. */
  isDfs?: boolean;
  /** ISO country (e.g. JP) for 2.4 GHz ch 14 exception. */
  countryCode?: string | null;
  /** Pairwise ciphers are TKIP-only (no CCMP/GCMP). */
  tkipOnly?: boolean;
}

/** One scan row for the batch API: heuristics input plus a stable row id. */
export type ScanIssueRow = ScanIssueBss & { id: string };

export interface EvaluateIssuesOptions {
  /** Minimum overlapping neighbors (excluding self) for crowdedChannel. Default 4. */
  crowdedChannelMinNeighbors?: number;
  /** Total BSS count in the scan that triggers tooManyNetworks. Default 80. */
  tooManyNetworksMinTotal?: number;
  /** BSS count per SSID that triggers largeGroup. Default 8. */
  largeGroupMinBss?: number;
}

/** Precomputed whole-scan aggregates shared by all rows (built once per scan). */
export interface ScanIssueContext {
  totalBss: number;
  /** SSID → set of known bands it appears on. */
  bandsBySsid: ReadonlyMap<string, ReadonlySet<number>>;
  /** SSID → number of BSS with that SSID. */
  countBySsid: ReadonlyMap<string, number>;
}

export interface EvaluateScanIssuesResult {
  /** rowId → issue flags for that row. */
  byRowId: Map<string, IssueFlag[]>;
  /** issueId → number of rows flagged with it. */
  counts: Partial<Record<ScanIssueId, number>>;
  /** Number of rows with at least one issue. */
  rowsWithIssues: number;
}
