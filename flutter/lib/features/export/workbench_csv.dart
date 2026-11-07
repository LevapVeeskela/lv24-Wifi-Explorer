import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import '../../widgets/scan_grid_display.dart';
import '../scan_issues/compute_issue_keys.dart';
import '../scan_session/bss_display.dart';
import '../scan_settings/signal_unit.dart';
import '../scan_settings/types.dart';
import 'csv_export_scope.dart';
import 'csv_text.dart';

/// Fixed export columns (simple workbench scope; ids match Electron-style headers).
const workbenchCsvColumnIds = [
  'ssid',
  'bssid',
  'rssi',
  'channel',
  'band',
  'security',
  'issues',
];

class WorkbenchCsvBundle {
  const WorkbenchCsvBundle({
    required this.fileName,
    required this.text,
    required this.rowCount,
  });

  final String fileName;
  final String text;
  final int rowCount;
}

String _foldKey(String value) =>
    value.trim().toLowerCase().replaceAll('-', ':');

List<String> _rowMatchKeys(ObservedBss row) {
  final keys = <String>[];
  final bssid = _exportBssid(row);
  if (bssid.isNotEmpty) keys.add(_foldKey(bssid));
  keys.add(_foldKey(rowKey(row)));
  return keys;
}

String _exportBssid(ObservedBss bss) {
  final gated = bss.identity.bssid;
  if (gated is LocationAvailable<String>) {
    final normalized = normalizeBssid(gated.value);
    return normalized ?? gated.value.trim();
  }
  return '';
}

List<ObservedBss> selectCsvRows({
  required CsvExportScope scope,
  required List<ObservedBss> allRows,
  required List<ObservedBss> visibleRows,
  required List<String> selectedIds,
}) {
  switch (scope) {
    case CsvExportScope.visible:
      return List<ObservedBss>.from(visibleRows);
    case CsvExportScope.all:
      return List<ObservedBss>.from(allRows);
    case CsvExportScope.selected:
      final selected = selectedIds.map(_foldKey).where((k) => k.isNotEmpty).toSet();
      if (selected.isEmpty) return [];
      return allRows
          .where((row) => _rowMatchKeys(row).any(selected.contains))
          .toList();
  }
}

String _issuesCell(ObservedBss row, List<ObservedBss> allRows) {
  final keys = computeIssueKeys(row, allRows);
  return keys.join(';');
}

Map<String, Object?> csvCellsForRow(
  ObservedBss row,
  List<ObservedBss> allRows,
  AppLocalizations l10n, {
  SignalDisplayUnit signalUnit = SignalDisplayUnit.percent,
}) {
  return {
    'ssid': ssidGridLabel(row, l10n),
    'bssid': displayBssid(row, l10n),
    'rssi': formatSignalDisplay(row.signal.rssiDbm, signalUnit),
    'channel': row.channel.number,
    'band': displayBand(row.channel.band, l10n),
    'security': displaySecurity(row.security.primary),
    'issues': _issuesCell(row, allRows),
  };
}

WorkbenchCsvBundle buildWorkbenchCsv({
  required CsvExportScope scope,
  required List<ObservedBss> allRows,
  required List<ObservedBss> visibleRows,
  required List<String> selectedIds,
  required AppLocalizations l10n,
  SignalDisplayUnit signalUnit = SignalDisplayUnit.percent,
}) {
  final headers = List<String>.from(workbenchCsvColumnIds);
  final rows = selectCsvRows(
    scope: scope,
    allRows: allRows,
    visibleRows: visibleRows,
    selectedIds: selectedIds,
  );
  final cells = rows.map((row) {
    final map = csvCellsForRow(row, allRows, l10n, signalUnit: signalUnit);
    return headers.map((id) => formatCsvCell(map[id])).toList();
  }).toList();
  return WorkbenchCsvBundle(
    fileName: csvFileName(scope),
    text: joinCsv(headers, cells),
    rowCount: rows.length,
  );
}
