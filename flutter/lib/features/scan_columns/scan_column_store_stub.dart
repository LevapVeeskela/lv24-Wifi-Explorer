import 'dart:convert';

import 'scan_column_persistence.dart';
import 'scan_column_storage_key.dart';

/// In-memory fallback when platform file IO is unavailable.
class ScanColumnStore {
  ScanColumnStore();

  String? _json;

  Future<ScanColumnPersistence?> read() async {
    final raw = _json;
    if (raw == null || raw.isEmpty) return null;
    try {
      final decoded = jsonDecode(raw);
      return ScanColumnPersistence.decode(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<void> write(ScanColumnPersistence model) async {
    _json = jsonEncode(model.toJson());
  }

  String get debugLabel => scanColumnStorageKey;
}
