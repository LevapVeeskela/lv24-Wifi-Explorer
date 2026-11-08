/** Pure v1 scan issue heuristics + mapping from ObservedBss. */
export type {
  EvaluateIssuesOptions,
  EvaluateScanIssuesResult,
  IssueFlag,
  IssueSeverity,
  ScanIssueBss,
  ScanIssueContext,
  ScanIssueId,
  ScanIssueMessageKey,
  ScanIssueRow,
} from './types';
export { SCAN_ISSUE_IDS, SCAN_ISSUE_SEVERITY } from './types';

export { NON_OVERLAPPING_24_CHANNELS, SCAN_ISSUE_THRESHOLDS } from './thresholds';
export { inferDfsChannel } from './dfs';
export {
  buildScanContext,
  evaluateIssues,
  evaluateScanIssues,
  normalizeBssidKey,
} from './evaluate';
export { scanIssueBssFromObserved } from './fromObservedBss';
export {
  scanIssueIdFromMessageKey,
  scanIssueIdsFromMessageKeys,
  scanIssueMessageKey,
} from './keys';
