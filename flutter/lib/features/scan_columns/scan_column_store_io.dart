import 'dart:convert';
import 'dart:io';

import 'scan_column_persistence.dart';
import 'scan_column_storage_key.dart';

/// File-backed store under the user config directory (desktop-style persistence).
class ScanColumnStore {
  ScanColumnStore({File? file}) : _file = file;

  final File? _file;

  File get _resolved {
    final override = _file;
    if (override != null) return override;
    final home = Platform.environment['HOME'] ??
        Platform.environment['USERPROFILE'] ??
        Platform.environment['APPDATA'];
    if (home == null || home.isEmpty) {
      throw StateError('No home directory for scan column store');
    }
    return File('$home/.config/lv24-wifi-explorer/columns.json');
  }

  Future<ScanColumnPersistence?> read() async {
    try {
      final file = _resolved;
      if (!await file.exists()) return null;
      final raw = await file.readAsString();
      if (raw.trim().isEmpty) return null;
      final decoded = jsonDecode(raw);
      return ScanColumnPersistence.decode(decoded);
    } catch (_) {
      return null;
    }
  }

  Future<void> write(ScanColumnPersistence model) async {
    try {
      final file = _resolved;
      await file.parent.create(recursive: true);
      await file.writeAsString(jsonEncode(model.toJson()));
    } catch (_) {
      // ignore persistence failures
    }
  }

  String get debugLabel => scanColumnStorageKey;
}
