import type { BandGhz, ChannelWidthMhz } from '@/domain/channel';
import type { PhyLetter } from '@/domain/phy';
import type { SecurityKind } from '@/domain/security';
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
  | 'dfs';

export type ScanIssueMessageKey = `scan.issue.${ScanIssueId}`;

export type IssueSeverity = 'warning' | 'info';

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
  /** BSS Load / QBSS utilization, 0–100. Omitted when IE unavailable. */
  channelUtilPct?: number | null;
  /** When set, overrides DFS inference from channel number. */
  isDfs?: boolean;
  /** ISO country (e.g. JP) for 2.4 GHz ch 14 exception. */
  countryCode?: string | null;
  /** Pairwise ciphers are TKIP-only (no CCMP/GCMP). */
  tkipOnly?: boolean;
}

export interface EvaluateIssuesOptions {
  /** Minimum overlapping neighbors (excluding self) for crowdedChannel. Default 4. */
  crowdedChannelMinNeighbors?: number;
}
