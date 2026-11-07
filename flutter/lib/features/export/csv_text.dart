String escapeCsvField(String value) {
  if (RegExp(r'[",\r\n]').hasMatch(value)) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

String formatCsvCell(Object? value) {
  if (value == null) return '';
  if (value is String) return value;
  if (value is num) {
    if (value is double && !value.isFinite) return '';
    return value.toString();
  }
  if (value is bool) return value ? 'true' : 'false';
  return value.toString();
}

String joinCsv(
  List<String> headers,
  List<List<String>> rows, {
  bool bom = false,
}) {
  final lines = <String>[
    headers.map(escapeCsvField).join(','),
    ...rows.map((cells) => cells.map(escapeCsvField).join(',')),
  ];
  final body = '${lines.join('\n')}\n';
  return bom ? '\uFEFF$body' : body;
}
