import 'dart:convert';

import '../annotations/string_storage.dart';
import 'column_rules_config.dart';
import 'column_rules_constants.dart';
import 'column_rules_storage_key.dart';

List<ColumnRulesHighlight> _normalizeHighlights(Object? value) {
  if (value is! List) {
    return List<ColumnRulesHighlight>.from(defaultColumnRules.highlights);
  }
  final next = <ColumnRulesHighlight>[];
  for (final item in value) {
    final parsed = ColumnRulesHighlight.tryParse(item as String?);
    if (parsed != null) next.add(parsed);
  }
  // `[]` is both highlights off — do not substitute defaults.
  return next;
}

ColumnRulesConfig _parseStore(String? raw) {
  if (raw == null || raw.isEmpty) {
    return defaultColumnRules;
  }
  try {
    final parsed = jsonDecode(raw);
    if (parsed is! Map) return defaultColumnRules;
    final map = parsed.cast<Object?, Object?>();
    final enabled = map['enabled'];
    return ColumnRulesConfig(
      enabled: enabled is bool ? enabled : defaultColumnRules.enabled,
      highlights: _normalizeHighlights(map['highlights']),
    );
  } catch (_) {
    return defaultColumnRules;
  }
}

ColumnRulesConfig loadColumnRules({StringStorage? storage}) {
  final store = storage;
  if (store == null) return defaultColumnRules;
  try {
    return _parseStore(store.read(columnRulesStorageKey));
  } catch (_) {
    return defaultColumnRules;
  }
}

void saveColumnRules(ColumnRulesConfig config, {StringStorage? storage}) {
  final store = storage;
  if (store == null) return;
  try {
    final payload = ColumnRulesStoreV1.fromConfig(config).toJson();
    store.write(columnRulesStorageKey, jsonEncode(payload));
  } catch (_) {
    // quota / permissions
  }
}
