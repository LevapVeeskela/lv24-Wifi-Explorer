# Flutter mobile & desktop scan — limits and v1 plan

**Status:** Flutter Android / iOS / Linux / Windows adapters are **in-repo**. Electron Windows / Linux remain **demo-only**. This is the honesty / limits note — not a “plugin later” plan.  
**Clean room:** public platform APIs only; no Intuitibits binaries, no private Wi‑Fi stacks, no “monitor mode” theater.

The macOS desktop product keeps **ScanCore** (`native/ScanCore/`) as the sole Swift/CoreWLAN helper. Flutter targets use **in-repo platform adapters** that produce the same _logical_ snapshot shape as `ScanSnapshot` / ScanCore protocol v1, mapped through a shared Dart **`scan_domain`** package (types + mappers; lives with the Flutter app, not inside ScanCore).

Related: [`FLUTTER.md`](FLUTTER.md) (dual-client architecture), [`ARCHITECTURE.md`](ARCHITECTURE.md), [`PERMISSIONS.md`](PERMISSIONS.md), [`packages/core/src/domain/scan.ts`](../packages/core/src/domain/scan.ts), [`native/ScanCore/schema/scan-protocol.v1.json`](../native/ScanCore/schema/scan-protocol.v1.json).

---

## 1. What we are trying to achieve (v1)

| Goal                                                                              | v1 approach                                                                                                   |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Same **table / filters / charts** UX on mobile and Flutter desktop where feasible | Reuse UI against `scan_domain` view models                                                                    |
| **Honest** data sourcing                                                          | Every snapshot carries `source`, permission state, and errors — never imply CoreWLAN-grade active scan on iOS |
| **Demo / fixtures** when live scan is blocked                                     | Same pattern as Electron demo mode ([`PERMISSIONS.md`](PERMISSIONS.md) § demo)                                |
| macOS **full** active scan                                                        | Unchanged: Electron + ScanCore only in this repo                                                              |

**Explicit non-goals for Flutter v1**

- Port ScanCore to iOS/Android or embed it in Flutter.
- Replicate macOS `CWInterface.scanForNetworks(withName:includeHidden:)` on iPhone/iPad.
- NEHotspotHelper, Hotspot Configuration entitlements, or IO80211 private APIs.
- Fake monitor mode, synthetic “spectrum FFT”, or client lists not supported by the OS APIs in use.
- A separate Flutter plugin package for Android / iOS scan (natives are in-app: `AndroidScanBridge` / `IosScanBridge`).
- Electron Windows / Linux live scan — those clients stay on **demo fixtures**; Flutter NM / Windows associated-link are **not** Electron backends.

---

## 2. ScanCore stays macOS-only

```text
lv24-Wifi-Explorer (this repo)
├── native/ScanCore/          ← Swift, CoreWLAN + CoreLocation, JSON Lines
├── electron/                 ← macOS: ScanCore; Windows/Linux: demo fixtures only
├── packages/core/src/domain/ ← TypeScript contract (reference for scan_domain)
├── packages/scan_domain/     ← Dart: ObservedBss, ScanSnapshot, UnsupportedCapability, …
└── flutter/
    ├── lib/features/android_scan/  ← WifiManager + AndroidScanBridge (throttled)
    ├── lib/features/ios_scan/      ← connected-only IosScanBridge (no CoreWLAN scan)
    ├── lib/features/linux_scan/    ← NM GetAccessPoints / connected / demo
    ├── lib/features/windows_scan/  ← associated-link + demo (not a BSS survey)
    └── macOS desktop → scan_core_client → ScanCore (or demo)
```

ScanCore’s **transport, entitlements, and signing story** are documented in [`native/ScanCore/README.md`](../native/ScanCore/README.md). Do not fork ScanCore into an iOS framework “for convenience.”

---

## 3. Shared contract: `scan_domain`

`scan_domain` is the Dart mirror of **`packages/core/src/domain/**`** and the wire fields in **scan protocol v1**, not a second ad‑hoc model.

| TypeScript (reference)  | Dart (`scan_domain`) | Notes                                                               |
| ----------------------- | -------------------- | ------------------------------------------------------------------- |
| `ScanSnapshot`          | `ScanSnapshot`       | `capturedAt`, `networks`, `associated`, `location`, `interfaceName` |
| `ObservedBss`           | `ObservedBss`        | One row = one BSSID on primary channel                              |
| `AssociatedLink`        | `AssociatedLink`     | Current STA link; do not copy link PHY onto arbitrary BSS rows      |
| `LocationAuthorization` | same enum            | Maps OS permission / redaction state                                |
| `ScanError` / codes     | same                 | Include `demoFallback` when falling back to fixtures                |
| `UnsupportedCapability` | same                 | Surface in UI instead of inventing columns                          |

**Snapshot metadata (required on every platform)**

| Field                     | Purpose                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `source`                  | e.g. `scanForNetworks` (macOS ScanCore only), `wifiManagerScanResults`, `connectedNetworkOnly`, `fixtures`, `demo` |
| `location` / privacy gate | Drives redacted SSID/BSSID UX                                                                                      |
| `error`                   | Recoverable vs fatal; triggers demo when appropriate                                                               |
| `scanDurationMs`          | Optional; helps explain Android throttling / iOS “no scan”                                                         |

