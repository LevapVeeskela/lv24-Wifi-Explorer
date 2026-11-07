import 'package:flutter/material.dart';

/// Chart / spectrum label source (Electron Settings → Advanced).
enum GraphLabelMode {
  ssid,
  apName,
  annotation;

  String get wire => name;

  static GraphLabelMode parse(Object? raw, [GraphLabelMode fallback = ssid]) {
    return switch (raw) {
      'ssid' => ssid,
      'apName' => apName,
      'annotation' => annotation,
      _ => fallback,
    };
  }

  static bool isGraphLabelMode(Object? raw) =>
      raw == 'ssid' || raw == 'apName' || raw == 'annotation';
}

/// Grid / details / chart signal display (Electron Settings → General).
enum SignalDisplayUnit {
  dbm,
  percent;

  String get wire => name;

  static SignalDisplayUnit parse(
    Object? raw, [
    SignalDisplayUnit fallback = percent,
  ]) {
    return switch (raw) {
      'dbm' => dbm,
      'percent' => percent,
      _ => fallback,
    };
  }

  static bool isSignalUnit(Object? raw) => raw == 'dbm' || raw == 'percent';
}

/// Workbench preferences exposed in the scan settings window.
class ScanWorkbenchSettings {
  const ScanWorkbenchSettings({
    required this.scanIntervalSec,
    required this.preferDemo,
    required this.languageCode,
    this.signalUnit = SignalDisplayUnit.percent,
    this.minRssiDbm,
    this.autoStartScanOnLaunch = false,
    this.includeHiddenSsid = true,
    this.hideEmptySpectrumBand = true,
    this.graphLabelMode = GraphLabelMode.ssid,
    this.appearanceFollowSystem = true,
  });

  final int scanIntervalSec;

  /// User preference: demo fixtures vs attempting a live ScanCore session.
  final bool preferDemo;

  /// UI locale (`ru` or `en`).
  final String languageCode;

  /// dBm vs percent on the grid, details, and signal charts.
  final SignalDisplayUnit signalUnit;

  /// Hide rows weaker than this RSSI; `null` means no filter (slider at −95).
  final int? minRssiDbm;

  /// Start the workbench session when the page first loads.
  final bool autoStartScanOnLaunch;

  /// When false, workbench filters omit hidden SSID rows.
  final bool includeHiddenSsid;

  /// When true, occupancy UI omits bands with no live BSS in the scan.
  final bool hideEmptySpectrumBand;

  /// Label source for signal / selected-channel charts.
  final GraphLabelMode graphLabelMode;

  /// When true, [ThemeMode] follows the OS; otherwise the stored light/dark.
  final bool appearanceFollowSystem;

  Locale get locale => Locale(languageCode);

  int get scanIntervalMs => scanIntervalSec * 1000;

  ScanWorkbenchSettings copyWith({
    int? scanIntervalSec,
    bool? preferDemo,
    String? languageCode,
    SignalDisplayUnit? signalUnit,
    int? minRssiDbm,
    bool clearMinRssi = false,
    bool? autoStartScanOnLaunch,
    bool? includeHiddenSsid,
    bool? hideEmptySpectrumBand,
    GraphLabelMode? graphLabelMode,
    bool? appearanceFollowSystem,
  }) {
    return ScanWorkbenchSettings(
      scanIntervalSec: scanIntervalSec ?? this.scanIntervalSec,
      preferDemo: preferDemo ?? this.preferDemo,
      languageCode: languageCode ?? this.languageCode,
      signalUnit: signalUnit ?? this.signalUnit,
      minRssiDbm: clearMinRssi ? null : (minRssiDbm ?? this.minRssiDbm),
      autoStartScanOnLaunch:
          autoStartScanOnLaunch ?? this.autoStartScanOnLaunch,
      includeHiddenSsid: includeHiddenSsid ?? this.includeHiddenSsid,
      hideEmptySpectrumBand:
          hideEmptySpectrumBand ?? this.hideEmptySpectrumBand,
      graphLabelMode: graphLabelMode ?? this.graphLabelMode,
      appearanceFollowSystem:
          appearanceFollowSystem ?? this.appearanceFollowSystem,
    );
  }

  @override
  bool operator ==(Object other) {
    return other is ScanWorkbenchSettings &&
        other.scanIntervalSec == scanIntervalSec &&
        other.preferDemo == preferDemo &&
        other.languageCode == languageCode &&
        other.signalUnit == signalUnit &&
        other.minRssiDbm == minRssiDbm &&
        other.autoStartScanOnLaunch == autoStartScanOnLaunch &&
        other.includeHiddenSsid == includeHiddenSsid &&
        other.hideEmptySpectrumBand == hideEmptySpectrumBand &&
        other.graphLabelMode == graphLabelMode &&
        other.appearanceFollowSystem == appearanceFollowSystem;
  }

  @override
  int get hashCode => Object.hash(
        scanIntervalSec,
        preferDemo,
        languageCode,
        signalUnit,
        minRssiDbm,
        autoStartScanOnLaunch,
        includeHiddenSsid,
        hideEmptySpectrumBand,
        graphLabelMode,
        appearanceFollowSystem,
      );
}

class ScanWorkbenchSettingsStoreV2 {
  const ScanWorkbenchSettingsStoreV2({
    required this.scanIntervalSec,
    required this.preferDemo,
    required this.languageCode,
    required this.signalUnit,
    required this.minRssiDbm,
    required this.autoStartScanOnLaunch,
    required this.includeHiddenSsid,
    required this.hideEmptySpectrumBand,
    required this.graphLabelMode,
    required this.appearanceFollowSystem,
  });

  static const int version = 2;

  final int scanIntervalSec;
  final bool preferDemo;
  final String languageCode;
  final SignalDisplayUnit signalUnit;
  final int? minRssiDbm;
  final bool autoStartScanOnLaunch;
  final bool includeHiddenSsid;
  final bool hideEmptySpectrumBand;
  final GraphLabelMode graphLabelMode;
  final bool appearanceFollowSystem;

  Map<String, Object?> toJson() => {
        'version': version,
        'scanIntervalSec': scanIntervalSec,
        'preferDemo': preferDemo,
        'languageCode': languageCode,
        'signalUnit': signalUnit.wire,
        'minRssiDbm': minRssiDbm,
        'autoStartScanOnLaunch': autoStartScanOnLaunch,
        'includeHiddenSsid': includeHiddenSsid,
        'hideEmptySpectrumBand': hideEmptySpectrumBand,
        'graphLabelMode': graphLabelMode.wire,
        'appearanceFollowSystem': appearanceFollowSystem,
      };

  factory ScanWorkbenchSettingsStoreV2.fromSettings(
    ScanWorkbenchSettings settings,
  ) {
    return ScanWorkbenchSettingsStoreV2(
      scanIntervalSec: settings.scanIntervalSec,
      preferDemo: settings.preferDemo,
      languageCode: settings.languageCode,
      signalUnit: settings.signalUnit,
      minRssiDbm: settings.minRssiDbm,
      autoStartScanOnLaunch: settings.autoStartScanOnLaunch,
      includeHiddenSsid: settings.includeHiddenSsid,
      hideEmptySpectrumBand: settings.hideEmptySpectrumBand,
      graphLabelMode: settings.graphLabelMode,
      appearanceFollowSystem: settings.appearanceFollowSystem,
    );
  }
}
