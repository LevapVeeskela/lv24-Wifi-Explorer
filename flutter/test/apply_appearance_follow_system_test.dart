import 'package:flutter_test/flutter_test.dart';
import 'package:lv24_wifi_explorer/features/appearance/theme_preference.dart';
import 'package:lv24_wifi_explorer/features/scan_settings/apply_appearance_follow_system.dart';

void main() {
  test('follow system wins over stored light/dark', () {
    expect(
      resolveThemePreference(
        appearanceFollowSystem: true,
        stored: ThemePreference.light,
      ),
      ThemePreference.system,
    );
  });

  test('manual light/dark used when follow is off', () {
    expect(
      resolveThemePreference(
        appearanceFollowSystem: false,
        stored: ThemePreference.light,
      ),
      ThemePreference.light,
    );
    expect(
      resolveThemePreference(
        appearanceFollowSystem: false,
        stored: ThemePreference.dark,
      ),
      ThemePreference.dark,
    );
  });

  test('stored system falls back to dark when follow is off', () {
    expect(
      resolveThemePreference(
        appearanceFollowSystem: false,
        stored: ThemePreference.system,
      ),
      ThemePreference.dark,
    );
  });
}
