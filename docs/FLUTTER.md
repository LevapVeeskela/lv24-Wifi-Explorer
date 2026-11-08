# Flutter client — dual-client architecture

LV24 WiFi Explorer ships **two UI clients** against the same scan contract and domain model. The **Electron desktop** app (macOS-first) remains the primary shipping path for the existing product. The **Flutter** app targets **mobile (iOS, Android)** and **Flutter desktop** (macOS, Windows, Linux) with shared Dart packages and the same `ScanSnapshot` JSON shape as `native/ScanCore`.

**Clean room:** public platform APIs only — CoreWLAN / CoreLocation on macOS, Android `WifiManager` (and related public APIs), iOS capabilities within Apple’s documented limits, Linux **NetworkManager** D-Bus, Windows **Native Wifi** (`wlanapi`). No competitor bundles, private IO80211, monitor mode, NDIS, or deprecated `airport` tooling.

Mobile/desktop scan limits and v1 plan: [`docs/FLUTTER-MOBILE-SCAN.md`](FLUTTER-MOBILE-SCAN.md).

---

## 1. Two clients, one domain

```text
┌──────────────────────────────────────────────────────────────────────────┐
│  Electron (existing)                                                     │
│  Renderer: Yarn + Vite + React + MUI                                     │
│  Main: IPC, OUI attach, ScanCore host, demo/fixture loop                   │
│  See docs/ARCHITECTURE.md                                                │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │  ScanSnapshot JSON (protocolVersion 1)
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│  Shared contract (TypeScript today; Dart packages in repo)                │
│  packages/scan_domain      — ObservedBss, filters, merge rules (parity)    │
│  packages/scan_core_client — JSON Lines client: hello, scan:*, snapshots   │
└───────────────────────────────┬──────────────────────────────────────────┘
                                │
        ┌───────────────────────┼───────────────────────┐
        │                       │                       │
        ▼                       ▼                       ▼
┌───────────────┐     ┌─────────────────┐     ┌─────────────────────────┐
│ flutter/      │     │ native/ScanCore │     │ Platform scan adapters  │
│ Mobile +      │     │ (macOS only)    │     │ (Android / iOS / …)     │
│ Flutter       │     │ Swift helper    │     │ public APIs only        │
│ desktop UI    │     │                 │     │                         │
└───────────────┘     └─────────────────┘     └─────────────────────────┘
```

| Client               | Stack                         | Role                                                                                                                                  |
| -------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Electron desktop** | Yarn 1, Vite, React 19, MUI 9 | macOS (and builder targets); `window.wifiExplorer` IPC; bundles `ScanCore.app`                                                        |
| **Flutter**          | Dart 3, Flutter SDK           | iOS / Android / Flutter desktop; `scan_domain`, `scan_core_client`, `scan_l10n`, `lv24_sunset_theme`; platform-specific scan backends |

Domain types in Electron today live under `packages/core/src/domain/` and `packages/core/src/scan/`; `packages/scan_domain` is the Dart-side mirror for Flutter so grid, filters, and merge behavior stay aligned without copying competitor schemas.

Transport and message types match `native/ScanCore/README.md`: JSON Lines, first line `hello` with `protocolVersion: 1`, inbound `scan:start` / `scan:stop` / permissions / `demo:enable`, outbound `scan:snapshot` with `CoreWlanNetworkRecord[]`-shaped payloads before UI mapping.

---

## 2. Platform matrix (honest capabilities)

| Platform                       | Live scan backend                                                                                                                                                                                                                                                              | Default when live scan unavailable                                       |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **macOS (Electron)**           | `native/ScanCore` (CoreWLAN + CoreLocation)                                                                                                                                                                                                                                    | Demo fixtures (`source: fixtures`, banner **Demo data**) — same as today |
| **macOS (Flutter desktop)**    | Same `ScanCore` via `scan_core_client` (spawn helper, stdio or loopback socket)                                                                                                                                                                                                | Demo fixtures via `--demo` / `demo:enable` or bundled fixture JSON       |
| **Linux (Flutter desktop)**    | NetworkManager D-Bus **`GetAccessPoints`**; **connected-network** when that is all NM exposes                                                                                                                                                                                  | Demo fixtures when NM scan is limited                                    |
| **Windows (Flutter desktop)**  | Native Wifi **associated link** (`WlanQueryInterface`); **not** a nearby-BSS survey                                                                                                                                                                                            | Demo fixtures when there is no association (same honesty as iOS)         |
| **Windows / Linux (Electron)** | No CoreWLAN; platform WLAN APIs are separate future adapters                                                                                                                                                                                                                   | **Demo fixtures** at startup; UI must label non-live data                |
| **Android**                    | Public **`WifiManager`** scan APIs (scan results, throttling, location permission) — **not** equivalent to CoreWLAN richness (BSSID/SSID rules vary by OS version and permission)                                                                                              | Demo fixtures until adapter + permissions are wired                      |
| **iOS**                        | **No full active scan like CoreWLAN.** Apple does not expose a public “scan all nearby APs with full BSS detail” API comparable to macOS. Expect **connected-network** and **NEHotspot**-class surfaces where documented, plus honest UI when only partial RF/SSID data exists | Demo fixtures for development and store review flows                     |

