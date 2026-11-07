import 'dart:typed_data';

import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:scan_domain/scan_domain.dart';

import 'format_print_cell.dart';
import 'types.dart';

String _formatPrintedAt(DateTime when) {
  try {
    return when.toLocal().toString().split('.').first;
  } catch (_) {
    return when.toIso8601String();
  }
}

Future<Uint8List> buildPrintPdfBytes({
  required String productTitle,
  required List<ObservedBss> rows,
  required List<PrintColumn> columns,
  required PrintCellFormatContext cellContext,
  DateTime? printedAt,
  PdfPageFormat? pageFormat,
}) async {
  final format = pageFormat ?? PdfPageFormat.a4.landscape;
  final when = printedAt ?? DateTime.now();
  final meta =
      '${rows.length} rows · ${columns.length} columns · ${_formatPrintedAt(when)}';

  final doc = pw.Document();
  final headerStyle = pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9);
  final cellStyle = pw.TextStyle(fontSize: 8.5);
  final monoStyle = pw.TextStyle(fontSize: 8, font: pw.Font.courier());

  doc.addPage(
    pw.MultiPage(
      pageFormat: format,
      margin: const pw.EdgeInsets.all(24),
      build: (context) {
        return [
          pw.Text(productTitle, style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
          pw.SizedBox(height: 4),
          pw.Text(meta, style: pw.TextStyle(fontSize: 9, color: PdfColors.grey700)),
          pw.SizedBox(height: 12),
          pw.Table(
            border: pw.TableBorder.all(color: PdfColors.grey400, width: 0.5),
            columnWidths: {
              for (var i = 0; i < columns.length; i++)
                i: const pw.FlexColumnWidth(),
            },
            children: [
              pw.TableRow(
                decoration: const pw.BoxDecoration(color: PdfColors.grey300),
                children: [
                  for (final column in columns)
                    pw.Padding(
                      padding: const pw.EdgeInsets.all(4),
                      child: pw.Text(column.label, style: headerStyle),
                    ),
                ],
              ),
              for (var rowIndex = 0; rowIndex < rows.length; rowIndex++)
                pw.TableRow(
                  decoration: rowIndex.isOdd
                      ? const pw.BoxDecoration(color: PdfColors.grey100)
                      : null,
                  children: [
                    for (final column in columns)
                      pw.Padding(
                        padding: const pw.EdgeInsets.all(4),
                        child: pw.Text(
                          formatPrintCell(rows[rowIndex], column.id, cellContext),
                          style: column.id == 'bssid' ? monoStyle : cellStyle,
                        ),
                      ),
                  ],
                ),
            ],
          ),
        ];
      },
    ),
  );

  return doc.save();
}
