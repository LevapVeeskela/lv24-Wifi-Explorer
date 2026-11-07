import 'dart:io';

import 'string_storage.dart';

/// Desktop ~/.config string values (Electron localStorage parity).
class ConfigDirectoryStringStorage implements StringStorage {
  ConfigDirectoryStringStorage({Directory? configDir}) : _configDir = configDir;

  final Directory? _configDir;

  Directory get _resolved {
    final override = _configDir;
    if (override != null) return override;
    final home = Platform.environment['HOME'] ??
        Platform.environment['USERPROFILE'] ??
        Platform.environment['APPDATA'];
    if (home == null || home.isEmpty) {
      throw StateError('No home directory for config storage');
    }
    return Directory('$home/.config/lv24-wifi-explorer');
  }

  File _fileForKey(String key) => File('${_resolved.path}/$key');

  @override
  String? read(String key) {
    try {
      final file = _fileForKey(key);
      if (!file.existsSync()) return null;
      return file.readAsStringSync();
    } catch (_) {
      return null;
    }
  }

  @override
  void write(String key, String value) {
    try {
      final file = _fileForKey(key);
      file.parent.createSync(recursive: true);
      file.writeAsStringSync(value, flush: true);
    } catch (_) {
      // quota / permissions
    }
  }

  @override
  void remove(String key) {
    try {
      final file = _fileForKey(key);
      if (file.existsSync()) file.deleteSync();
    } catch (_) {
      // ignore
    }
  }
}
