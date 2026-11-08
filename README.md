# LV24 WiFi Explorer

[![License: MIT](https://img.shields.io/badge/license-MIT-22c55e.svg)](#license)
[![Platforms](https://img.shields.io/badge/platforms-macOS%20%7C%20Linux%20%7C%20Windows-38bdf8.svg)](#cross-platform-scan-sources)
[![Node](https://img.shields.io/badge/node-%E2%89%A520-339933.svg)](#requirements)
[![Packages](https://img.shields.io/badge/publishable-core%20%C2%B7%20backend%20%C2%B7%20cli-f97316.svg)](docs/PACKAGES.md)

A fast, honest Wi‑Fi scanner for macOS, Linux and Windows — plus reusable
packages for anyone building their own Wi‑Fi tooling. Live CoreWLAN scans on
macOS, NetworkManager on Linux, `netsh` on Windows, and a deterministic demo
provider everywhere. Desktop, web UI, Flutter client and a headless CLI share
one domain model.

<p align="center">
  <img src="docs/assets/screenshot-main.png" alt="LV24 WiFi Explorer main window with live networks, signal bars and channel occupancy" width="920">
</p>

|               |                                                                                                                                                 |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **GitHub**    | [LevapVeeskela/lv24-Wifi-Explorer](https://github.com/LevapVeeskela/lv24-Wifi-Explorer)                                                         |
| **License**   | MIT for core/backend/CLI and app code; desktop/web optionally use commercial MUI X Pro — see `CONTRIBUTING.md`.                                 |
| **Bundle ID** | `by.lv24.wifi.explorer`                                                                                                                         |
| **Stack**     | Electron 33, Vite 8, React 19, MUI 9, MUI X Pro 8.11, Swift ScanCore, Flutter                                                                   |
| **Also**      | Flutter client in [`flutter/`](flutter/), Dart packages in [`packages/`](packages/), live macOS scanner in [`native/ScanCore`](native/ScanCore) |

## Screenshots

| Live scan                                          | Network details                                        |
| -------------------------------------------------- | ------------------------------------------------------ |
| ![Live scan](docs/assets/screenshot-main.png)      | ![Network details](docs/assets/screenshot-details.png) |
| **BSS compare**                                    | **Issues inspector**                                   |
| ![BSS compare](docs/assets/screenshot-compare.png) | ![Issues inspector](docs/assets/screenshot-issues.png) |
| **Settings**                                       |                                                        |
| ![Settings](docs/assets/screenshot-settings.png)   |                                                        |

## Why it is nice

- **Real data, no stubs**: live SSID/BSSID/vendor on macOS once the signed helper is granted Location; RF-only redaction is explicit, never fake “hidden” names.
- **Targeted scans**: directed SSID mode on macOS, full scans everywhere, honest Linux/Windows limitations.
- **Fast table**: sortable signal/channel/PHY columns, stable per-network colors, per-row RSSI sparkline, grouping by SSID/AP/vendor.
- **Answers “why is my Wi‑Fi bad?”**: signal/noise/SNR history, same-SSID and same-channel occupancy, issue heuristics, BSS compare with IE diff, IE tree.
- **Workbench, not a black box**: filter presets, saved workbench profiles, annotations, named coloring rules, column profiles, CSV/print/snapshot export.
- **One model everywhere**: the same `@lv24/wifi-core` powers the desktop UI and the CLI; Linux/Windows providers degrade honestly (RSSI derived from quality, unknown widths/IE).
- **Offline analysis**: import pcap/pcapng captures (radiotap + 802.11 beacon/probe) with explicit warnings for unsupported frames.
- **Three UI languages**: Russian, English and Simplified Chinese, switchable live in Settings (desktop and Flutter).
- **Open and reusable**: MIT core/backend/CLI packages, typed provider API, demo provider for CI, no private APIs in the core.

## Packages

| Package                                  | Purpose                                                       | Publish        |
| ---------------------------------------- | ------------------------------------------------------------- | -------------- |
| [`@lv24/wifi-core`](packages/core)       | platform-agnostic domain, IE decode, merge, filters, issues   | npm (MIT)      |
| [`@lv24/wifi-backend`](packages/backend) | macOS ScanCore / Linux nmcli / Windows netsh / demo providers | npm (MIT)      |
| [`@lv24/wifi-cli`](packages/cli)         | `lv24-wifi scan` CLI on every OS                              | npm (MIT)      |
| [`@lv24/wifi-mcp`](packages/mcp)         | MCP server: Wi-Fi scan data for AI agents                     | npm (MIT)      |
| [`@lv24/wifi-web`](packages/web)         | React + MUI UI                                                | app (MIT code) |
| [`@lv24/wifi-desktop`](packages/desktop) | Electron host (Windows/Linux/macOS)                           | app (MIT code) |
| `flutter/` + `packages/scan_*`           | mobile/desktop Flutter client and Dart packages               | pub.dev-ready  |

```
packages/core      ← no DOM/Node/Electron
packages/backend   ← depends on core
packages/cli       ← depends on backend
packages/web       ← depends on core
packages/desktop   ← depends on backend + core
```

## MCP for agents

[`@lv24/wifi-mcp`](packages/mcp) exposes live scan data over MCP (stdio):
`wifi_scan`, `wifi_network`, `wifi_summary`, `wifi_channels` (utilization +
beacon estimate), `wifi_issues` and `wifi_providers`. It reuses the same
`@lv24/wifi-backend` + `@lv24/wifi-core` stack as the app, so agents see the
same networks, channels and issue heuristics. See [`docs/MCP.md`](docs/MCP.md)
for client configs (Claude Desktop, Cursor, OpenCode) and data-honesty notes.

```bash
yarn build:mcp && node packages/mcp/dist/main.js
```

## Cross-platform scan sources

| OS          | Provider         | What you get                                                                                   |
| ----------- | ---------------- | ---------------------------------------------------------------------------------------------- |
| macOS 13.5+ | `macos-scancore` | CoreWLAN active scan, real SSID/BSSID when signed helper has Location, channel width, PHY, IEs |
| Linux       | `linux-nmcli`    | NetworkManager scan; RSSI derived from signal quality, widths/IEs unknown by design            |
| Windows     | `windows-netsh`  | `netsh` BSS scan (English output); widths/IEs unknown by design                                |
| anywhere    | `demo`           | deterministic fixtures for CI, screenshots and unsupported hardware                            |

```bash
yarn cli scan --provider auto --count 2 --format table
yarn cli scan --provider demo --format json --out scan.json
```

Product docs: [`docs/SPEC.md`](docs/SPEC.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/FLUTTER.md`](docs/FLUTTER.md) · [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) · [`docs/PARITY-GAP.md`](docs/PARITY-GAP.md)

---

## Requirements

- macOS **13.5+** for the native CoreWLAN helper; Linux with NetworkManager (`nmcli`) or Windows (`netsh`) for live CLI/desktop scans
- Node **≥ 20**
- **Yarn 1.22** (`packageManager` in `package.json`)

## Install & run (60 seconds)

```bash
git clone https://github.com/LevapVeeskela/lv24-Wifi-Explorer.git
cd lv24-Wifi-Explorer
yarn install
yarn build:scancore      # macOS live helper (signed automatically when a cert exists)
yarn dev                 # desktop app: live scan by default
```

First macOS launch asks for **Location** once for `ScanCore` (Apple treats
SSID/BSSID as location data). Approve it and real network names appear. No
helper, no permission, or `--demo` shows deterministic fixtures with a visible
demo badge.

Prefer the terminal?

```bash
yarn cli scan --provider auto --format table
```

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
- **Live scan is the default.** If ScanCore is missing/fails or Location is denied, the app falls back to **demo fixtures** with an explicit demo badge ([`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)). Opt into demo with `--demo` or `WIFI_EXPLORER_DEMO=1`.

Live scan locally (all OS):

```bash
yarn build:scancore   # macOS helper (universal arm64+x86_64)
yarn dev:electron     # live by default; --demo for fixtures

yarn cli scan --provider auto --format table   # headless, all OS
```

**Flutter** ([`flutter/`](flutter/), details in [`docs/FLUTTER.md`](docs/FLUTTER.md)) — uses path packages `scan_domain`, `scan_core_client`, `scan_l10n`, `lv24_sunset_theme`:

Dart packages use a root **pub workspace** ([`pubspec.yaml`](pubspec.yaml) at repo root). From the repository root, run **`dart pub get`** to resolve `packages/*` and [`flutter/`](flutter/).

```bash
cd flutter && flutter pub get && flutter run -d macos
flutter run -d android
flutter run -d ios
```

Demo fixtures by default. **Android:** live `WifiManager` via [`flutter/lib/features/android_scan`](flutter/lib/features/android_scan) (public APIs; location / nearby Wi‑Fi; OS throttling; demo fallback). **Linux:** NetworkManager D-Bus `GetAccessPoints`, connected-network fallback, demo fallback; no `iw`/monitor. **Windows:** Native Wifi associated link (`WlanQueryInterface`; documented quality→RSSI); `WlanGetAvailableNetworkList` is not a BSS survey (no BSSID/channel/IEs); no association → demo fixtures; no WinRT/MSIX `wifiControl`, monitor, or NDIS. **iOS:** connected-network only. **Live scan (macOS):** `yarn run build:scancore`, then `cd flutter && flutter run -d macos --dart-define=LIVE_SCAN=true`, or **Settings → Live** (`preferDemo: false`). Helper missing → fixtures. Live macOS ScanCore still needs Location ([`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)). If `/usr/bin/git` or Xcode tooling fails on the license prompt, use the `PATH` export above before `flutter run`. Workbench **File** open/save: **`.lv24scan`** only (`lv24.wifi-explorer.scan` v1); rejects **`.wifiexplorer`**. **Export CSV** (visible/selected/all) follows the visible column set; the Flutter client uses `file_picker` for open/save.

---

## Scripts

| Script                       | Purpose                                             |
| ---------------------------- | --------------------------------------------------- |
| `yarn dev`                   | Vite + Electron                                     |
| `yarn dev:renderer`          | Vite only                                           |
| `yarn dev:electron`          | Electron only (after Vite up)                       |
| `yarn build`                 | Packages + main/preload + renderer production build |
| `yarn build:packages`        | Build `core`, `backend`, `cli`, `mcp`               |
| `yarn build:mcp`             | Build the MCP server                                |
| `yarn mcp`                   | Run the MCP server (stdio)                          |
| `yarn cli`                   | Run the cross-platform CLI (`lv24-wifi`)            |
| `yarn typecheck`             | TypeScript (app + electron)                         |
| `yarn build:scancore`        | Build `native/ScanCore` Swift helper                |
| `yarn check:scancore`        | Fail unless ScanCore is universal (arm64 + x86_64)  |
| `yarn test`                  | Vitest (includes scan suite)                        |
| `yarn test:scan`             | Same scan suite through compiled `node:test`        |
| `yarn format:check`          | oxfmt verification                                  |
| `yarn smoke:dist`            | Verify built renderer CSP, bundles and preload      |
| `yarn dist:mac` / `dist:win` | electron-builder installers                         |
| `yarn dist:mac:dir`          | Unpacked local macOS `.app` smoke package           |
| `yarn dist:mac:public`       | Key-free watermarked macOS DMG (redistributable)    |
| `yarn check:public-bundle`   | Fail if the MUI key leaked into `dist/`             |

Env overrides: `WIFI_EXPLORER_DEMO=1` (opt-in demo), `WIFI_RENDERER_DEV_URL`.

---

## Release / distribution

Checklist: [`docs/RELEASE.md`](docs/RELEASE.md); history:
[`CHANGELOG.md`](CHANGELOG.md).

- **macOS** is the only fully signed path: `yarn build:scancore` +
  `yarn dist:mac` require a universal ScanCore helper (`yarn check:scancore`
  guards it) and a **Developer ID Application** identity. Distribution builds
  are hardened-runtime signed; notarization is enabled and runs only when
  `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD` and `APPLE_TEAM_ID` are exported.
  Unsigned local builds still work (Gatekeeper will warn).
- **Private vs public artifacts**: `dist:mac` / `dist:mac:dir` inline
  `VITE_MUI_LICENSE_KEY` from `.env.local` and must **not** be redistributed.
  `dist:mac:public` builds with an empty key, fails if the key is found in the
  bundle, and produces a watermarked DMG that is safe to publish.
- **Windows/Linux** installers are built on their own platform
  (`yarn dist:win`, `yarn dist:linux`); Windows builds are unsigned unless a
  certificate is configured.
- **No auto-updater yet** — releases are manual downloads from GitHub Releases.
- **Versions** live in the root `package.json` (and `flutter/pubspec.yaml` for
  the Flutter client); document user-visible changes in `CHANGELOG.md`.

---

## MUI X license

Paid: `@mui/x-data-grid-pro`, `@mui/x-license` **8.11.x**.

- **`VITE_MUI_LICENSE_KEY`** lives in **`.env.local`** only; wired via `applyMuiXLicense()` — never log or print it.
- Do not bump paid MUI X to 9.x without a new org license.
- Without a key the web/desktop grid shows the MUI watermark; `core`, `backend`, and `cli` build and run without any MUI dependency.

---

## Architecture (short)

- **Renderer:** `packages/web/src` (FSD), bridge `window.wifiExplorer` from `packages/desktop/src/preload.ts`
- **Main:** `packages/desktop/src` — IPC, provider lifecycle, demo fallback
- **Backend:** `packages/backend` — cross-platform scan providers
- **OUI:** resolved in the renderer from `resources/oui/registry.json`
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

Do not use competitor app bundles, proprietary formats, or decompiled assets. Domain types under `packages/core/src/domain/` describe the LV24 model only.
