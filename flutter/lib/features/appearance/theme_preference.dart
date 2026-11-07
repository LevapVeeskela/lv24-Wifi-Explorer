import 'package:flutter/material.dart';

/// Stored theme choice; matches web `ThemePreference` (`src/shared/lib/persistence/keys.ts`).
enum ThemePreference {
  light,
  dark,
  system,
}

const themePreferenceDefault = ThemePreference.dark;

ThemePreference themePreferenceFromStorage(String? raw) {
  switch (raw) {
    case 'light':
      return ThemePreference.light;
    case 'dark':
      return ThemePreference.dark;
    case 'system':
      return ThemePreference.system;
    default:
      return themePreferenceDefault;
  }
}

String themePreferenceToStorage(ThemePreference preference) {
  return switch (preference) {
    ThemePreference.light => 'light',
    ThemePreference.dark => 'dark',
    ThemePreference.system => 'system',
  };
}

ThemeMode themePreferenceToThemeMode(ThemePreference preference) {
  return switch (preference) {
    ThemePreference.light => ThemeMode.light,
    ThemePreference.dark => ThemeMode.dark,
    ThemePreference.system => ThemeMode.system,
  };
}

extension ThemePreferenceUi on ThemePreference {
  IconData get icon => switch (this) {
        ThemePreference.light => Icons.light_mode_outlined,
        ThemePreference.dark => Icons.dark_mode_outlined,
        ThemePreference.system => Icons.brightness_auto_outlined,
      };

  String label({required bool ru}) => switch (this) {
        ThemePreference.light => ru ? 'Светлая' : 'Light',
        ThemePreference.dark => ru ? 'Тёмная' : 'Dark',
        ThemePreference.system => ru ? 'Системная' : 'System',
      };
}
