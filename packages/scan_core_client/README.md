# scan_core_client

Dart client for the LV24 **ScanCore** helper JSON Lines protocol (`protocolVersion: 1`).

Clean room: public **CoreWLAN + CoreLocation** only — this package spawns or replays data from the existing helper; it does not use private Wi‑Fi APIs, airport, wdutil scan, IO80211, monitor mode, capture, or injection.

## Features

- `ProcessScanCoreClient` — spawn macOS ScanCore (`--stdio-only --idle`), parse stdout JSONL, send stdin commands (`scan:start`, `scan:stop`, `permissions:query`, …).
- `DemoScanClient` — timer replay of `resources/fixtures/` (Meridia / LV24 demo SSIDs only).
- Wire DTOs (`ScanSnapshotDto`, `CoreWlanNetworkRecordDto`) with a TODO bridge to `packages/scan_domain` as BSS types land there.

## Usage

```dart
import 'package:scan_core_client/scan_core_client.dart';

final client = ProcessScanCoreClient(repoRoot: '/path/to/lv24-Wifi-Explorer');
client.events.listen((event) {
  switch (event) {
    case ScanCoreSnapshotEvent(:final snapshot):
      print('${snapshot.networks.length} networks');
    case ScanCorePermissionsStatus(:final location):
      print('location: $location');
    default:
      break;
  }
});
await client.start();
// …
await client.stop();
```

Demo / offline:

```dart
final demo = DemoScanClient(repoRoot: repoRoot);
await demo.start();
```

## Protocol reference

- `native/ScanCore/README.md`
- `native/ScanCore/schema/scan-protocol.v1.json`
- `electron/scan/scanCoreClient.ts`

## Tests

```bash
cd packages/scan_core_client
dart pub get
dart test
```
