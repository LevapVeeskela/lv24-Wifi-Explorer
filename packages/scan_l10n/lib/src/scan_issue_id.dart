/// Issue ids returned by scan issue heuristics (matches TS `ScanIssueId` / `evaluateIssues`).
abstract final class ScanIssueId {
  static const width40on24 = 'width40on24';
  static const overlap24 = 'overlap24';
  static const crowdedChannel = 'crowdedChannel';
  static const lowSignal = 'lowSignal';
  static const lowSnr = 'lowSnr';
  static const weakSecurity = 'weakSecurity';
  static const hiddenSsid = 'hiddenSsid';
  static const legacyOnly = 'legacyOnly';
  static const highUtil = 'highUtil';
  static const dfs = 'dfs';

  static const all = <String>[
    width40on24,
    overlap24,
    crowdedChannel,
    lowSignal,
    lowSnr,
    weakSecurity,
    hiddenSsid,
    legacyOnly,
    highUtil,
    dfs,
  ];
}
