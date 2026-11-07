import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/print_export/build_print_html.dart';
import 'package:lv24_wifi_explorer/features/print_export/escape_html.dart';
import 'package:lv24_wifi_explorer/features/print_export/format_print_cell.dart';
import 'package:lv24_wifi_explorer/features/print_export/resolve_print_columns.dart';
import 'package:lv24_wifi_explorer/features/print_export/types.dart';
import 'package:lv24_wifi_explorer/features/scan_filters/scan_filters.dart';
import 'package:lv24_wifi_explorer/features/scan_search/scan_search.dart';
import 'package:lv24_wifi_explorer/features/scan_session/demo_networks.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/types.dart';
import 'package:lv24_wifi_explorer/shared/i18n/app_localizations.dart';
import 'package:scan_domain/scan_domain.dart';

void main() {
  test('resolvePrintColumns drops decorative columns', () {
    final columns = resolvePrintColumns(
      ['seriesColor', 'bssid', 'ssid', 'securityLock', 'channel'],
      (id) => id,
    );
    expect(columns.map((c) => c.id).toList(), ['bssid', 'ssid', 'channel']);
  });

  test('escapeHtml neutralizes markup', () {
    expect(escapeHtml('<Campus>'), '&lt;Campus&gt;');
  });

  test('buildPrintHtml embeds table metadata and headers', () {
    TestWidgetsFlutterBinding.ensureInitialized();
    final networks = bundledDemoObservedBss();
    final l10n = lookupAppLocalizations(const Locale('en'));

    final result = buildPrintHtml(
      productTitle: 'LV24 WiFi Explorer',
      rows: [networks.first],
      columns: const [
        PrintColumn(id: 'bssid', label: 'BSSID'),
        PrintColumn(id: 'ssid', label: 'SSID'),
      ],
      cellContext: PrintCellFormatContext(l10n: l10n, allRows: networks),
      printedAt: DateTime.utc(2026, 1, 15, 12),
    );

    expect(result.rowCount, 1);
    expect(result.columnCount, 2);
    expect(result.html, contains('LV24 WiFi Explorer'));
    expect(result.html, contains('<table>'));
    expect(result.html, contains('1 rows · 2 columns'));
  });

  test('print rows follow annotation-aware applyScanFilters', () {
    TestWidgetsFlutterBinding.ensureInitialized();
    final networks = bundledDemoObservedBss();
    final l10n = lookupAppLocalizations(const Locale('en'));
    const filters = ScanWorkbenchFilters(searchQuery: 'lab-ap');

    ScanSearchMatchContext contextFor(ObservedBss row) {
      if (row.lastRaw.ssid == 'LV24-Lab') {
        return const ScanSearchMatchContext(annotation: 'lab-ap-01');
      }
      return const ScanSearchMatchContext();
    }

    final withoutNotes = applyScanFilters(networks, filters);
    final visibleLikeGrid = applyScanFilters(
      networks,
      filters,
      searchContext: contextFor,
    );

    expect(withoutNotes, isEmpty);
    expect(visibleLikeGrid.single.lastRaw.ssid, 'LV24-Lab');

    final result = buildPrintHtml(
      productTitle: 'LV24 WiFi Explorer',
      rows: visibleLikeGrid,
      columns: const [PrintColumn(id: 'ssid', label: 'SSID')],
      cellContext: PrintCellFormatContext(l10n: l10n, allRows: networks),
    );

    expect(result.rowCount, 1);
    expect(result.html, contains('LV24-Lab'));
  });

  test('formatPrintCell rssi follows signalUnit', () {
    final networks = bundledDemoObservedBss();
    final l10n = lookupAppLocalizations(const Locale('en'));
    final row = networks.first;
    final percent = PrintCellFormatContext(l10n: l10n, allRows: networks);
    final dbm = PrintCellFormatContext(
      l10n: l10n,
      allRows: networks,
      signalUnit: SignalDisplayUnit.dbm,
    );

    expect(formatPrintCell(row, 'rssi', percent), '100%');
    expect(formatPrintCell(row, 'rssi', dbm), '-48 dBm');
  });
}
