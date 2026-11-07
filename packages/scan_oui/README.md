# scan_oui

Pure Dart IEEE **MA-L** vendor lookup from a BSSID, using the same bundled [`resources/oui/registry.json`](../../resources/oui/registry.json) as [`src/shared/lib/oui`](../../src/shared/lib/oui/index.ts).

## Behavior

- Parses BSSIDs with `:`, `-`, or `.` separators (case-insensitive).
- **Locally administered** MACs (`U/L` bit set) return `randomized: true` and no vendor.
- Unknown universal prefixes return `vendor: null` and `source: unknown`.
- Successful matches use `meta.source` from the registry (`ieee-mal` or `curated-fallback`).

## Usage

```dart
import 'package:scan_oui/scan_oui.dart';

final registry = OuiRegistry.tryLoad(repoRoot: '/path/to/lv24-Wifi-Explorer');
if (registry == null) {
  // offline / missing registry file
} else {
  final result = registry.lookup('00:17:f2:aa:bb:cc');
  print(result.vendor); // e.g. Apple, Inc.
  print(registry.meta.entryCount);
}
```

Load from a known path:

```dart
final registry = OuiRegistry.fromFile(
  '$repoRoot/resources/oui/registry.json',
);
```

## Tests

From this package directory (or repo root with registry present):

```bash
dart test
```

Integration cases skip automatically when `registry.json` is not found.
