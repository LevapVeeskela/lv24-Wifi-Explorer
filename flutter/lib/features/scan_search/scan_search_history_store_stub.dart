import 'dart:convert';

import 'scan_search_history.dart';

List<String> _memory = const [];

Future<List<String>> readScanSearchHistory() async {
  return List<String>.from(_memory);
}

Future<void> writeScanSearchHistory(List<String> queries) async {
  _memory = List<String>.from(queries);
}

/// Test hook: seed in-memory history when IO is unavailable.
void debugSeedScanSearchHistoryFromJson(String raw) {
  try {
    _memory = scanSearchHistoryFromJson(jsonDecode(raw));
  } catch (_) {
    _memory = const [];
  }
}
