import 'package:scan_domain/scan_domain.dart';

import 'escape_html.dart';
import 'format_print_cell.dart';
import 'types.dart';

const _printStyles = '''
@page { margin: 12mm; }
* { box-sizing: border-box; }
body {
  margin: 0;
  font: 11pt/1.35 system-ui, -apple-system, 'Segoe UI', sans-serif;
  color: #111;
}
h1 {
  font-size: 14pt;
  font-weight: 600;
  margin: 0 0 4pt;
}
.meta {
  color: #444;
  font-size: 9pt;
  margin: 0 0 10pt;
}
table {
  width: 100%;
  border-collapse: collapse;
  font-size: 9pt;
}
th, td {
  border: 1px solid #ccc;
  padding: 3pt 5pt;
  text-align: left;
  vertical-align: top;
  word-break: break-word;
}
th {
  background: #f0f0f0;
  font-weight: 600;
}
td.mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 8.5pt;
}
tbody tr:nth-child(even) td {
  background: #fafafa;
}
@media print {
  body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
''';

String _formatPrintedAt(DateTime when) {
  try {
    return when.toLocal().toString().split('.').first;
  } catch (_) {
    return when.toIso8601String();
  }
}

PrintBuildResult buildPrintHtml({
  required String productTitle,
  required List<ObservedBss> rows,
  required List<PrintColumn> columns,
  required PrintCellFormatContext cellContext,
  DateTime? printedAt,
}) {
  final when = printedAt ?? DateTime.now();
  final headerCells = columns
      .map((column) => '<th scope="col">${escapeHtml(column.label)}</th>')
      .join('');

  final bodyRows = rows.map((row) {
    final cells = columns.map((column) {
      final value = formatPrintCell(row, column.id, cellContext);
      final classAttr = printCellClass(column.id);
      final className = classAttr != null ? ' class="$classAttr"' : '';
      return '<td$className>${escapeHtml(value)}</td>';
    }).join('');
    return '<tr>$cells</tr>';
  }).join('');

  final meta =
      '${rows.length} rows · ${columns.length} columns · ${_formatPrintedAt(when)}';

  final html = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(productTitle)}</title>
  <style>$_printStyles</style>
</head>
<body>
  <h1>${escapeHtml(productTitle)}</h1>
  <p class="meta">${escapeHtml(meta)}</p>
  <table>
    <thead><tr>$headerCells</tr></thead>
    <tbody>$bodyRows</tbody>
  </table>
</body>
</html>''';

  return PrintBuildResult(
    html: html,
    rowCount: rows.length,
    columnCount: columns.length,
  );
}
