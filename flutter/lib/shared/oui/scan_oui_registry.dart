import 'package:flutter/services.dart';
import 'package:scan_oui/scan_oui.dart';

OuiRegistry? _cachedRegistry;
bool _attempted = false;

/// Load the OUI registry from the Flutter asset bundle once.
///
/// Assets work on every platform (macOS/iOS/Android/Linux/Windows/Web);
/// the file-path fallback keeps `flutter test`/dev runs working from the repo.
Future<void> warmUpOuiRegistry({AssetBundle? bundle}) async {
  if (_attempted) return;
  _attempted = true;
  try {
    final raw = await (bundle ?? rootBundle).loadString('assets/oui/registry.json');
    _cachedRegistry = OuiRegistry.fromJsonString(raw);
    return;
  } catch (_) {
    // Fall through to the repo file fallback.
  }
  try {
    _cachedRegistry = OuiRegistry.tryLoad();
  } catch (_) {
    _cachedRegistry = null;
  }
}

/// Lazily resolved registry. Call [warmUpOuiRegistry] before `runApp` for
/// release builds; this getter keeps tests and dev tools working synchronously.
OuiRegistry? scanOuiRegistry() {
  if (!_attempted) {
    _attempted = true;
    try {
      _cachedRegistry = OuiRegistry.tryLoad();
    } catch (_) {
      _cachedRegistry = null;
    }
  }
  return _cachedRegistry;
}
