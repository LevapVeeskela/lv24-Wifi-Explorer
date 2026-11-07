import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

import '../ios_scan/ios_scan_session.dart';
import 'android_scan_workbench_session_stub.dart'
    if (dart.library.io) 'android_scan_workbench_session.dart';
import 'demo_scan_session.dart';
import 'linux_scan_workbench_session_stub.dart'
    if (dart.library.io) 'linux_scan_workbench_session.dart';
import 'scan_workbench_session.dart';
import 'windows_scan_workbench_session_stub.dart'
    if (dart.library.io) 'windows_scan_workbench_session.dart';

/// Platform-default workbench session (iOS/Android/Linux; Windows associated-link + demo, not a BSS survey; else demo).
ScanWorkbenchSession createScanWorkbenchSession({String? repoRoot}) {
  if (!kIsWeb) {
    if (Platform.isIOS) {
      return IosWorkbenchScanSession(repoRoot: repoRoot);
    }
    if (Platform.isAndroid) {
      final android = createAndroidScanWorkbenchSession(repoRoot: repoRoot);
      if (android != null) return android;
    }
    if (Platform.isLinux) {
      final linux = createLinuxScanWorkbenchSession(repoRoot: repoRoot);
      if (linux != null) return linux;
    }
    if (Platform.isWindows) {
      final windows = createWindowsScanWorkbenchSession(repoRoot: repoRoot);
      if (windows != null) return windows;
    }
  }
  return DemoScanSession(repoRoot: repoRoot);
}

/// [IosScanSession] exposed as [ScanWorkbenchSession] without editing ios_scan/.
final class IosWorkbenchScanSession extends IosScanSession
    implements ScanWorkbenchSession {
  IosWorkbenchScanSession({super.repoRoot, super.adapter, super.pollInterval});

  @override
  bool get scanCoreError => !demo && lastError != null;

  @override
  DateTime? get latestRowLastSeenAt => maxLastSeenAtForRows(rows);
}
