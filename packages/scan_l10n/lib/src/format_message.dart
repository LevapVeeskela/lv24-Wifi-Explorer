/// Replaces `{name}` placeholders (same convention as `src/shared/i18n`).
String formatScanMessage(String template, [Map<String, Object>? values]) {
  if (values == null || values.isEmpty) return template;
  var out = template;
  for (final entry in values.entries) {
    out = out.replaceAll('{${entry.key}}', '${entry.value}');
  }
  return out;
}
