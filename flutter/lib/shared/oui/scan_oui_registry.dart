import 'package:scan_oui/scan_oui.dart';

OuiRegistry? _cachedRegistry;

/// Lazily loads [resources/oui/registry.json] via [OuiRegistry.tryLoad].
OuiRegistry? scanOuiRegistry() {
  return _cachedRegistry ??= OuiRegistry.tryLoad();
}