**Labeling:** Reuse the fallback tier mindset from `docs/ARCHITECTURE.md` (full → cached → connected-only → location redaction → demo → future import). Flutter must not imply macOS-class scan on iOS, a nearby-BSS survey on Windows, or live CoreWLAN on desktop without a live adapter.

**Flutter Android scan:** Live data goes through [`flutter/lib/features/android_scan/`](../flutter/lib/features/android_scan/) — public **`WifiManager`** only (`AndroidScanBridge` + Dart adapter). Expect **location** (and **Nearby Wi‑Fi devices** where the OS requires it), Wi‑Fi on, and **OS scan throttling** on `startScan` / results. When native scan is unavailable or there are no live rows, the adapter resolves to **demo fixtures** with the same honest **Demo data** labeling. **Flutter Linux scan:** [`flutter/lib/features/linux_scan/`](../flutter/lib/features/linux_scan/) uses **NetworkManager** D-Bus **`GetAccessPoints`**, **connected-network** when that is all NM exposes, then **demo fixtures**; no **`iw`** or monitor mode. **Flutter Windows scan:** [`flutter/lib/features/windows_scan/`](../flutter/lib/features/windows_scan/) is **connected-network + demo fixtures**, not a nearby-BSS survey. Native Wifi **`WlanQueryInterface`** reports the associated link (SSID, BSSID, documented quality→RSSI, PHY, security; **channel unknown**). **`WlanGetAvailableNetworkList`** is SSID-aggregated (no BSSID/channel/IEs) and only enriches that associated link — it is not workbench rows. Unpackaged Flutter has no MSIX **`wifiControl`**, so WinRT **`WiFiAdapter`** is typically denied and still has no IEs. No association → **demo fixtures** (same honesty as iOS). No monitor mode, NDIS, or private APIs. Factory routes `Platform.isWindows` to this adapter. **Flutter iOS** remains **connected-network-only** (table above); macOS Flutter still uses ScanCore when wired.

### Flutter Windows — what works, what does not, why

|              |                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Works**    | Associated link via public Native Wifi **`WlanQueryInterface`**: SSID, BSSID, documented quality→RSSI (0 → −100 dBm, 100 → −50 dBm), PHY, security. `createScanWorkbenchSession` routes **`Platform.isWindows`** here.                                        |
| **Does not** | Nearby-BSS survey. Channel. IEs. Workbench rows from **`WlanGetAvailableNetworkList`** (SSID-aggregated only). WinRT **`WiFiAdapter`** / MSIX **`wifiControl`**. Monitor mode, NDIS, private APIs.                                                            |
| **Why**      | Those are public-API limits, not a missing ScanCore port. The SSID list cannot identify a BSS. Unpackaged Flutter is not an MSIX package, so `wifiControl` is typically denied — and WinRT still has no IEs. No association is **demo**, same honesty as iOS. |

**macOS 13.5+** for real CoreWLAN scan in ScanCore (unchanged).

---

## 3. Repository layout (Flutter path)

| Path                         | Purpose                                                                                                                     |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `flutter/`                   | Flutter application(s): mobile + desktop runners, UI, platform channels                                                     |
| `packages/scan_domain`       | Pure Dart: BSS/ESS models, filters, merge/stale rules (parity with `packages/core/src/domain/` + `packages/core/src/scan/`) |
| `packages/scan_l10n`         | Scan UI strings: `l10n.yaml` + `lib/core/l10n/app_{ru,en}.arb` (city mobile layout); `ScanL10n` dot-key API for TS parity   |
| `packages/lv24_sunset_theme` | Shared LV24 sunset palette, typography tokens, and `ThemeData` helpers for Flutter UI                                       |
| `packages/scan_core_client`  | Dart: spawn/connect to ScanCore, parse JSON Lines, stream snapshots                                                         |
| `native/ScanCore/`           | Swift helper (macOS); shared with Electron bundle, also used by Flutter on macOS                                            |
| `electron/` + `src/`         | Existing Electron + React client (unchanged ownership)                                                                      |

