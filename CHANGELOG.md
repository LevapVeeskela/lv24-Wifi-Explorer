# Changelog

All notable changes to LV24 WiFi Explorer. Dates are UTC.

## [Unreleased]

### Architecture

- Feature-Sliced Design enforced: `shared → entities → features → widgets → pages`,
  one public barrel per slice, cross-slice imports only through `index.ts`.
  `yarn check:boundaries` fails the build on layer-order or deep-import violations.
- Domain math extracted into entities: `entities/signal` (series, rolling stats,
  axes, sparkline), `entities/channel` (UNII, overlap, occupancy, utilization),
  `entities/columns` (grid catalog), `entities/bss` (row model + formatting).
- `ScanWorkbenchPage` split into `useScanSession`, `useWorkbenchRows`,
  `useWorkbenchIo`; theme, filter sidebar and grid columns split into focused modules.
- Workbench profiles can be exported/imported as JSON from the profile menu.
- Filter sidebar has locale render tests (ru/en/zh) and the empty-state copy is covered.

### Internationalization

- Simplified Chinese added: web catalog, MUI DataGrid locale, Flutter ARB catalog,
  language picker in Settings, persisted `lv24.locale` preference.
- Hardcoded two-language Flutter workbench strings moved into ARB.

## [1.0.0] — 2026-11-08

First production release.

### Desktop (macOS, Electron + React)

- Live Wi‑Fi scanning on macOS through the signed Swift `ScanCore` helper
  (CoreWLAN over a local Unix socket), with deterministic demo fixtures as an
  explicit fallback when the helper, Location permission, or hardware is
  unavailable.
- Networks table, details panel, channel occupancy and signal charts, snapshot
  open/save (`.lv24scan`), CSV export and print.
- Permission and diagnostics flow: TCC prompt guidance, one-click jump to
  System Settings, visible demo badge.
- Russian/English/Simplified Chinese UI (i18n), MUI X Pro data grid (license key from
  `VITE_MUI_LICENSE_KEY`; watermark without a key).

- **Workbench parity**: extended IE-derived columns (incl. AP name from WPS IE), Issues inspector and
  sidebar issue facets, IE tree copy/expand, BSS compare with IE diff, pin
  colors, RSSI/SNR/noise history with min/avg/max, workbench profiles, named
  coloring rules with import/export, channel/width/PHY/type/annotation facets,
  selected-only view, BSSID wildcard filters, cell context menu (apply/negate filter, show column), utilization table with beacon-overhead estimate, live/average/max graph traces.
- **Import/analysis**: pcap/pcapng capture import (radiotap + 802.11 beacon/probe, honest warnings), directed SSID scan (macOS best-effort), universal ScanCore
  preflight, native Save/Open dialogs, helper fallback banner.
- **Resilience**: renderer error boundary, main-process crash log,
  `render-process-gone` handling.
- **Release**: version 1.0.0, notarization env gate, `smoke:dist`,
  `check:scancore`, release checklist.

### Cross-platform scanning

- Linux: NetworkManager (`nmcli` / D‑Bus) provider.
- Windows: Native Wifi (`netsh` / `WlanQueryInterface`) provider, documented
  RSSI-quality mapping and BSS-survey limitations.
- `demo` provider: deterministic fixtures on every platform, used by tests and
  the CLI smoke run.
- Headless CLI (`packages/cli`, `lv24-wifi`) with `table`/`json` output.

### Packages

- Publishable `@lv24/wifi-core` (domain), `@lv24/wifi-backend` (providers),
  `@lv24/wifi-cli` (CLI) — all usable without MUI or Electron.

### Flutter client

- Mobile/desktop Flutter workbench with demo fixtures and platform adapters
  (Android `WifiManager`, Linux NetworkManager D‑Bus, Windows Native Wifi,
  iOS connected-network only, macOS ScanCore via `--dart-define=LIVE_SCAN=true`).

### Release engineering

- Universal (`arm64` + `x86_64`) ScanCore preflight before packaging
  (`scripts/check-scancore.mjs`).
- `scripts/smoke-electron.mjs` verifies the production renderer CSP, the
  main/preload bundles, and preload isolation (only `electron` is required).
- Environment-driven macOS notarization (`APPLE_ID`,
  `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID`), hardened runtime, trimmed
  entitlements.
- `yarn dist:mac`, `yarn dist:mac:dir`, `yarn dist:win`, `yarn dist:linux`,
  `yarn smoke:dist`; checklist in [`docs/RELEASE.md`](docs/RELEASE.md).

### Known limitations

- No auto-updater yet — releases are manual downloads.
- Windows/Linux live providers are not yet hardware-verified in CI.
- macOS live scanning requires Location permission for both the app and
  `ScanCore` (Apple treats SSID/BSSID as location data).
- MUI X Pro components stay on 8.11.x; 9.x needs a new org license.
