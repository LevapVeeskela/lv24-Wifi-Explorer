import 'package:scan_l10n/scan_l10n.dart';

import 'constants.dart';
import 'types.dart';

const ScanWorkbenchSettings scanWorkbenchSettingsDefaults =
    ScanWorkbenchSettings(
      scanIntervalSec: 5,
      preferDemo: true,
      languageCode: 'ru',
      signalUnit: SignalDisplayUnit.percent,
      minRssiDbm: null,
      autoStartScanOnLaunch: false,
      includeHiddenSsid: true,
      hideEmptySpectrumBand: true,
      graphLabelMode: GraphLabelMode.ssid,
      appearanceFollowSystem: true,
    );

int snapScanIntervalSec(num raw) {
  final floored = raw.floor().clamp(scanIntervalSecMin, 999);
  var best = scanWorkbenchSettingsDefaults.scanIntervalSec;
  var bestDist = double.infinity;
  for (final option in scanIntervalSecOptions) {
    final dist = (option - floored).abs().toDouble();
    if (dist < bestDist) {
      bestDist = dist;
      best = option;
    }
  }
  return best;
}

String normalizeLanguageCode(Object? raw) {
  if (raw is! String) return scanWorkbenchSettingsDefaults.languageCode;
  final code = raw.trim().toLowerCase().split(RegExp('[-_]')).first;
  if (scanSupportedLocaleCodes.contains(code)) return code;
  return scanWorkbenchSettingsDefaults.languageCode;
}

GraphLabelMode normalizeGraphLabelMode(Object? raw) {
  return GraphLabelMode.parse(
    raw,
    scanWorkbenchSettingsDefaults.graphLabelMode,
  );
}

SignalDisplayUnit normalizeSignalUnit(Object? raw) {
  return SignalDisplayUnit.parse(raw, scanWorkbenchSettingsDefaults.signalUnit);
}

/// Electron `normalizeMinRssi`: missing/invalid/`<= -95` → off (`null`).
int? normalizeMinRssiDbm(Object? value) {
  if (value == null) return null;
  if (value is! num || value.isNaN || value.isInfinite) return null;
  final n = value.round();
  if (n <= minRssiFilterMinDbm) return null;
  return n.clamp(minRssiFilterMinDbm, minRssiFilterMaxDbm);
}

ScanWorkbenchSettings normalizeScanWorkbenchSettings(
  ScanWorkbenchSettings? partial,
) {
  final base = scanWorkbenchSettingsDefaults;
  if (partial == null) return base;
  return ScanWorkbenchSettings(
    scanIntervalSec: snapScanIntervalSec(partial.scanIntervalSec),
    preferDemo: partial.preferDemo,
    languageCode: normalizeLanguageCode(partial.languageCode),
    signalUnit: partial.signalUnit,
    minRssiDbm: normalizeMinRssiDbm(partial.minRssiDbm),
    autoStartScanOnLaunch: partial.autoStartScanOnLaunch,
    includeHiddenSsid: partial.includeHiddenSsid,
    hideEmptySpectrumBand: partial.hideEmptySpectrumBand,
    graphLabelMode: partial.graphLabelMode,
    appearanceFollowSystem: partial.appearanceFollowSystem,
  );
}

bool normalizeBool(Object? raw, bool fallback) {
  return raw is bool ? raw : fallback;
}

ScanWorkbenchSettings normalizeScanWorkbenchSettingsMap(
  Map<String, dynamic>? map,
) {
  if (map == null) return scanWorkbenchSettingsDefaults;
  return normalizeScanWorkbenchSettings(
    ScanWorkbenchSettings(
      scanIntervalSec: map['scanIntervalSec'] is num
          ? (map['scanIntervalSec'] as num).toInt()
          : scanWorkbenchSettingsDefaults.scanIntervalSec,
      preferDemo: map['preferDemo'] is bool
          ? map['preferDemo'] as bool
          : scanWorkbenchSettingsDefaults.preferDemo,
      languageCode:
          map['languageCode']?.toString() ??
          scanWorkbenchSettingsDefaults.languageCode,
      signalUnit: normalizeSignalUnit(map['signalUnit']),
      minRssiDbm: map.containsKey('minRssiDbm')
          ? normalizeMinRssiDbm(map['minRssiDbm'])
          : scanWorkbenchSettingsDefaults.minRssiDbm,
      autoStartScanOnLaunch: normalizeBool(
        map['autoStartScanOnLaunch'],
        scanWorkbenchSettingsDefaults.autoStartScanOnLaunch,
      ),
      includeHiddenSsid: normalizeBool(
        map['includeHiddenSsid'],
        scanWorkbenchSettingsDefaults.includeHiddenSsid,
      ),
      hideEmptySpectrumBand: normalizeBool(
        map['hideEmptySpectrumBand'],
        scanWorkbenchSettingsDefaults.hideEmptySpectrumBand,
      ),
      graphLabelMode: normalizeGraphLabelMode(map['graphLabelMode']),
      appearanceFollowSystem: normalizeBool(
        map['appearanceFollowSystem'],
        scanWorkbenchSettingsDefaults.appearanceFollowSystem,
      ),
    ),
  );
}
