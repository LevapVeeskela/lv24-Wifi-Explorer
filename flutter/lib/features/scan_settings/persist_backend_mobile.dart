import 'dart:async';

import 'package:shared_preferences/shared_preferences.dart';

import 'constants.dart';

/// Mobile settings backend: [SharedPreferences] + in-memory cache for sync reads.
class ScanSettingsMobileBackend {
  ScanSettingsMobileBackend._();

  static final ScanSettingsMobileBackend instance = ScanSettingsMobileBackend._();

  static Future<void>? _readyFuture;

  String? _cache;
  SharedPreferences? _prefs;

  String? readSync() => _cache;

  void writeSync(String contents) {
    _cache = contents;
    unawaited(_persist(contents));
  }

  Future<void> ensureReady() {
    return _readyFuture ??= _load();
  }

  Future<void> _load() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      _prefs = prefs;
      _cache = prefs.getString(scanSettingsStorageKey);
    } catch (_) {
      // private mode / unavailable
    }
  }

  Future<void> _persist(String contents) async {
    try {
      await ensureReady();
      final prefs = _prefs;
      if (prefs == null) return;
      await prefs.setString(scanSettingsStorageKey, contents);
    } catch (_) {
      // quota / unavailable
    }
  }
}

Future<void> ensureScanSettingsMobileBackendReady() =>
    ScanSettingsMobileBackend.instance.ensureReady();
