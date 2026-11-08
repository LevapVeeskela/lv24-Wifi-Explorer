# Permissions, signing, and demo mode

macOS treats **Wi‑Fi network identity** (SSID, BSSID, country) as location-related. LV24 WiFi Explorer uses **When In Use** Location only to unlock CoreWLAN identity fields — not for maps or continuous GPS tracking.

---

## 1. Location (TCC)

### 1.1 What requires Location

| Data                                   | Without authorization              | With `granted`                 |
| -------------------------------------- | ---------------------------------- | ------------------------------ |
| SSID, BSSID, `ssidData`, `countryCode` | `null` / redacted in ScanCore JSON | Emitted when CoreWLAN provides |
| RSSI, noise, channel, security probes  | Usually still available            | Available                      |
| Associated toolbar SSID                | Redacted                           | Shown                          |

ScanCore `LocationGate` calls `requestWhenInUseAuthorization` (macOS 14+ pattern; Always request on older macOS where applicable).

### 1.2 Usage strings

Must state **Wi‑Fi network identity**, not map tracking:

- `NSLocationWhenInUseUsageDescription` in app + ScanCore `Info.plist`
- Copy: user-facing explanation that SSID/BSSID need Location Services

Plist sources: `electron-builder.yml`, ScanCore bundle.

### 1.3 User checklist

1. **System Settings → Privacy & Security → Location Services** — ON globally.
2. **LV24 WiFi Explorer** (and ScanCore when run standalone) — checkbox enabled.
3. Relaunch app after changing TCC (macOS caches decisions).

In-app: IPC `permissions:openSettings` opens `Privacy_LocationServices`.

Flutter denied-sheet **Open Settings** (best-effort, fail soft):

| Host    | Command / API                                                                                                                     |
| ------- | --------------------------------------------------------------------------------------------------------------------------------- |
| macOS   | `x-apple.systempreferences:com.apple.preference.security?Privacy_LocationServices`                                                |
| iOS     | `AppSettings.openAppSettings(type: settings)`                                                                                     |
| Android | `AppSettings.openAppSettings(type: location)`                                                                                     |
| Linux   | `gnome-control-center wifi` → `gnome-control-center privacy` → `systemsettings` → `nm-connection-editor` → `xdg-open settings://` |
| Windows | `ms-settings:network-wifi` → `ms-settings:privacy-location`                                                                       |

### 1.4 Authorization states

| `location`       | UI expectation                                 |
| ---------------- | ---------------------------------------------- |
| `granted`        | Full identity columns                          |
| `denied`         | Redacted SSID/BSSID; onboarding / blocked view |
| `not-determined` | Prompt on first scan                           |
| `restricted`     | MDM/profile block; demo or RF-only             |

`permissions:status` pushed on start, TCC change, and with snapshots.

---

## 2. Entitlements

| Entitlement                                        | Purpose                                             |
| -------------------------------------------------- | --------------------------------------------------- |
| `com.apple.security.personal-information.location` | Location for SSID/BSSID (sandbox / hardened builds) |

ScanCore bundle id: `com.lv24.wifi-explorer.scancore`  
App id: `by.lv24.wifi.explorer`

**Not in v1:** monitor mode, packet capture, private Wi‑Fi entitlements, `NSLocalNetworkUsageDescription` (reserved for future sensors).

---

## 3. Code signing

### 3.1 Production (real scan)

- **Developer ID** + **Hardened Runtime**
- Same **Team ID** for Electron app and `ScanCore.app`
- **Notarize** for distribution outside Mac App Store

Stable signing identity matters: ad-hoc or changing cert → TCC treats app as new → BSSID often stays `nil` even after user allows Location.

### 3.2 Development

| Build                      | Typical behavior                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Unsigned / ad-hoc ScanCore | `BSSID_UNAVAILABLE` → **demo fallback**                                                                                               |
| `yarn dev` default         | Live scan; demo only with `--demo` / `WIFI_EXPLORER_DEMO=1`. Missing/failed helper falls back to fixtures with an explicit demo badge |
| Local Swift build          | `native/ScanCore/scripts/build.sh`; optional `CODESIGN_IDENTITY`                                                                      |

ScanCore README: ad-hoc `codesign` when no Developer ID is set.

---

## 4. Unsigned = demo

Policy for engineers and CI:

- Missing helper binary, `--demo`, ScanCore `demoFallback: true`, or helper crash → **fixture loop** (`source: 'fixtures'`, `demo: true`).
- Renderer shows demo banner; `scanCoreState: 'demo'`.
- **Do not** pretend unsigned builds are production-accurate for BSSID/SSID.

Opt into live path locally:

```bash
yarn build:scancore
# signed helper in bundle or .build path
yarn dev:electron -- --demo   # opt-in demo; omit for live
# or WIFI_EXPLORER_DEMO=0
```

---

## 5. Privacy copy (product)

- SSID/BSSID are sensitive identifiers; minimize retention (session + user-controlled `.lv24scan`).
- No default cloud sync of scan results.
- OUI database: offline bundle; optional signed update channel later.

---

## 6. Platform constraints

- Scan runs in **logged-in Aqua session** (not headless daemon).
- Minimum macOS: **13.5+** recommended (Ventura); test Location on target OS.
- Wi‑Fi must be powered; external USB NICs out of scope v1.

---

## 7. Flutter Windows (Native Wifi)

Windows Flutter v1 is **connected-network + demo fixtures**, not a nearby-BSS survey. Public **Native Wifi** (`wlanapi`) only. This path is **unpackaged Flutter** — no MSIX **`wifiControl`**.

| Data                          | No association / access denied          | Associated via `WlanQueryInterface`                                                                              |
| ----------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| SSID, BSSID, PHY, security    | **Demo fixtures** (same honesty as iOS) | Emitted when Native Wifi provides them                                                                           |
| RSSI                          | Demo fixtures                           | Documented quality→RSSI (0 → −100 dBm, 100 → −50 dBm), not a radio-measured RSSI                                 |
| Channel, IEs, nearby BSS rows | Not available                           | Still not available — `WlanGetAvailableNetworkList` is SSID-aggregated and is **not** promoted to workbench rows |

**Location:** the OS may still prompt for Wi‑Fi identity. Granting it does **not** unlock a nearby-BSS survey.

**Not in v1:** MSIX packaging / `wifiControl`, WinRT `WiFiAdapter`, monitor mode, NDIS, private APIs.

Factory: `createScanWorkbenchSession` routes `Platform.isWindows` to [`flutter/lib/features/windows_scan/`](../flutter/lib/features/windows_scan/).

## macOS helper signing (real SSID/BSSID)

`ScanCore.app` must be signed with a stable Apple Development or Developer ID
identity. Ad-hoc signed helpers are rejected by TCC: CoreWLAN still returns
RSSI/channel but redacts SSID/BSSID, and the app labels those rows as redacted
(not “hidden”). `yarn build:scancore` auto-selects the first code-signing
identity; override with `CODESIGN_IDENTITY="Apple Development: …"`. Approve the
one-time Location prompt for `ScanCore` in System Settings → Privacy & Security
→ Location Services. The helper is launched through LaunchServices and talks
JSON Lines over a private Unix socket, so TCC tracks its stable signature.
