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
- Workbench profiles and column profiles can be exported/imported as JSON; coloring rules already supported it.
- Filter sidebar has locale render tests (ru/en/zh) and the empty-state copy is covered.

### Published

- `@lv24/wifi-core`, `@lv24/wifi-backend`, `@lv24/wifi-cli` and `@lv24/wifi-mcp`
  published to npm at **1.0.0** (public, MIT).
- Verified from a clean install: `lv24-wifi providers`, demo scan, and the MCP
  server over stdio with all six tools.

### Distribution

- PyPI launcher `lv24-wifi-explorer` **1.0.0 published** on 2026-11-10
  (`pip install lv24-wifi-explorer`) with Trusted Publishing, no API tokens; see
  `docs/pypi.md`.
- Headless container image `ghcr.io/levapveeskela/lv24-wifi-explorer` (CLI + MCP)
  and the `@levapveeskela/lv24-wifi-explorer` GitHub Packages bundle; both are
  published by manual, zero-spend workflows.
- Free publisher manifests and a manual release workflow: winget (PR
  [#475989](https://github.com/microsoft/winget-pkgs/pull/475989), CLA signed;
  Installation Validation blocked), Scoop (live bucket), Chocolatey,
  AppImageHub, self-hosted Homebrew tap; Snap/Flathub/Store paths are documented
  with their blockers in `docs/DISTRIBUTION.md` and
  `docs/DISTRIBUTION-MICROSOFT-STORE.md`.
- Microsoft Store draft is prepared (Individual account, publisher
  `Pavel Aliakseyeu`, ru/en/zh listings, age ratings) but submission is on hold:
  SignPath Foundation declined for lack of public visibility, no free trusted
  Authenticode certificate exists; Certum OSS (EUR 49) is the cheapest paid
  route, MSIX is the $0 alternative with AppData caveats.
- `release-desktop.yml` builds unsigned Windows NSIS and Linux AppImage assets on
  free public-repo runners and can attach them to an existing release; the
  `v1.0.0` release now carries `LV24-WiFi-Explorer-1.0.0-win-x64.exe`,
  `LV24-WiFi-Explorer-1.0.0-linux-x86_64.AppImage` and `SHA256SUMS.txt`.

### MCP server

- New `@lv24/wifi-mcp` package: stdio MCP server with `wifi_providers`,
  `wifi_scan`, `wifi_network`, `wifi_summary`, `wifi_channels` and `wifi_issues`.
- Reuses `@lv24/wifi-backend` providers and the shared domain; issue heuristics
  and channel utilization moved into `@lv24/wifi-core` so the app and agents run
  the same logic.
- 30 s snapshot cache, serialized scans, compact field selection, optional IEEE
  MA-L vendor lookup, demo provider for CI. Docs: `docs/MCP.md`.

### Packaging

- Publishable packages are versioned `1.0.1`; the desktop app is `1.1.0` and the
  Flutter app `1.1.0+6`. Same source tree, independent release tracks.
- `dist:mac:public` builds a redistributable, watermarked macOS DMG without the
  commercial MUI key; `check:public-bundle` fails the build if the key leaks
  into `dist/`.

### Internationalization

- Simplified Chinese added: web catalog, MUI DataGrid locale, Flutter ARB catalog,
  language picker in Settings, persisted `lv24.locale` preference.
- Hardcoded two-language Flutter workbench strings moved into ARB.

## [1.1.0] — 2026-11-11

Feature release: auto-update, saved Wi-Fi password reveal, and a device/router
compatibility score.

### Auto-update

- `electron-updater` with a generic GitHub Releases feed
  (`releases/latest/download`); the release workflow now writes and attaches
  `latest.yml` and `latest-linux.yml`. Settings has an **Updates** tab with an
  automatic-check toggle, current version, status, progress, check-now and
  restart-and-install.
- Windows and Linux AppImage are supported. macOS stays manual until the build
  is signed and notarized; the settings panel says so instead of failing.
- Updates keep the existing SHA-512 verification from the metadata file. The
  installer is unsigned, so the OS may still ask for confirmation.

### Wi-Fi password

- A saved-network password can be revealed explicitly from Network details:
  `netsh wlan show profile ... key=clear` on Windows, Keychain on macOS, and
  NetworkManager/nmcli on Linux.
- The value is never written to storage, snapshots, exports or logs; it is
  cleared after 30 seconds and has a copy button. Open networks and profiles
  without a stored key show a clear explanation.
- Windows profiles are listed first, so the action only appears for networks the
  user has actually saved; macOS asks Keychain on demand.

### Compatibility

- New **Compatibility** details tab scores the adapter against the selected BSS
  on a 1–10 scale: band, PHY generation, channel width, security and signal,
  with a confidence indicator.
- Adapter capabilities come from `netsh wlan show drivers` (Windows),
  `system_profiler` (macOS) and `iw list` (Linux); inferred values are marked as
  estimated. The report lists what is wrong and what to change on the router or
  on the device, including DFS, 40 MHz on 2.4 GHz, WPA2/WPA3, channel width and
  weak signal.
- The UI is available in Russian, English and Simplified Chinese.

### Packaging

- Windows releases ship both the NSIS installer and the portable ZIP used by
  winget; the release workflow builds both in one pass.

## [1.0.4] — 2026-11-10

Watermark-free Windows and Linux builds. The MUI X Pro key is no longer stored
in source: it comes from `.env.local` locally or the `MUI_X_LICENSE_KEY` GitHub
Actions secret in CI, and is coded into the bundle after minification.

### Build

- Vite swaps `import.meta.env.VITE_MUI_LICENSE_KEY` for a random placeholder
  before inlining, then replaces it with a XOR-coded decoder after minification.
  The plaintext key does not appear in `dist/`, `app.asar` or `strings`.
- Source maps are disabled and `debugger` statements are stripped in production.
- `check:public-bundle` fails when the plaintext key is present; the release
  preflight fails when the secret is missing, so a watermarked build cannot be
  published by accident.
- This is obfuscation, not encryption: the key is decoded in memory at runtime
  and can be recovered with a debugger. The license key remains a compliance
  token, not a DRM secret.

### Distribution

- Windows releases now ship both the NSIS installer and a portable ZIP. winget
  uses the ZIP (`InstallerType: zip`, `NestedInstallerType: portable`) because
  the unsigned NSIS installer is rejected by the validation VM's `shellExecute`
  step; the NSIS variant remains for direct download and Scoop.

## [1.0.3] — 2026-11-10

The issue counter is visible without opening the column picker. v1.0.2 and
earlier hid it by default.

### Fixed

- The `issueFlags` column ("Проблемы") is part of the default grid and shows the
  warning chip with the issue count for every network.
- A one-time migration reveals it for existing installs whose saved column
  visibility predates this release
  (`lv24.wifi-explorer.columns.issues-revealed`); hiding it afterwards sticks.
- Column visibility now has a single persisted implementation; the duplicated
  page-level defaults file is gone.

## [1.0.2] — 2026-11-10

The version shown in the app is now read from the root `package.json` at build
time. v1.0.1 reported `1.0.0` in the status bar, the About dialog and snapshot
metadata because `APP_VERSION` was a hardcoded constant.

### Fixed

- `APP_VERSION` is injected by Vite (`__APP_VERSION__`) from the root manifest;
  a unit test fails if the constant is hardcoded again. The status bar, About
  dialog and exported snapshots now report `1.0.2`.
- Flutter `pubspec.yaml` moves to `1.0.2+3` to match the desktop track.

### CI

- `npm-publish.yml` and `pypi-publish.yml` are manual-dispatch only. A desktop
  release tag no longer starts them: the app and the packages have independent
  versions, so a desktop release would fail their version validation.

## [1.0.1] — 2026-11-10

Desktop and package patch. The Windows installer, which previously showed no
live networks at all, now ships the working `netsh` parser and the packaged-IPC
fix.

### Desktop

- Windows `netsh` parsing is locale-tolerant: real RSSI, channel, security and
  PHY are read from Russian/English output by value shape instead of English
  labels. Entries without a parsable signal are dropped rather than reported as
  -100 dBm, and `netsh`/`nmcli` no longer invent noise or beacon-interval values.
  See `docs/AUDIT-2026-11-10-WINDOWS.md`.
- Packaged Windows builds no longer reject renderer IPC as `untrusted-sender`:
  `fileURLToPath()` now converts `file:///C:/...` correctly, so the installed app
  can start a live scan instead of falling back to an empty demo.
- The status bar wraps its clusters instead of clipping values at narrow window
  sizes, and the chart accessibility table no longer creates a horizontal page
  scrollbar.
- Windows builds and the NSIS installer now use the LV24 `icon.ico` (transparent
  corners, 16–256 px) instead of the default Electron icon.

### Fixed

- `lv24-wifi --version` now prints the real CLI package version. It was
  hardcoded to `0.1.0`; the value is generated from
  `packages/cli/package.json` at build time and guarded by a test.
- `@lv24/wifi-mcp` reports the matching `1.0.1` server version.

### Publishing

- **1.0.1** of `@lv24/wifi-core`, `@lv24/wifi-backend`, `@lv24/wifi-cli`,
  `@lv24/wifi-mcp` and the `lv24-wifi-explorer` PyPI launcher.
- New `.github/workflows/npm-publish.yml` publishes the four npm packages in
  dependency order with npm Trusted Publishing (OIDC) and provenance: no
  `NPM_TOKEN`. Release order is npm first, then the `pypi-publish.yml` dispatch.

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
