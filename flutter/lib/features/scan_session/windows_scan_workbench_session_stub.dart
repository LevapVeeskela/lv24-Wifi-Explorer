import 'scan_workbench_session.dart';

/// Non-IO fallback. The factory's `dart.library.io` import uses
/// [windows_scan_workbench_session.dart].
ScanWorkbenchSession? createWindowsScanWorkbenchSession({String? repoRoot}) =>
    null;
