import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/scan_details/chart_timescale.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/scan_settings.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';

void main() {
  test('signalDisplayToChartUnit maps percent and dbm', () {
    expect(
      signalDisplayToChartUnit(SignalDisplayUnit.percent),
      SignalChartUnit.pct,
    );
    expect(
      signalDisplayToChartUnit(SignalDisplayUnit.dbm),
      SignalChartUnit.dbm,
    );
  });

  test('chartUnitToSignalDisplay round-trips', () {
    expect(
      chartUnitToSignalDisplay(SignalChartUnit.pct),
      SignalDisplayUnit.percent,
    );
    expect(
      chartUnitToSignalDisplay(SignalChartUnit.dbm),
      SignalDisplayUnit.dbm,
    );
  });

  test('formatSignalDisplay uses dBm or percent', () {
    expect(formatSignalDisplay(-75, SignalDisplayUnit.dbm), '-75 dBm');
    expect(formatSignalDisplay(-75, SignalDisplayUnit.percent), '50%');
    expect(formatSignalDisplay(-50, SignalDisplayUnit.percent), '100%');
  });

  test('signalDisplayLabel matches unit', () {
    final l10n = lookupAppLocalizations(const Locale('en'));
    expect(signalDisplayLabel(l10n, SignalDisplayUnit.dbm), 'dBm');
    expect(signalDisplayLabel(l10n, SignalDisplayUnit.percent), 'Signal');
  });
}
