# Architecture — Electron + ScanCore

LV24 WiFi Explorer splits **UI + domain** (TypeScript) from **macOS Wi‑Fi APIs** (Swift helper). Clean room: public CoreWLAN + CoreLocation only.

---

## 1. Process model

```text
┌─────────────────────────────────────────────────────────┐
│  Renderer (packages/web, Vite + React + MUI)            │
│  pages/widgets/features; core from packages/core        │
│  window.wifiExplorer ← preload contextBridge            │
└───────────────────────────┬─────────────────────────────┘
                            │ IPC invoke + events
┌───────────────────────────▼─────────────────────────────┐
│  Electron main (packages/desktop)                       │
│  Provider lifecycle + IPC (OUI resolved in renderer)    │
└───────────────────────────┬─────────────────────────────┘
                            │ JSON Lines (stdio + optional UDS)
┌───────────────────────────▼─────────────────────────────┐
│  ScanCore.app (Swift, native/ScanCore)                  │
│  CWWiFiClient scan loop, LocationGate, pacing ≥ 3 s     │
└─────────────────────────────────────────────────────────┘
```

**Division of labor**

| Layer              | Owns                                                                                 |
| ------------------ | ------------------------------------------------------------------------------------ |
| `packages/core`    | Domain types, mapping, IE decode, merge/filters/issues (no platform APIs)            |
| `packages/backend` | Provider lifecycle and normalized `ScanSnapshotPayload` for macOS/Linux/Windows/demo |
| `packages/desktop` | Electron window/IPC/security, provider + demo fallback, packaging                    |
| `packages/web`     | Grid, filters, charts, details; OUI registry and i18n                                |
| `packages/cli`     | Headless scan/export for CI and all OS                                               |

Bundled artifact: `ScanCore.app` copied by `electron-builder.yml` into app resources.

Build helper: `yarn build:scancore` → `native/ScanCore/.build/ScanCore.app` (universal arm64+x86_64 when SwiftPM supports it).

---

## 2. ScanCore transport

- **Default:** one JSON object per line on **stdout**; optional **UDS** at `$TMPDIR/lv24-wifi-scancore.sock`.
- **Optional TCP:** `127.0.0.1` only; peer must send `{"type":"auth","token":"..."}` from `hello.authToken`.
- **First line:** `hello` with `protocolVersion: 1`.
- **`--demo`:** one error with `demoFallback: true`, exit 0 → Electron loads fixtures.

Details: `native/ScanCore/README.md`.

---

## 3. IPC — renderer ↔ main

Preload: `packages/desktop/src/preload.ts` exposes `window.wifiExplorer`.

### 3.1 Invoke (renderer → main)

| Channel                    | Payload          | Returns                                      |
| -------------------------- | ---------------- | -------------------------------------------- |
| `scan:start`               | —                | `{ ok: true }` or `{ ok: false, error }`     |
| `scan:stop`                | —                | `{ ok: true }`                               |
| `scan:setIntervalMs`       | `{ ms: number }` | `{ ok, intervalMs }` (floor 3000 ms in main) |
| `permissions:query`        | —                | `{ location: string, demoMode: boolean }`    |
| `permissions:openSettings` | —                | `{ ok: true }` (macOS Location privacy URL)  |
| `demo:enable`              | —                | `{ ok, demoMode: true }`                     |

### 3.2 Events (main → renderer)

| Channel              | Payload                                    |
| -------------------- | ------------------------------------------ |
| `scan:snapshot`      | ScanCore payload + enrichments (see below) |
| `permissions:status` | `{ location, demoMode }`                   |

### 3.3 `scan:snapshot` enrichments (main)

| Field                                                                                                                            | When                          |
| -------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- |
| `source`                                                                                                                         | `'scancore'` \| `'fixtures'`  |
| `demo`                                                                                                                           | `true` in fixture / demo mode |
| Renderer resolves vendor via `resources/oui/registry.json` (`@/shared/lib/oui`) in `ingestScanPayload` → `ScanViewModel` → grid. |

### 3.4 ScanCore ↔ main (JSON Lines)

Inbound to helper: `scan:start`, `scan:stop`, `scan:setIntervalMs`, `permissions:query`, `permissions:openSettings`, `demo:enable`, `shutdown`.

Outbound: `hello`, `permissions:status`, `helper:status`, `scan:snapshot`, `error`.

`scan:snapshot.payload` matches domain `ScanSnapshot` shape (`networks` as `CoreWlanNetworkRecord[]`, not full `ObservedBss`).

---

## 4. Data flow (live path)

