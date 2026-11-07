import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';

import 'theme_preference.dart';
import 'theme_preference_store.dart';

/// App-wide theme preference (light / dark / system).
class AppearanceController extends ChangeNotifier {
  AppearanceController({ThemePreference initial = themePreferenceDefault})
      : _preference = initial;

  ThemePreference _preference;
  bool _hydrated = false;

  ThemePreference get preference => _preference;

  ThemeMode get themeMode => themePreferenceToThemeMode(_preference);

  bool get hydrated => _hydrated;

  Future<void> hydrate() async {
    final stored = await loadThemePreference();
    if (_preference != stored) {
      _preference = stored;
    }
    _hydrated = true;
    notifyListeners();
  }

  Future<void> setPreference(ThemePreference next) async {
    if (_preference == next) return;
    _preference = next;
    notifyListeners();
    await persistThemePreference(next);
  }
}
