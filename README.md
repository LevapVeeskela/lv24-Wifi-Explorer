# LV24 WiFi Explorer

**Private commercial** desktop Wi‑Fi scanner for macOS. Original LV24 product — clean room; not derived from third-party Wi‑Fi Explorer apps, vendor databases, or `.wifiexplorer` formats.

| | |
|--|--|
| **GitHub** | [LevapVeeskela/lv24-Wifi-Explorer](https://github.com/LevapVeeskela/lv24-Wifi-Explorer) — **private** |
| **Bundle ID** | `by.lv24.wifi.explorer` |
| **Stack** | Electron 33, Vite 8, React 19, MUI 9, MUI X Pro 8.11 |
| **Also** | Flutter client in [`flutter/`](flutter/) — [`packages/scan_domain`](packages/scan_domain), [`packages/scan_core_client`](packages/scan_core_client), [`packages/scan_l10n`](packages/scan_l10n), [`packages/lv24_sunset_theme`](packages/lv24_sunset_theme); live macOS scan via [`native/ScanCore`](native/ScanCore). See [`docs/FLUTTER.md`](docs/FLUTTER.md). |

Product docs: [`docs/SPEC.md`](docs/SPEC.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/FLUTTER.md`](docs/FLUTTER.md) · [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) · [`docs/PARITY-GAP.md`](docs/PARITY-GAP.md)

---

## Requirements

- macOS **13.5+** (for real CoreWLAN scan)
- Node **≥ 20**
- **Yarn 1.22** (`packageManager` in `package.json`)

**Git on macOS / Git на Mac:** if `/usr/bin/git` fails on the Xcode license, prepend CLT to `PATH`:

```bash
export PATH="/Library/Developer/CommandLineTools/usr/bin:$PATH"
```

---

## How to run / Запуск

```bash
yarn install
cp .env.example .env.local
yarn dev
```

- **`yarn dev`** — Vite (**5173**) + Electron.
- **`yarn dev:renderer`** — Vite only (UI in browser; no Electron shell).
- Copy **`VITE_MUI_LICENSE_KEY`** into **`.env.local`** only (from lv24 city frontend `.env.local`). **Do not commit, log, or paste the key.** / Ключ только в `.env.local`, не коммитить и не печатать.
- Without signed ScanCore + Location, the app uses **demo fixtures** ([`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)).

Live scan locally:

```bash
yarn run build:scancore
yarn run dev:electron -- --live
```

**Flutter** ([`flutter/`](flutter/), details in [`docs/FLUTTER.md`](docs/FLUTTER.md)) — uses path packages `scan_domain`, `scan_core_client`, `scan_l10n`, `lv24_sunset_theme`:

Dart packages use a root **pub workspace** ([`pubspec.yaml`](pubspec.yaml) at repo root). From the repository root, run **`dart pub get`** to resolve `packages/*` and [`flutter/`](flutter/).

```bash
cd flutter && flutter pub get && flutter run -d macos
flutter run -d android
flutter run -d ios
```

Demo fixtures by default. **Android:** live `WifiManager` via [`flutter/lib/features/android_scan`](flutter/lib/features/android_scan) (public APIs; location / nearby Wi‑Fi; OS throttling; demo fallback). **Linux:** NetworkManager D-Bus `GetAccessPoints`, connected-network fallback, demo fallback; no `iw`/monitor. **Windows:** Native Wifi associated link (`WlanQueryInterface`; documented quality→RSSI); `WlanGetAvailableNetworkList` is not a BSS survey (no BSSID/channel/IEs); no association → demo fixtures; no WinRT/MSIX `wifiControl`, monitor, or NDIS. **iOS:** connected-network only. **Live scan (macOS):** `yarn run build:scancore`, then `cd flutter && flutter run -d macos --dart-define=LIVE_SCAN=true`, or **Settings → Live** (`preferDemo: false`). Helper missing → fixtures. Live macOS ScanCore still needs Location ([`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)). If `/usr/bin/git` or Xcode tooling fails on the license prompt, use the `PATH` export above before `flutter run`. Workbench **File** open/save: **`.lv24scan`** only (`lv24.wifi-explorer.scan` v1); rejects **`.wifiexplorer`**; copy-JSON / path write (no `file_picker`). **Export CSV** (visible/selected/all): `ssid`, `bssid`, `rssi`, `channel`, `band`, `security`, `issues`; copy or path write (no `file_picker`).

---

## Scripts

| Script | Purpose |
|--------|---------|
| `yarn dev` | Vite + Electron |
| `yarn dev:renderer` | Vite only |
| `yarn dev:electron` | Electron only (after Vite up) |
| `yarn build` | Main/preload + renderer production build |
| `yarn typecheck` | TypeScript (app + electron) |
| `yarn build:scancore` | Build `native/ScanCore` Swift helper |
| `yarn test:scan` | Domain/scan unit tests |
| `yarn dist:mac` / `dist:win` | electron-builder installers |

Env overrides: `WIFI_EXPLORER_DEMO=0`, `WIFI_RENDERER_DEV_URL`.

---

## MUI X license

Paid: `@mui/x-data-grid-pro`, `@mui/x-license` **8.11.x**.

- **`VITE_MUI_LICENSE_KEY`** lives in **`.env.local`** only; wired via `applyMuiXLicense()` — never log or print it.
- Do not bump paid MUI X to 9.x without a new org license.

---

## Architecture (short)

- **Renderer:** `src/` (FSD), bridge `window.wifiExplorer` from `electron/preload.ts`
- **Main:** `electron/` — IPC, ScanCore host, OUI attach, demo loop
- **Helper:** `native/ScanCore/` — Swift CoreWLAN scan + JSON Lines

Details: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

---

## Commit message style

```
[Wifi](<area>) Short description
```

Examples: `[Wifi](docs) Add v1 spec`, `[Wifi](scancore) Fix scan pacing`.

---

## Clean room

Do not use competitor app bundles, proprietary formats, or decompiled assets. Domain types under `src/domain/` describe the LV24 model only.
