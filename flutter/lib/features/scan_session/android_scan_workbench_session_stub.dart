import 'scan_workbench_session.dart';

/// Non-IO fallback. The factory's `dart.library.io` import uses
/// [android_scan_workbench_session.dart].
ScanWorkbenchSession? createAndroidScanWorkbenchSession({String? repoRoot}) =>
    null;
