import 'types.dart';

/// Decorative grid columns omitted from paper output (Electron parity).
const skipPrintFields = {'seriesColor', 'securityLock'};

List<PrintColumn> resolvePrintColumns(
  List<String> visibleColumnIds,
  String Function(String fieldId) labelForField,
) {
  final columns = <PrintColumn>[];
  final seen = <String>{};

  for (final id in visibleColumnIds) {
    if (id.isEmpty || skipPrintFields.contains(id) || seen.contains(id)) {
      continue;
    }
    seen.add(id);
    columns.add(PrintColumn(id: id, label: labelForField(id)));
  }

  return columns;
}
