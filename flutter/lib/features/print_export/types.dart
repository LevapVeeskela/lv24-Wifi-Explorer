import 'package:scan_domain/scan_domain.dart';

import '../../shared/i18n/app_localizations.dart';
import '../scan_columns/scan_column_visibility.dart';
import '../scan_settings/types.dart';

class PrintColumn {
  const PrintColumn({required this.id, required this.label});

  final String id;
  final String label;
}

class PrintBuildResult {
  const PrintBuildResult({
    required this.html,
    required this.rowCount,
    required this.columnCount,
  });

  final String html;
  final int rowCount;
  final int columnCount;
}

class PrintVisibleTableRequest {
  const PrintVisibleTableRequest({
    required this.productTitle,
    required this.rows,
    required this.allRows,
    required this.columnVisibility,
    required this.l10n,
    this.connectedBssid,
    this.signalUnit = SignalDisplayUnit.percent,
    this.printedAt,
  });

  final String productTitle;
  final List<ObservedBss> rows;
  final List<ObservedBss> allRows;
  final ScanColumnVisibility columnVisibility;
  final AppLocalizations l10n;
  final String? connectedBssid;
  final SignalDisplayUnit signalUnit;
  final DateTime? printedAt;
}