1. User starts scan → main `startScanLoop`.
2. If `demoMode` or helper missing → fixture timer (`source: 'fixtures'`).
3. Else spawn ScanCore → on each `scan:snapshot`, main forwards the payload → `webContents.send('scan:snapshot', …)`; renderer resolves OUI.
4. Renderer maps records → `ObservedBss[]`, applies filters, updates charts/history.

Merge/stale rules: `packages/core/src/scan/mergeSnapshots.ts` (session state in view model).

---

## 5. Fallback tiers A–F

When live scan cannot deliver full data, degrade in order — label UI honestly.

| Tier                    | Trigger                                                                       | Behavior                                                |
| ----------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------- |
| **A — Full**            | Location granted + `scanForNetworks` succeeds                                 | All fields; `source: scanForNetworks`                   |
| **B — Cached**          | Scan throttled / in-flight                                                    | `cachedScanResults()` with `stale: true`                |
| **C — Connected only**  | Full scan failed; Wi‑Fi associated                                            | Single row from `CWInterface` (SSID/BSSID/RSSI/channel) |
| **D — Location denied** | TCC denied / restricted                                                       | Redact SSID/BSSID/country; show RF if API returns       |
| **E — Demo / fixture**  | `--demo`, unsigned helper, missing binary, helper crash, `demoFallback: true` | Bundled fixtures; banner **Demo data**                  |
| **F — Manual import**   | User provides Apple Wireless Diagnostics export (future)                      | Parse locally; no private CLIs                          |

**Never:** spoof Location, bundled deprecated `airport`, monitor mode in v1.

Electron wiring today: **E** via `demoMode` / argv (`--live` opts out), helper exit → fixture loop; **A–D** inside ScanCore snapshot `source` + `location` fields.

---

## 6. Repo map (implementation)

| Path                         | Role                                                            |
| ---------------------------- | --------------------------------------------------------------- |
| `packages/desktop/`          | Main, preload, CSP, provider lifecycle; renderer owns OUI       |
| `native/ScanCore/`           | Swift helper + entitlements                                     |
| `packages/core/src/domain/`  | Shared types (contract with ScanCore JSON)                      |
| `packages/core/src/scan/`    | Map raw → `ObservedBss`, merge, tests                           |
| `packages/web/src/entities/` | Domain models + pure math (bss, scan, channel, signal, columns) |
| `packages/web/src/features/` | User-facing capabilities (search, filters, profiles, export)    |
| `packages/web/src/widgets/`  | Composite UI blocks (grid, charts, sidebar, dialogs)            |
| `packages/web/src/pages/`    | Route-level composition (`ScanWorkbenchPage` + hooks)           |
| `packages/web/src/shared/`   | UI kit, i18n, IPC contracts, persistence, pure libs             |
| `packages/web/src/vendor/`   | OUI registry                                                    |
| `data/oui/`                  | Bundled IEEE snapshot                                           |

### Feature-Sliced Design rules (enforced)

- Layer order is one-way: `shared → entities → features → widgets → pages → app`.
  A lower layer never imports a higher one.
- Every slice exposes a public API via its `index.ts`; other slices import only
  that barrel, never internal files.
- `entities/*` contains pure models and math (no React, no i18n catalogs);
  `features/*` owns user capabilities; `widgets/*` composes UI; `pages/*` wires
  state and side effects.
- `yarn check:boundaries` (`scripts/check-boundaries.mjs`) fails on layer-order
  or deep-import violations; it runs before release.

---

## 7. Security notes (IPC)

- Helper listens loopback only; token auth on socket/TCP.
- No cloud upload of scan results by default.
- Crash/analytics: avoid raw BSSID logging (hash or strip).

See also `docs/PERMISSIONS.md`.

---

## 8. MCP server (agents)

`@lv24/wifi-mcp` exposes the scan pipeline to MCP clients over stdio. It imports
only `@lv24/wifi-backend` (providers) and `@lv24/wifi-core` (domain, issues,
utilization) — never the web renderer. Tools: `wifi_providers`, `wifi_scan`,
`wifi_network`, `wifi_summary`, `wifi_channels`, `wifi_issues`. See
[`docs/MCP.md`](MCP.md).

---

## 9. Flutter client (second UI)

A **Flutter** app under [`flutter/`](../flutter/) shares **`packages/scan_domain`**, **`packages/scan_core_client`**, and **`native/ScanCore`** on macOS with this Electron stack. Mobile and non-macOS desktop builds start in **demo fixtures** until platform adapters exist; capability limits (especially **iOS** vs CoreWLAN) are documented in [`docs/FLUTTER.md`](FLUTTER.md).
