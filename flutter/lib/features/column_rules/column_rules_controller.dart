import 'dart:async';

import 'package:flutter/foundation.dart';

import '../annotations/platform_string_storage.dart';
import '../annotations/string_storage.dart';
import 'column_rules_config.dart';
import 'column_rules_constants.dart';
import 'persist.dart';

class ColumnRulesController extends ChangeNotifier {
  ColumnRulesController({StringStorage? storage, bool hydrate = true}) {
    final resolved = storage ?? createPlatformStringStorage();
    _storage = resolved;
    _config = loadColumnRules(storage: resolved);
    if (hydrate && storage == null && !isDesktopConfigPlatform) {
      unawaited(_hydrateFromPlatformStorage());
    } else {
      _hydrated = true;
    }
  }

  StringStorage? _storage;
  ColumnRulesConfig _config = defaultColumnRules;
  bool _hydrated = false;

  bool get hydrated => _hydrated;

  ColumnRulesConfig get config => _config;

  Future<void> _hydrateFromPlatformStorage() async {
    final store = await ensurePlatformStringStorageReady();
    _storage = store;
    _config = loadColumnRules(storage: store);
    _hydrated = true;
    notifyListeners();
  }

  void setConfig(ColumnRulesConfig next) {
    if (_config == next) return;
    _config = next;
    saveColumnRules(_config, storage: _storage);
    notifyListeners();
  }

  void resetToDefaults() {
    setConfig(defaultColumnRules);
  }
}
