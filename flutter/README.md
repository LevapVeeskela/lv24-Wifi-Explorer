# LV24 WiFi Explorer (Flutter)

Material 3 client for **mobile and desktop**. The first screen is a scan workbench that plays **demo fixtures** so the UI runs without native Wi‑Fi scan or a signed ScanCore helper.

Shared Dart packages (repo root):

- `../packages/scan_domain` — BSS / signal / channel types
- `../packages/scan_core_client` — ScanCore JSON Lines client + `DemoScanClient`

Web is not generated; Wi‑Fi APIs are not useful there.

## Prerequisites

- Flutter **3.47+** (Dart 3.13+) on `PATH`
- Accept the **Xcode license** on this Mac (`sudo xcodebuild -license`) before iOS/macOS builds. Homebrew `git`/`python3` from Xcode CLT will also fail until that is done.
- For a **live** macOS scan later: signed ScanCore + Location (see `docs/PERMISSIONS.md`). Unsigned / ad-hoc builds stay on demo data.

## Run — desktop

From the **repository root**, resolve all workspace packages once (`pubspec.yaml` at repo root lists `packages/*` + `flutter/`):

```bash
dart pub get   # or: flutter pub get
```

Then run from this folder:

```bash
cd flutter
flutter run -d macos
```

Other desktops:

```bash
flutter run -d windows
flutter run -d linux
```

**Windows:** associated link via Native Wifi (`WlanQueryInterface`); no association → demo fixtures (not a nearby-BSS survey). **Linux:** NetworkManager `GetAccessPoints`, then connected-network / demo; no `iw`/monitor.

List devices: `flutter devices`.

## Run — mobile

```bash
cd flutter
flutter pub get
flutter run                 # picks a connected device / simulator
flutter run -d android
flutter run -d ios
```

iOS/Android start on **demo fixtures**. Apple does not expose a CoreWLAN-class public scan API on iPhone; Android can later use public `WifiManager` APIs plus location / nearby-Wi‑Fi permissions already declared in the manifest.

## Locales

Default **Russian**, English via `flutter_localizations` + gen-l10n (`lib/shared/i18n/app_ru.arb`, `app_en.arb`). After ARB edits:

```bash
flutter gen-l10n
```

`pubspec.yaml` has `flutter: generate: true`.

## macOS entitlements

Sandbox stays **on**. Added for later ScanCore / SSID identity (same story as Electron):

- `com.apple.security.app-sandbox` (unchanged)
- `com.apple.security.network.client`
- `com.apple.security.personal-information.location`

Usage strings: `NSLocationWhenInUseUsageDescription` (and `NSLocationUsageDescription`) explain Wi‑Fi network identity, not maps.

Do **not** turn off the sandbox or add Hardened Runtime exceptions just to debug.

## Signing blockers

| Situation | What you get |
|-----------|----------------|
| Xcode license not accepted | `flutter` / `xcodebuild` / `/usr/bin/git` exit 69 |
| No Apple Developer ID | macOS/iOS debug may be ad-hoc; TCC treats a new signature as a new app; BSSID often stays redacted → demo |
| ScanCore missing / unsigned | Demo fixtures (`source: fixtures`) — expected |

## Layout

```
lib/
  app/                 MaterialApp + Sunset theme
  pages/scan_workbench/
  widgets/             app bar, table, details, status
  features/scan_session/
  shared/i18n/         ARB + generated l10n
  shared/theme/        Sunset (Manrope / Plus Jakarta via google_fonts)
```