Mappers live in **`scan_domain`** (and in-repo platform adapters), analogous to `packages/core/src/scan/` in this repo. Renderer/widgets must not parse raw `ScanResult` / `CWNetwork` in the UI layer.

---

## 4. iOS — honest limits

Apple does **not** expose app-store-safe APIs equivalent to macOS CoreWLAN active scanning for third-party apps on iPhone/iPad.

| Capability                                  | iOS v1                                                                                                                                                                                                                                                                                                                                   |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active scan (probe/discover all nearby BSS) | **Not available** without private APIs or special entitlements we do not have                                                                                                                                                                                                                                                            |
| `NEHotspotHelper`                           | **Out of scope** — requires Apple-granted entitlement; **not** present for LV24                                                                                                                                                                                                                                                          |
| Nearby Wi‑Fi list like macOS WiFi Explorer  | **Do not promise** in product copy                                                                                                                                                                                                                                                                                                       |
| **Demo / fixtures**                         | **Yes** — bundled JSON matching `scan_domain` (same idea as `resources/fixtures/`)                                                                                                                                                                                                                                                       |
| **Connected network**                       | **Maybe** — only fields Apple documents for the current association (SSID/BSSID/RSSI/channel/security) via public APIs (e.g. `NEHotspotNetwork`, `CNCopyCurrentNetworkInfo` where still applicable, Captive Network / NetworkExtension patterns). Treat as **best-effort**; gate on Location / Local Network usage strings when required |
| Cached “scan results” for arbitrary APs     | **No** — there is no public `scanForNetworks` analogue                                                                                                                                                                                                                                                                                   |

**v1 iOS (in-repo)** — `IosScanBridge` on channel `dev.lv24.wifi_explorer/ios_scan` (`flutter/ios/Runner/IosScanBridge.swift` + [`flutter/lib/features/ios_scan/`](../flutter/lib/features/ios_scan/)). Factory routes `Platform.isIOS` here. **Cannot** CoreWLAN-scan.

1. **Demo fixtures** when Location is denied or there is no association (`source: demo`, `demoFallback`).
2. **Connected-only** snapshot: public `NEHotspotNetwork.fetchCurrent` plus best-effort `CNCopyCurrentNetworkInfo`; one `AssociatedLink` + at most one `ObservedBss`; `source: connectedNetworkOnly`. These APIs do not provide RSSI.
3. **Location When In Use** for Wi‑Fi identity (not maps); methods `getSnapshot` / `requestLocationAuthorization`.
4. **Import path** remains nice v1.1 (user-supplied scan into `ObservedBss[]`) — no claim that the app performed a nearby scan.
5. **Never** ship: private framework calls, MDM-only APIs, CoreWLAN on iOS, or “enable scan” toggles that do nothing.

**UI expectation:** mobile iOS is a **connected-network inspector + education + demo**, not a roaming site survey tool.

---

## 5. Android — v1 (in-repo, throttled)

Android allows **WifiManager**-driven scans for many devices, with strong **permission** and **throttling** constraints.

| Requirement            | Detail                                                                                                                                                                               |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Permissions            | `ACCESS_FINE_LOCATION` (and/or `ACCESS_COARSE_LOCATION` per target SDK); **`NEARBY_WIFI_DEVICES`** on Android 13+ where applicable for scan without fine location when policy allows |
| Scan API               | `WifiManager.startScan()` + `getScanResults()` (or `ScanResultsCallback` on newer APIs); no root, no monitor mode                                                                    |
| Throttling             | OS limits scan frequency (foreground vs background); app must **back off** (similar spirit to ScanCore `max(3s, duration * 1.1)` but often **slower** in practice)                   |
| Identity               | SSID/BSSID availability depends on API level, location permission, and **location services enabled** on device                                                                       |
| 6 GHz / Wi‑Fi 7 fields | Best-effort from scan result capabilities; mark unknowns — do not invent channel width                                                                                               |

**v1 Android (in-repo)** — `AndroidScanBridge` on channel `dev.lv24.wifi_explorer/android_scan` (`flutter/android/.../AndroidScanBridge.kt` + [`flutter/lib/features/android_scan/`](../flutter/lib/features/android_scan/)). Factory routes `Platform.isAndroid` here. OS throttles `startScan`; `AndroidScanThrottle` uses a **10 s** floor and **30 s+** when throttled (ScanCore-like `duration * 1.1` on top).

1. In-app Kotlin bridge (not a pub plugin): `WifiManager.startScan` / `getScanResults` (or `ScanResultsCallback`) → `source: wifiManagerScanResults`. Channel methods: `getSnapshot`, `requestLocationAuthorization`.
2. Dedupe by BSSID + primary channel (keep stronger RSSI); demo fixtures when the bridge is missing, `WifiManager` is unavailable, or there are no live rows (`demoFallback`).
3. Surface **`SCAN_FAILED` / throttled** as recoverable errors with user-visible “scan limited by Android.”
4. **Connected network**: supplement with `WifiInfo` / `ConnectivityManager` for `AssociatedLink`.
5. No monitor mode, no root, no claiming utilization % without BSS Load IE (same honesty as [`packages/core/src/domain/scan.ts`](../packages/core/src/domain/scan.ts) `UNSUPPORTED_WITHOUT_MONITOR`).

