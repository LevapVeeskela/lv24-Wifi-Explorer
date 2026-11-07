import 'theme_preference.dart';

Future<ThemePreference> readStoredThemePreference() async {
  return themePreferenceDefault;
}

Future<void> writeStoredThemePreference(ThemePreference preference) async {}
