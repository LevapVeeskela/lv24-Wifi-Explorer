import 'dart:io';

import 'config_directory_string_storage.dart';
import 'shared_preferences_string_storage.dart';
import 'string_storage.dart';

bool get isDesktopConfigPlatform =>
    Platform.isMacOS || Platform.isLinux || Platform.isWindows;

SharedPreferencesStringStorage? _mobileStorage;

/// Default persistence for annotations / pin colors (desktop files, mobile prefs).
StringStorage createPlatformStringStorage() {
  if (isDesktopConfigPlatform) {
    return ConfigDirectoryStringStorage();
  }
  final cached = _mobileStorage;
  if (cached != null) return cached;
  return InMemoryStringStorage();
}

Future<StringStorage> ensurePlatformStringStorageReady() async {
  if (isDesktopConfigPlatform) {
    return ConfigDirectoryStringStorage();
  }
  _mobileStorage ??= await SharedPreferencesStringStorage.create();
  return _mobileStorage!;
}