**Not in Android v1:** PCAP, RTT ranging as a fake “client list,” or claiming utilization % without BSS Load IE from scan (same honesty as [`packages/core/src/domain/scan.ts`](../packages/core/src/domain/scan.ts) `UNSUPPORTED_WITHOUT_MONITOR`).

---

## 6. Flutter desktop — Windows and Linux

Flutter desktop runners exist for dogfood; they are **not** the macOS Electron product.

| Platform                       | v1                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Windows**                    | **Connected-network + demo fixtures** via Native Wifi (`WlanQueryInterface`). `WlanGetAvailableNetworkList` is SSID-aggregated (no BSSID/channel/IEs) — not a nearby-BSS survey. No WinRT/MSIX `wifiControl`, monitor mode, or NDIS. |
| **Linux**                      | NetworkManager D-Bus `GetAccessPoints`, connected-network fallback, demo fallback; no `iw`/monitor.                                                                                                                                  |
| **macOS Flutter**              | Not the primary LV24 WiFi Explorer ship vehicle; live path is **`scan_core_client` → ScanCore**, else demo. Do not duplicate CoreWLAN in Dart FFI.                                                                                   |
| **Windows / Linux (Electron)** | **Demo fixtures only.** Flutter NM / Windows associated-link are **not** Electron backends.                                                                                                                                          |

Status strings should match desktop: `ScanCore: demo` / `Scan: demo` / `Scan: throttled` — never “scanning all networks” when the adapter is fixture-only.

---

## 7. Phased delivery (documentation-level roadmap)

| Phase  | Scope                                                                                                                                                                                                     | Repo                                                                                                              |
| ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **P0** | This document + `scan_domain` type parity with `packages/core/src/domain`                                                                                                                                 | In-repo (`packages/scan_domain`)                                                                                  |
| **P1** | Demo/fixture-driven grid on iOS, Android, Win, Linux                                                                                                                                                      | In-repo (`flutter/`)                                                                                              |
| **P2** | Android live `WifiManager` + OS throttle + permission UX                                                                                                                                                  | In-repo (`AndroidScanBridge`, channel `dev.lv24.wifi_explorer/android_scan`, `flutter/lib/features/android_scan`) |
| **P3** | iOS connected-network only (public APIs; **cannot** CoreWLAN-scan)                                                                                                                                        | In-repo (`IosScanBridge`, channel `dev.lv24.wifi_explorer/ios_scan`, `flutter/lib/features/ios_scan`)             |
| **P4** | Linux public NetworkManager D-Bus (`GetAccessPoints` / connected / demo) exists; Windows is associated-link + demo — **not** a BSS survey. Do **not** claim Flutter plugins will add a nearby-BSS survey. | In-repo (`flutter/lib/features/linux_scan`, `flutter/lib/features/windows_scan`)                                  |
| **—**  | Full macOS active scan                                                                                                                                                                                    | **Stays** Electron + ScanCore in **lv24-Wifi-Explorer**                                                           |

**This repo (lv24-Wifi-Explorer):** Android `WifiManager` (throttled), iOS connected-only, Linux NM, and Windows associated-link are in-repo Flutter adapters. **Electron Windows / Linux remain demo-only** — Flutter adapters are not Electron backends. Nearby-BSS / MSIX packaging stay out of v1 — plugins will not turn Windows into a survey. Full macOS active scan stays Electron + ScanCore.

---

## 8. UI honesty checklist (all Flutter targets)

- Show **scan source** in status bar (demo / live / connected-only / import).
- When SSID/BSSID are null, show **permission blocked** state — do not fabricate identifiers.
- Reuse **`UnsupportedCapability`** strings for greyed features (spectrum FFT, client list, monitor mode).
- Do not label channel graphs “spectrum analyzer” unless data comes from a real RF source ([`PARITY-GAP.md`](PARITY-GAP.md)).
- Competitor import formats remain out of scope; `.lv24scan` / internal JSON only.

---

## 9. References (public)

- Apple CoreWLAN (macOS only): [`CWInterface`](https://developer.apple.com/documentation/corewlan/cwinterface) — **not** available on iOS for third-party scan parity.
- Android: [WifiManager](https://developer.android.com/reference/android/net/wifi/WifiManager), [Scan results throttling](https://developer.android.com/guide/topics/connectivity/wifi-scan), [NEARBY_WIFI_DEVICES](https://developer.android.com/about/versions/13/features/nearby-wifi-devices-permission).
- Product parity context: [`docs/research/capability-matrix.md`](research/capability-matrix.md) (import AirPort Utility scan = **Nice**, not live iOS scan).

---

_Last updated: Flutter Android (`AndroidScanBridge` / WifiManager throttle), iOS (`IosScanBridge` / connected-only), Linux NM, and Windows associated-link are in-repo. Electron Windows / Linux stay demo-only._
