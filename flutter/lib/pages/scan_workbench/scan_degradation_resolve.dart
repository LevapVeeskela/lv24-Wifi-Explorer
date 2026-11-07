import '../../features/android_scan/android_scan.dart';
import '../../features/ios_scan/ios_scan.dart';
import '../../features/linux_scan/linux_scan.dart';
import '../../features/scan_degradation/scan_degradation.dart';
import '../../features/scan_session/android_scan_workbench_session.dart';
import '../../features/scan_session/linux_scan_workbench_session.dart';
import '../../features/scan_session/scan_session_factory.dart';
import '../../features/scan_session/scan_workbench_session.dart';
import '../../features/scan_session/windows_scan_workbench_session.dart';
import '../../features/windows_scan/windows_scan.dart';

/// Workbench mapping from the live session.
ScanDegradation scanDegradationForWorkbench({
  required ScanWorkbenchSession session,
  required bool viewingSnapshot,
}) {
  if (viewingSnapshot) return ScanDegradation.demoFallback;
  if (session is IosWorkbenchScanSession) {
    return switch (session.mode) {
      IosScanMode.connectedOnly => ScanDegradation.iosConnectedOnly,
      IosScanMode.demo => ScanDegradation.demoFallback,
    };
  }
  if (session is AndroidWorkbenchScanSession) {
    return switch (session.mode) {
      AndroidScanMode.throttled => ScanDegradation.androidThrottled,
      AndroidScanMode.demo => ScanDegradation.demoFallback,
      AndroidScanMode.live => ScanDegradation.none,
    };
  }
  if (session is LinuxWorkbenchScanSession) {
    return switch (session.mode) {
      LinuxScanMode.connectedOnly => ScanDegradation.linuxNmLimited,
      LinuxScanMode.demo => ScanDegradation.demoFallback,
      LinuxScanMode.live => ScanDegradation.none,
    };
  }
  if (session is WindowsWorkbenchScanSession) {
    return switch (session.mode) {
      WindowsScanMode.connectedOnly => ScanDegradation.windowsConnectedOnly,
      WindowsScanMode.demo => ScanDegradation.demoFallback,
    };
  }
  return session.demo ? ScanDegradation.demoFallback : ScanDegradation.none;
}
