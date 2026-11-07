import '../windows_scan/windows_scan.dart';
import 'scan_workbench_session.dart';

/// Returns the Windows Native Wifi associated-link session (demo fallback; not a BSS survey).
ScanWorkbenchSession? createWindowsScanWorkbenchSession({String? repoRoot}) {
  return WindowsWorkbenchScanSession(repoRoot: repoRoot);
}

/// [WindowsScanSession] exposed as [ScanWorkbenchSession] without a scan_session
/// dependency inside `features/windows_scan/`.
final class WindowsWorkbenchScanSession extends WindowsScanSession
    implements ScanWorkbenchSession {
  WindowsWorkbenchScanSession({
    super.repoRoot,
    super.adapter,
    super.pollInterval,
  });

  @override
  bool get scanCoreError => !demo && lastError != null;

  @override
  DateTime? get latestRowLastSeenAt => maxLastSeenAtForRows(rows);
}
