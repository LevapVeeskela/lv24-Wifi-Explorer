import 'dart:io';

import 'package:shared_preferences/shared_preferences.dart';

import 'appearance_keys.dart';
import 'theme_preference.dart';

bool get _desktop =>
    Platform.isMacOS || Platform.isLinux || Platform.isWindows;

Future<File?> _themePreferenceFile() async {
  if (!_desktop) return null;
  final home = Platform.environment['HOME'] ?? Platform.environment['USERPROFILE'];
  if (home == null || home.isEmpty) return null;
  final dir = Directory('$home/.config/lv24-wifi-explorer');
  if (!await dir.exists()) {
    await dir.create(recursive: true);
  }
  return File('${dir.path}/$appearanceThemeStorageKey');
}

Future<ThemePreference> readStoredThemePreference() async {
  try {
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      return themePreferenceFromStorage(prefs.getString(appearanceThemeStorageKey));
    }
    final file = await _themePreferenceFile();
    if (file == null || !await file.exists()) {
      return themePreferenceDefault;
    }
    final raw = (await file.readAsString()).trim();
    return themePreferenceFromStorage(raw);
  } catch (_) {
    return themePreferenceDefault;
  }
}

Future<void> writeStoredThemePreference(ThemePreference preference) async {
  try {
    if (!_desktop) {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(
        appearanceThemeStorageKey,
        themePreferenceToStorage(preference),
      );
      return;
    }
    final file = await _themePreferenceFile();
    if (file == null) return;
    await file.writeAsString(themePreferenceToStorage(preference));
  } catch (_) {
    // ignore quota / permission errors (web private-mode parity)
  }
}
