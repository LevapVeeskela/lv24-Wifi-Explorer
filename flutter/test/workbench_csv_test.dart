import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/export/export.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/types.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  late List<ObservedBss> networks;
  late AppLocalizations l10n;

  setUp(() {
    networks = bundledDemoObservedBss();
    l10n = lookupAppLocalizations(const Locale('en'));
  });

  test('buildWorkbenchCsv uses fixed headers and visible rows', () {
    final visible = networks.take(2).toList();
    final bundle = buildWorkbenchCsv(
      scope: CsvExportScope.visible,
      allRows: networks,
      visibleRows: visible,
      selectedIds: const [],
      l10n: l10n,
    );

    expect(bundle.fileName, 'lv24-export-visible.csv');
    expect(bundle.rowCount, 2);
    final header = bundle.text.split('\n').first;
    expect(header, 'ssid,bssid,rssi,channel,band,security,issues');
  });

  test('CsvExportScope.all exports every row', () {
    final bundle = buildWorkbenchCsv(
      scope: CsvExportScope.all,
      allRows: networks,
      visibleRows: networks.take(1).toList(),
      selectedIds: const [],
      l10n: l10n,
    );
    expect(bundle.fileName, 'lv24-export-all.csv');
    expect(bundle.rowCount, networks.length);
  });

  test('CsvExportScope.selected matches BSSID id', () {
    final lab = networks.first;
    final bssid = (lab.identity.bssid as LocationAvailable<String>).value;
    final bundle = buildWorkbenchCsv(
      scope: CsvExportScope.selected,
      allRows: networks,
      visibleRows: networks,
      selectedIds: [bssid],
      l10n: l10n,
    );
    expect(bundle.rowCount, 1);
    expect(bundle.text, contains('LV24-Lab'));
  });

  test('hidden SSID column uses localized label', () {
    final hidden = networks.last;
    final cells = csvCellsForRow(hidden, networks, l10n);
    expect(cells['ssid'], l10n.hiddenSsid);
  });

  test('issues column lists scan.issue keys joined by semicolon', () {
    final guest = networks[1];
    final cells = csvCellsForRow(guest, networks, l10n);
    final issues = cells['issues'] as String;
    expect(issues, isNotEmpty);
    expect(issues.split(';'), everyElement(startsWith('scan.issue.')));
  });

  test('csv rssi cell follows signalUnit', () {
    final lab = networks.first;
    expect(csvCellsForRow(lab, networks, l10n)['rssi'], '100%');
    expect(
      csvCellsForRow(
        lab,
        networks,
        l10n,
        signalUnit: SignalDisplayUnit.dbm,
      )['rssi'],
      '-48 dBm',
    );
  });

  test('selectCsvRows returns empty for selected scope with no ids', () {
    expect(
      selectCsvRows(
        scope: CsvExportScope.selected,
        allRows: networks,
        visibleRows: networks,
        selectedIds: const [],
      ),
      isEmpty,
    );
  });
}
