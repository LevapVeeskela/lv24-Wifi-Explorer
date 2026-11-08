import 'dart:async';
import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

bool get _desktop => Platform.isMacOS || Platform.isLinux || Platform.isWindows;

Future<Directory?> _configDir() async {
  if (!_desktop) return null;
  final home =
      Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'];
  if (home == null || home.isEmpty) return null;
  final dir = Directory('$home/.config/lv24-wifi-explorer');
  if (!await dir.exists()) {
    await dir.create(recursive: true);
  }
  return dir;
}

Future<File?> _prefFile(String key) async {
  final dir = await _configDir();
  if (dir == null) return null;
  return File('${dir.path}/$key');
}

/// Desktop: JSON/file in the shared config dir. Mobile/web: SharedPreferences.
Future<String?> readWorkbenchPrefIo(String key) async {
  try {
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(key);
    }
    final file = await _prefFile(key);
    if (file != null && await file.exists()) {
      return await file.readAsString();
    }
    return null;
  } catch (_) {
    return null;
  }
}

Future<void> writeWorkbenchPrefIo(String key, String value) async {
  try {
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(key, value);
      return;
    }
    final file = await _prefFile(key);
    if (file == null) return;
    await file.writeAsString(value, flush: true);
  } catch (_) {
    // quota / permissions
  }
}

/// Kept for symmetry with the scan-settings backend API.
void unawaitedWrite(Future<void> future) => unawaited(future);
