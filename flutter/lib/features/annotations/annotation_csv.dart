import 'annotation_persist.dart';
import 'annotation_rule.dart';

const _headers = ['bssid_pattern', 'text'];

String _escapeField(String value) {
  if (RegExp(r'[",\r\n]').hasMatch(value)) {
    return '"${value.replaceAll('"', '""')}"';
  }
  return value;
}

List<String> _splitCsvLine(String line) {
  final out = <String>[];
  var cur = '';
  var inQuotes = false;
  for (var i = 0; i < line.length; i++) {
    final ch = line[i];
    if (inQuotes) {
      if (ch == '"') {
        if (i + 1 < line.length && line[i + 1] == '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        cur += ch;
      }
    } else if (ch == '"') {
      inQuotes = true;
    } else if (ch == ',') {
      out.add(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  out.add(cur);
  return out;
}

/// Annotation list CSV: headers `bssid_pattern,text`.
String exportAnnotationCsv(List<AnnotationRule> rules) {
  final lines = <String>[
    _headers.join(','),
    for (final r in rules) '${_escapeField(r.bssidPattern)},${_escapeField(r.text)}',
  ];
  return '${lines.join('\n')}\n';
}

List<AnnotationRule> importAnnotationCsv(String text) {
  final lines = text
      .replaceFirst('\uFEFF', '')
      .split(RegExp(r'\r?\n'))
      .where((l) => l.trim().isNotEmpty)
      .toList();
  if (lines.isEmpty) return [];

  final header = _splitCsvLine(lines.first).map((h) => h.trim().toLowerCase()).toList();
  final patternIdx = header.indexOf('bssid_pattern');
  final textIdx = header.indexOf('text');
  final start = patternIdx >= 0 && textIdx >= 0 ? 1 : 0;
  final pCol = patternIdx >= 0 ? patternIdx : 0;
  final tCol = textIdx >= 0 ? textIdx : 1;

  final rules = <AnnotationRule>[];
  for (var i = start; i < lines.length; i++) {
    final cols = _splitCsvLine(lines[i]);
    final pattern = (pCol < cols.length ? cols[pCol] : '').trim();
    final note = tCol < cols.length ? cols[tCol] : '';
    if (pattern.isEmpty) continue;
    rules.add(createAnnotationRule(pattern, note));
  }
  return rules;
}