Electron continues to own OUI attach in main for the desktop app; Flutter should use the same bundled IEEE OUI snapshot pattern as the renderer (`resources/oui/` / registry JSON), not third-party vendor databases.

---

## 4. Flutter UI scope (v1 direction)

- **Parity target:** scan list / grid semantics (one row per `ObservedBss`), filters, signal presentation, demo banner, location banner (denied state: **Open Settings** opens OS app/location settings), permission messaging — not a pixel clone of MUI Data Grid Pro.
- **Dependencies:** Prefer Flutter SDK widgets and community packages with clear licenses. **Do not** assume paid Flutter grid/chart packages; mirror critical behavior in `scan_domain` and simple Flutter layouts unless product explicitly licenses add-ons.
- **Desktop Flutter on macOS:** Prefer `scan_core_client` → `ScanCore.app` for live data; same signing/Location story as Electron (`docs/PERMISSIONS.md`).

**Snapshot files (File menu):** Open and Save use **`.lv24scan`** JSON with the same schema as Electron (`kind`: `lv24.wifi-explorer.scan`, `formatVersion`: 1). **`.wifiexplorer`** (and other third-party extensions) are rejected. When platform file I/O is available, **Open**, **Save**, and **Export CSV** use the native **`file_picker`** plugin; **copy JSON** / **copy CSV** to the clipboard plus optional **path** dialogs are the fallback when the picker is unavailable or a direct write fails. **Export CSV** (visible / selected / all) uses columns `ssid`, `bssid`, `rssi`, `channel`, `band`, `security`, `issues`.

---

## 5. Development entry points

**Electron (unchanged):**

```bash
yarn install
yarn dev
yarn run build:scancore
yarn run dev:electron -- --live
```

**Dart/Flutter workspace** (repo root `pubspec.yaml` lists `packages/scan_domain`, `scan_core_client`, `scan_l10n`, `scan_oui`, `lv24_sunset_theme`, and `flutter/`). Resolve dependencies for every member once:

```bash
# from repository root (Dart 3.6+ / Flutter 3.47+)
dart pub get
# equivalent for Flutter tooling:
flutter pub get
```

After that, run the app from `flutter/` as usual. You can still run `flutter pub get` inside `flutter/`; the root command is preferred when touching multiple packages.

**Flutter** (`flutter/` app + workspace packages above):

```bash
cd flutter && flutter run -d macos
flutter run -d android
flutter run -d ios
flutter run -d linux
flutter run -d windows
```

**Defaults:** demo fixtures at startup (banner **Demo data**), same honest labeling as Electron when no live adapter is connected.

**Live macOS ScanCore:** build/sign the helper and grant Location (`docs/PERMISSIONS.md`); wire via `scan_core_client`. Without that, macOS Flutter runs stay on fixtures.

**Demo Location status:** Bundled fixtures still say `location: granted` so demo rows keep unredacted SSID/BSSID. Flutter `DemoScanSession` does **not** treat that as an OS grant when a live ScanCore helper is not attached — it reports `not-determined` so the existing first-run Location sheet can appear once. Live snapshots replace that with the helper’s real TCC state.

**Live scan (Flutter macOS):** default is still demo fixtures. To use ScanCore:

```bash
yarn run build:scancore
cd flutter && flutter run -d macos --dart-define=LIVE_SCAN=true
```

Or **Settings → Live** (`preferDemo: false`). If the helper is missing or unreachable, the app falls back to fixtures.

**Tooling:** an unaccepted Xcode license can block iOS/macOS builds and even `/usr/bin/git`; prepend Command Line Tools to `PATH` (see root `README.md`) or accept the license in Xcode before `flutter run`.

Build ScanCore before expecting live macOS scans from either client:

```bash
yarn run build:scancore
# or native/ScanCore/scripts/build.sh → .build/ScanCore.app
```

---

## 6. Security and privacy (both clients)

- Scan results stay on device by default; no cloud upload of BSS lists unless product adds an explicit export feature.
- Loopback-only helper transport; token auth on optional TCP/UDS (see ScanCore README).
- Avoid logging raw BSSIDs in analytics; hash or strip in crash logs.

---

## 7. Related docs

- [`docs/FLUTTER-MOBILE-SCAN.md`](FLUTTER-MOBILE-SCAN.md) — mobile/desktop scan limits and v1 plan
- [`docs/ARCHITECTURE.md`](ARCHITECTURE.md) — Electron process model, IPC, fallback tiers
- [`docs/PERMISSIONS.md`](PERMISSIONS.md) — Location and macOS TCC
- [`native/ScanCore/README.md`](../native/ScanCore/README.md) — JSON Lines protocol and build
- [`docs/SPEC.md`](SPEC.md) — Product IA and BSS column model
