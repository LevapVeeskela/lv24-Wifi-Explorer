import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';

import 'string_storage.dart';

/// Mobile key-value storage backed by [SharedPreferences].
class SharedPreferencesStringStorage implements StringStorage {
  SharedPreferencesStringStorage(this._prefs);

  final SharedPreferences _prefs;

  static Future<SharedPreferencesStringStorage> create() async {
    final prefs = await SharedPreferences.getInstance();
    return SharedPreferencesStringStorage(prefs);
  }

  @override
  String? read(String key) => _prefs.getString(key);

  @override
  void write(String key, String value) {
    unawaited(_prefs.setString(key, value));
  }

  @override
  void remove(String key) {
    unawaited(_prefs.remove(key));
  }
}
