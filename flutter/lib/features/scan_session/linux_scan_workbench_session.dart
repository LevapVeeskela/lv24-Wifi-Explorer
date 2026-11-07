import '../linux_scan/linux_scan.dart';
import 'scan_workbench_session.dart';

/// Returns the Linux NetworkManager workbench session.
ScanWorkbenchSession? createLinuxScanWorkbenchSession({String? repoRoot}) {
  return LinuxWorkbenchScanSession(repoRoot: repoRoot);
}

/// [LinuxScanSession] exposed as [ScanWorkbenchSession] without a scan_session
/// dependency inside `features/linux_scan/`.
final class LinuxWorkbenchScanSession extends LinuxScanSession
    implements ScanWorkbenchSession {
  LinuxWorkbenchScanSession({
    super.repoRoot,
    super.adapter,
    super.pollInterval,
  });

  @override
  bool get scanCoreError => !demo && lastError != null;

  @override
  DateTime? get latestRowLastSeenAt => maxLastSeenAtForRows(rows);
}
