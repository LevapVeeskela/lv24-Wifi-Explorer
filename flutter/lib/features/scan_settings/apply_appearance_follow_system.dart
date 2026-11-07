import '../appearance/theme_preference.dart';

/// Resolves Material [ThemePreference] from Settings → Advanced → follow system.
///
/// Matches Electron `resolveThemePreference`: follow-system wins; otherwise the
/// stored light/dark choice (system stored value falls back to dark).
ThemePreference resolveThemePreference({
  required bool appearanceFollowSystem,
  required ThemePreference stored,
}) {
  if (appearanceFollowSystem) return ThemePreference.system;
  if (stored == ThemePreference.system) return ThemePreference.dark;
  return stored;
}
