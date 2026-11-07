import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/scan_settings.dart';

void main() {
  setUp(debugUseMemoryScanSettingsBackend);
  tearDown(debugResetScanSettingsPersistence);

  test('defaults include Electron appearance / graph / signal keys', () {
    expect(scanWorkbenchSettingsDefaults.appearanceFollowSystem, isTrue);
    expect(scanWorkbenchSettingsDefaults.graphLabelMode, GraphLabelMode.ssid);
    expect(scanWorkbenchSettingsDefaults.hideEmptySpectrumBand, isTrue);
    expect(scanWorkbenchSettingsDefaults.includeHiddenSsid, isTrue);
    expect(scanWorkbenchSettingsDefaults.preferDemo, isTrue);
    expect(scanWorkbenchSettingsDefaults.scanIntervalSec, 5);
    expect(scanWorkbenchSettingsDefaults.signalUnit, SignalDisplayUnit.percent);
    expect(scanWorkbenchSettingsDefaults.minRssiDbm, isNull);
    expect(scanWorkbenchSettingsDefaults.autoStartScanOnLaunch, isFalse);
  });

  test('normalize map fills missing keys from defaults', () {
    final settings = normalizeScanWorkbenchSettingsMap({
      'scanIntervalSec': 10,
      'preferDemo': false,
      'languageCode': 'en',
    });
    expect(settings.scanIntervalSec, 10);
    expect(settings.preferDemo, isFalse);
    expect(settings.graphLabelMode, GraphLabelMode.ssid);
    expect(settings.appearanceFollowSystem, isTrue);
    expect(settings.includeHiddenSsid, isTrue);
    expect(settings.hideEmptySpectrumBand, isTrue);
    expect(settings.signalUnit, SignalDisplayUnit.percent);
    expect(settings.minRssiDbm, isNull);
    expect(settings.autoStartScanOnLaunch, isFalse);
  });

  test('normalize snaps interval and graphLabelMode', () {
    final settings = normalizeScanWorkbenchSettingsMap({
      'scanIntervalSec': 7,
      'graphLabelMode': 'apName',
      'appearanceFollowSystem': false,
      'includeHiddenSsid': false,
      'hideEmptySpectrumBand': false,
    });
    expect(settings.scanIntervalSec, 5);
    expect(settings.graphLabelMode, GraphLabelMode.apName);
    expect(settings.appearanceFollowSystem, isFalse);
    expect(settings.includeHiddenSsid, isFalse);
    expect(settings.hideEmptySpectrumBand, isFalse);
  });

  test('normalize treats minRssi at or below -95 as off', () {
    expect(normalizeMinRssiDbm(-95), isNull);
    expect(normalizeMinRssiDbm(-100), isNull);
    expect(normalizeMinRssiDbm(-72), -72);
    expect(normalizeMinRssiDbm(-39), -40);
    expect(
      normalizeScanWorkbenchSettingsMap({'minRssiDbm': -95}).minRssiDbm,
      isNull,
    );
  });

  test('normalize rejects invalid signalUnit', () {
    expect(
      normalizeScanWorkbenchSettingsMap({'signalUnit': 'watts'}).signalUnit,
      SignalDisplayUnit.percent,
    );
    expect(
      normalizeScanWorkbenchSettingsMap({'signalUnit': 'dbm'}).signalUnit,
      SignalDisplayUnit.dbm,
    );
  });

  test('round-trips new keys through persist', () {
    saveScanWorkbenchSettings(
      const ScanWorkbenchSettings(
        scanIntervalSec: 15,
        preferDemo: false,
        languageCode: 'en',
        signalUnit: SignalDisplayUnit.dbm,
        minRssiDbm: -72,
        autoStartScanOnLaunch: true,
        includeHiddenSsid: false,
        hideEmptySpectrumBand: false,
        graphLabelMode: GraphLabelMode.annotation,
        appearanceFollowSystem: false,
      ),
    );
    final loaded = loadScanWorkbenchSettings();
    expect(loaded.scanIntervalSec, 15);
    expect(loaded.preferDemo, isFalse);
    expect(loaded.languageCode, 'en');
    expect(loaded.signalUnit, SignalDisplayUnit.dbm);
    expect(loaded.minRssiDbm, -72);
    expect(loaded.autoStartScanOnLaunch, isTrue);
    expect(loaded.includeHiddenSsid, isFalse);
    expect(loaded.hideEmptySpectrumBand, isFalse);
    expect(loaded.graphLabelMode, GraphLabelMode.annotation);
    expect(loaded.appearanceFollowSystem, isFalse);
  });

  test('Electron v1 store maps interval, appearance, and signal keys', () {
    final loaded = parseScanWorkbenchSettingsPayload(
      jsonEncode({
        'version': 1,
        'signalUnit': 'dbm',
        'minRssiDbm': -80,
        'autoStartScanOnLaunch': true,
        'scanIntervalSec': 3,
        'includeHiddenSsid': false,
        'hideEmptySpectrumBand': false,
        'graphLabelMode': 'apName',
        'appearanceFollowSystem': false,
      }),
    );
    expect(loaded.scanIntervalSec, 3);
    expect(loaded.signalUnit, SignalDisplayUnit.dbm);
    expect(loaded.minRssiDbm, -80);
    expect(loaded.autoStartScanOnLaunch, isTrue);
    expect(loaded.includeHiddenSsid, isFalse);
    expect(loaded.hideEmptySpectrumBand, isFalse);
    expect(loaded.graphLabelMode, GraphLabelMode.apName);
    expect(loaded.appearanceFollowSystem, isFalse);
    expect(loaded.preferDemo, isTrue);
  });
}
