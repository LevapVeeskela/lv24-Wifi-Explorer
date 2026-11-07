import '../scan_session/live_scan_flag.dart';

/// Whether the workbench should call `session.start()` when the page first loads.
///
/// Does not by itself choose live vs demo — [autoStartUsesLiveScan] does that.
bool shouldAutoStartScanOnLaunch(bool autoStartScanOnLaunch) =>
    autoStartScanOnLaunch;

/// Live ScanCore on auto-start only when live is allowed.
///
/// `LIVE_SCAN` or `preferDemo == false` allows live. Otherwise auto-start
/// stays on demo fixtures — never force live when only demo is allowed.
bool autoStartUsesLiveScan({
  required bool autoStartScanOnLaunch,
  required bool preferDemo,
  bool? liveScan,
}) {
  if (!autoStartScanOnLaunch) return false;
  return resolveLiveScanOptIn(liveScan: liveScan, preferDemo: preferDemo);
}
