import 'theme_preference.dart';
import 'theme_preference_store_io.dart'
    if (dart.library.html) 'theme_preference_store_stub.dart';

export 'theme_preference_store_io.dart'
    if (dart.library.html) 'theme_preference_store_stub.dart';

Future<ThemePreference> loadThemePreference() => readStoredThemePreference();

Future<void> persistThemePreference(ThemePreference preference) =>
    writeStoredThemePreference(preference);
