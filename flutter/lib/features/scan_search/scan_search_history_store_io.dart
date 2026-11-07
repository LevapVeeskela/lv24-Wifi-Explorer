import 'dart:convert';
import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

import 'scan_search_history.dart';
import 'scan_search_history_storage_key.dart';

bool get _desktop =>
    Platform.isMacOS || Platform.isLinux || Platform.isWindows;

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

Future<File?> _scanSearchHistoryFile() async {
  final dir = await _configDir();
  if (dir == null) return null;
  return File('${dir.path}/$scanSearchHistoryFileName');
}

Future<File?> _legacyScanSearchHistoryFile() async {
  final dir = await _configDir();
  if (dir == null) return null;
  return File('${dir.path}/$scanSearchHistoryLegacyFileName');
}

List<String> _decodeHistory(String? raw) {
  if (raw == null || raw.trim().isEmpty) return const [];
  return scanSearchHistoryFromJson(jsonDecode(raw));
}

Future<List<String>> readScanSearchHistory() async {
  try {
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      return _decodeHistory(prefs.getString(scanSearchHistoryStorageKey));
    }
    final file = await _scanSearchHistoryFile();
    if (file != null && await file.exists()) {
      return _decodeHistory(await file.readAsString());
    }
    final legacy = await _legacyScanSearchHistoryFile();
    if (legacy != null && await legacy.exists()) {
      return _decodeHistory(await legacy.readAsString());
    }
    return const [];
  } catch (_) {
    return const [];
  }
}

Future<void> writeScanSearchHistory(List<String> queries) async {
  try {
    final encoded = jsonEncode(queries);
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(scanSearchHistoryStorageKey, encoded);
      return;
    }
    final file = await _scanSearchHistoryFile();
    if (file == null) return;
    await file.writeAsString(encoded);
  } catch (_) {
    // ignore quota / permission errors
  }
}
