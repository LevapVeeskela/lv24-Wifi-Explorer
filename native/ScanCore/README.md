# ScanCore

Long-lived Swift helper for **LV24 WiFi Explorer**. Clean-room: public **CoreWLAN** + **CoreLocation** only. No airport CLI, no wdutil scan, no IO80211, no monitor mode, no packet capture, no injection.

JSON Lines on **stdout** (`protocolVersion` 1). Loopback TCP / Unix socket are opt-in. Electron owns OUI vendor names; this process emits the OUI prefix only.

## Build

From `native/ScanCore`:

```bash
swift build -c release
```

Binary: `.build/release/ScanCore`

Default `/usr/bin/swift` may be Xcode-selected and license-gated. If `swift --version` fails:

```bash
export DEVELOPER_DIR=/Library/Developer/CommandLineTools
swift build -c release
```

To produce a signed `LSUIElement` bundle (Location usage strings + entitlements):

```bash
./scripts/build.sh
```

That writes `.build/ScanCore.app`. Ad-hoc `codesign` unless `CODESIGN_IDENTITY` is set. A raw `swift build` binary often gets nil BSSID even after the prompt — use the `.app` bundle for live scans.

**macOS 13.5+.** Package.swift declares `.macOS(.v13)`; `Info.plist` sets `LSMinimumSystemVersion` to 13.5.

## Run

```bash
# Demo fixtures (no CoreWLAN / Location)
.build/release/ScanCore --demo --stdio-only

# Same via env
SCANCORE_DEMO=1 .build/release/ScanCore --stdio-only

# Live scan (needs Location When In Use + signed .app for stable BSSID)
.build/ScanCore.app/Contents/MacOS/ScanCore --stdio-only --idle
```

Then write one JSON object per line on stdin:

```text
{"type":"scan:start"}
{"type":"scan:stop"}
{"type":"permissions:query"}
{"type":"demo:enable"}
```

Optional: `{"type":"scan:start","options":{"includeHidden":true}}`.

`--idle` waits for `scan:start`. Without it the helper starts scanning immediately.

Fixture file (used when `--demo` / `SCANCORE_DEMO=1` / `demo:enable`): `resources/fixtures/scan-snapshot.json`. Override with `SCANCORE_FIXTURE=/path/to.json`. If no file is found, a tiny hardcoded LV24 fixture is used. **Do not** point this at WiFi Explorer `demo.bin`.

## Pacing

Time between **scan starts**:

```text
max(3.0, lastDuration * 1.1)
```

`--interval-ms` may raise the floor (minimum still 3 s). Failed/empty cycles still wait at least 3 s.

`scanForNetworks(withName: nil, includeHidden: true)` runs on a background queue.

## Location

When In Use (`requestWhenInUseAuthorization` on macOS 14+; Always request on 13). Usage strings state that **SSID / BSSID are location-class data**. ScanCore does **not** use GPS: coordinates are not read for display, stored, or emitted.

| Status            | Identity fields                         | RF fields              |
|-------------------|-----------------------------------------|------------------------|
| granted           | emitted                                 | emitted                |
| denied            | `ssid` / `bssid` / `oui` **null**       | still emitted          |
| not-determined    | redacted                                | still emitted          |
| restricted        | redacted                                | still emitted          |

Outbound `locationAuthorized` is emitted on start, on TCC change, and on `permissions:query`. Each `scan:snapshot` also has `locationAuthorized`.

## JSON Lines protocol (`protocolVersion: 1`)

Schema: [`schema/scan-protocol.v1.json`](schema/scan-protocol.v1.json).

### Inbound

```json
{"type":"scan:start","options":{"includeHidden":true}}
{"type":"scan:stop"}
{"type":"permissions:query"}
{"type":"demo:enable"}
```

### Outbound

```json
{"type":"hello","protocolVersion":1,"version":"1.0.0","helper":"lv24-wifi-scancore","transport":"stdio"}
{"type":"locationAuthorized","protocolVersion":1,"payload":{"authorized":true,"location":"granted"}}
{"type":"scan:snapshot","protocolVersion":1,"payload":{}}
{"type":"error","protocolVersion":1,"payload":{"code":"SCAN_FAILED","message":"...","recoverable":true}}
```

### Example `scan:snapshot` payload

```json
{
  "snapshotId": "9b3c1e10-4c2a-4f0e-9a11-0f6e2c8d1a22",
  "capturedAt": "2026-09-17T19:57:00.000Z",
  "interfaceName": "en0",
  "countryCode": null,
  "scanDurationMs": 12,
  "stale": false,
  "locationAuthorized": true,
  "results": [
    {
      "id": "02:11:24:00:00:01",
      "ssid": "LV24-Lab-2G",
      "bssid": "02:11:24:00:00:01",
      "rssiDbm": -48,
      "noiseDbm": -92,
      "snrDb": 44,
      "channel": 6,
      "channelWidth": "20MHz",
      "band": "2.4GHz",
      "phyMode": "802.11n",
      "phyModesSupported": ["802.11b", "802.11g", "802.11n"],
      "security": "WPA2 Personal",
      "securityRaw": ["wpa2Personal"],
      "oui": "02:11:24",
      "hidden": false,
      "lastSeenAt": "2026-09-17T19:57:00.000Z",
      "scanGeneration": 1
    }
  ]
}
```

`snrDb` is `rssiDbm - noiseDbm` only when noise is in **−120…−20** dBm and not `0`; otherwise `noiseDbm` and `snrDb` are `null`. PHY comes from `supportsPHYMode:`; security from `supportsSecurity:`. `id` is the BSSID, or a hash of `ssid+channel+band` when BSSID is missing.

Optional extras on the same payload (`location`, `networks` as CoreWlanNetworkRecord, `associated`, `source`) are for the existing Electron mapper. The contract field is **`results`**.

## Signing / TCC

Stable Developer ID + Hardened Runtime on the same Team ID as the Electron app. Bundle id: `com.lv24.wifi-explorer.scancore`.
