import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/bss_compare/bss_compare.dart';
import 'package:lv24_wifi_explorer/features/scan_session/bss_display.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/types.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:flutter/material.dart';

void main() {
  test('compare selection caps at three and evicts oldest', () {
    final sel = ScanWorkbenchCompareSelection();
    sel.toggle('a');
    sel.toggle('b');
    sel.toggle('c');
    expect(sel.keysInOrder, ['a', 'b', 'c']);
    sel.toggle('d');
    expect(sel.keysInOrder, ['b', 'c', 'd']);
    sel.toggle('c');
    expect(sel.keysInOrder, ['b', 'd']);
  });

  test('buildBssCompareRows marks differing fields', () {
    final networks = bundledDemoObservedBss();
    expect(networks.length, greaterThanOrEqualTo(2));
    final l10n = lookupAppLocalizations(const Locale('en'));
    final rows = buildBssCompareRows(networks.sublist(0, 2), l10n);
    final ssidRow = rows.firstWhere((r) => r.id == 'ssid');
    expect(ssidRow.differs, isTrue);
    final channelRow = rows.firstWhere((r) => r.id == 'channel');
    expect(channelRow.differs, isTrue);
  });

  test('compare signal row follows signalUnit', () {
    final networks = bundledDemoObservedBss();
    final l10n = lookupAppLocalizations(const Locale('en'));
    final pair = networks.sublist(0, 2);

    final percentRows = buildBssCompareRows(pair, l10n);
    final percent = percentRows.firstWhere((r) => r.id == 'signalPct');
    expect(percent.label, l10n.scanDetailsSignalPct);
    expect(percent.values.first, '100%');
    expect(percentRows.any((r) => r.id == 'rssi'), isFalse);

    final dbmRows = buildBssCompareRows(
      pair,
      l10n,
      signalUnit: SignalDisplayUnit.dbm,
    );
    final dbm = dbmRows.firstWhere((r) => r.id == 'rssi');
    expect(dbm.label, l10n.scanSettingsSignalUnitDbm);
    expect(dbm.values.first, '-48 dBm');
    expect(dbmRows.any((r) => r.id == 'signalPct'), isFalse);
  });

  test('resolveCompareNetworks preserves selection order', () {
    final networks = bundledDemoObservedBss();
    final keys = networks.take(3).map(rowKey).toList();
    final resolved = resolveCompareNetworks(networks, keys.reversed.toList());
    expect(resolved.length, 3);
    expect(rowKey(resolved.first), keys.last);
  });
}
