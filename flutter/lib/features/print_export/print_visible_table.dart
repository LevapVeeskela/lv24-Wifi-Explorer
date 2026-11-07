import '../scan_columns/scan_column_id.dart';
import '../scan_columns/scan_column_labels.dart';
import 'build_print_pdf.dart';
import 'format_print_cell.dart';
import 'print_document.dart';
import 'resolve_print_columns.dart';
import 'types.dart';

export 'build_print_html.dart';
export 'print_document.dart' show printExportSupported;
export 'resolve_print_columns.dart';
export 'types.dart';

Future<void> printVisibleTable(PrintVisibleTableRequest request) async {
  if (!printExportSupported) return;

  final visibleIds = [
    for (final id in ScanColumnId.ordered)
      if (request.columnVisibility.isVisible(id)) id.storageKey,
  ];

  final columns = resolvePrintColumns(
    visibleIds,
    (fieldId) {
      final parsed = ScanColumnId.tryParse(fieldId);
      if (parsed != null) return scanColumnLabel(request.l10n, parsed);
      return fieldId;
    },
  );

  if (columns.isEmpty) return;

  final cellContext = PrintCellFormatContext(
    l10n: request.l10n,
    allRows: request.allRows,
    connectedBssid: request.connectedBssid,
    signalUnit: request.signalUnit,
  );

  final pdfBytes = await buildPrintPdfBytes(
    productTitle: request.productTitle,
    rows: request.rows,
    columns: columns,
    cellContext: cellContext,
    printedAt: request.printedAt,
  );

  await printPdfDocument(pdfBytes, request.productTitle);
}
