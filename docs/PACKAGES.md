# Package layout and publishing

The repository is a Yarn 1 workspace. Libraries are independently publishable;
apps are hosts that consume them.

```
packages/
  core/       @lv24/wifi-core       pure domain + scan mapping (no DOM/Node/Electron)
  backend/    @lv24/wifi-backend    provider API + macOS/Linux/Windows/demo providers
  cli/        @lv24/wifi-cli        `lv24-wifi` binary (Node 20+, all OS)
  mcp/        @lv24/wifi-mcp        MCP stdio server for AI agents (Node 20+)
  web/        @lv24/wifi-web        React + MUI renderer (Vite)
  desktop/    @lv24/wifi-desktop    Electron main/preload + provider lifecycle
native/ScanCore                     universal Swift helper (macOS 13.5+)
flutter/ + packages/scan_*          Flutter client + Dart packages
```

Dependency direction: `core ← backend ← cli`; `core ← web`;
`backend + core ← desktop`; `backend + core ← mcp`. No reverse imports.

## Cross-platform scan sources

| OS          | Provider         | Data quality                                             |
| ----------- | ---------------- | -------------------------------------------------------- |
| macOS 13.5+ | `macos-scancore` | CoreWLAN + Location; IEs, channel width, PHY             |
| Linux       | `linux-nmcli`    | NetworkManager; RSSI derived from signal quality, no IEs |
| Windows     | `windows-netsh`  | `netsh` English output; no IEs, channel width unknown    |
| any         | `demo`           | deterministic fixtures                                   |

Unsupported/denied paths emit typed errors; the desktop falls back to demo with
an explicit badge, the CLI prints the error and exits non-zero.

## Build & publish

```bash
yarn build:packages            # core → backend → cli → mcp
cd packages/core && npm publish --access public
cd packages/backend && npm publish --access public
cd packages/cli && npm publish --access public
cd packages/mcp && npm publish --access public
```

Published at **1.0.0** on npm: `@lv24/wifi-core`, `@lv24/wifi-backend`, `@lv24/wifi-cli`, `@lv24/wifi-mcp`.
Each package has `files: ["dist"]`, `license: MIT`, `engines.node >= 20`, and
CJS output for maximum consumer compatibility (`packages/mcp` is ESM because the MCP SDK is ESM-only). The web/desktop apps are MIT
code but the desktop UI depends on commercial MUI X Pro (see `CONTRIBUTING.md`).

## Desktop packaging

```bash
yarn dist:mac     # builds universal ScanCore, then DMG (x64 + arm64)
yarn dist:win     # NSIS (uses netsh provider; no native helper)
```

Electron main/preload are bundled with esbuild (`scripts/build-desktop.mjs`), so
workspace packages do not need to be present in `node_modules` inside the asar.

### macOS signing

`ScanCore.app` is launched through LaunchServices and communicates over a
private Unix socket. TCC only grants Location to a **stably signed** helper;
`yarn build:scancore` auto-selects the first Apple Development / Developer ID
identity (override `CODESIGN_IDENTITY=...`). Without it, macOS redacts
SSID/BSSID and the UI shows RF-only rows (not “hidden” networks).
