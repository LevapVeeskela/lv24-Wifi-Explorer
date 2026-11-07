import '../android_scan/android_scan.dart';
import 'scan_workbench_session.dart';

/// Returns the Android WifiManager workbench session (never the demo-only stub).
ScanWorkbenchSession? createAndroidScanWorkbenchSession({String? repoRoot}) {
  return AndroidWorkbenchScanSession(repoRoot: repoRoot);
}

/// [AndroidScanSession] exposed as [ScanWorkbenchSession] without a scan_session
/// dependency inside `features/android_scan/`.
final class AndroidWorkbenchScanSession extends AndroidScanSession
    implements ScanWorkbenchSession {
  AndroidWorkbenchScanSession({
    super.repoRoot,
    super.adapter,
    super.pollInterval,
  });

  @override
  bool get scanCoreError => !demo && lastError != null;

  @override
  DateTime? get latestRowLastSeenAt => maxLastSeenAtForRows(rows);
}
