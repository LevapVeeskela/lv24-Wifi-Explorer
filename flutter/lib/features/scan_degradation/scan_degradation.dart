import 'package:scan_l10n/scan_l10n.dart';

/// Honest scan-limit states shown as a persistent workbench banner.
enum ScanDegradation {
  none,
  demoFallback,
  iosConnectedOnly,
  androidThrottled,
  linuxNmLimited,
  windowsConnectedOnly,
}

/// Maps adapter flags to a banner state.
ScanDegradation scanDegradationFrom({
  required bool demo,
  bool viewingSnapshot = false,
  bool iosConnectedOnly = false,
  bool androidThrottled = false,
  bool linuxConnectedOnly = false,
  bool windowsConnectedOnly = false,
}) {
  if (viewingSnapshot) return ScanDegradation.demoFallback;
  if (iosConnectedOnly) return ScanDegradation.iosConnectedOnly;
  if (androidThrottled) return ScanDegradation.androidThrottled;
  if (linuxConnectedOnly) return ScanDegradation.linuxNmLimited;
  if (windowsConnectedOnly) return ScanDegradation.windowsConnectedOnly;
  if (demo) return ScanDegradation.demoFallback;
  return ScanDegradation.none;
}

({String title, String body}) scanDegradationCopy(
  AppLocalizations l10n,
  ScanDegradation degradation,
) {
  return switch (degradation) {
    ScanDegradation.none => (title: '', body: ''),
    ScanDegradation.demoFallback => (
      title: l10n.scanDegradedDemoTitle,
      body: l10n.scanDegradedDemoBody,
    ),
    ScanDegradation.iosConnectedOnly => (
      title: l10n.scanDegradedIosConnectedOnlyTitle,
      body: l10n.scanDegradedIosConnectedOnlyBody,
    ),
    ScanDegradation.androidThrottled => (
      title: l10n.scanDegradedAndroidThrottledTitle,
      body: l10n.scanDegradedAndroidThrottledBody,
    ),
    ScanDegradation.linuxNmLimited => (
      title: l10n.scanDegradedLinuxNmTitle,
      body: l10n.scanDegradedLinuxNmBody,
    ),
    ScanDegradation.windowsConnectedOnly => (
      title: l10n.scanDegradedWindowsConnectedOnlyTitle,
      body: l10n.scanDegradedWindowsConnectedOnlyBody,
    ),
  };
}
