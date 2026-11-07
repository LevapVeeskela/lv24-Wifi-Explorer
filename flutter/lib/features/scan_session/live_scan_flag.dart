/// Compile-time live ScanCore opt-in: `--dart-define=LIVE_SCAN=true`.
///
/// Default is demo fixtures (same policy as Electron without `--live`).
const bool liveScanFromEnvironment = bool.fromEnvironment(
  'LIVE_SCAN',
  defaultValue: false,
);

/// Live when [liveScan] is set, [liveScanFromEnvironment] is true, or the
/// persisted settings flag `preferDemo` is false.
bool resolveLiveScanOptIn({
  bool? liveScan,
  bool preferDemo = true,
}) {
  if (liveScan != null) return liveScan;
  if (liveScanFromEnvironment) return true;
  return !preferDemo;
}
