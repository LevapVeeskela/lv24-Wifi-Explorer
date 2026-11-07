# Architecture — Electron + ScanCore

LV24 WiFi Explorer splits **UI + domain** (TypeScript) from **macOS Wi‑Fi APIs** (Swift helper). Clean room: public CoreWLAN + CoreLocation only.

---

## 1. Process model

```text
┌─────────────────────────────────────────────────────────┐
│  Renderer (Vite + React + MUI)                          │
│  src/pages, widgets, features, domain, scan mappers     │
│  window.wifiExplorer ← preload contextBridge            │
└───────────────────────────┬─────────────────────────────┘
                            │ IPC invoke + events
┌───────────────────────────▼─────────────────────────────┐
│  Electron main (electron/main.ts, scanState.ts)        │
│  Spawn ScanCore, attach OUI, forward snapshots          │
└───────────────────────────┬─────────────────────────────┘
                            │ JSON Lines (stdio + optional UDS)
┌───────────────────────────▼─────────────────────────────┐
│  ScanCore.app (Swift, native/ScanCore)                  │
│  CWWiFiClient scan loop, LocationGate, pacing ≥ 3 s     │
└─────────────────────────────────────────────────────────┘
```

**Division of labor**

| Layer | Owns |
|-------|------|
| ScanCore | Raw `ScanSnapshot`: `CoreWlanNetworkRecord[]`, `AssociatedLink`, `location`, timing, `source`, errors |
| Electron main | Process lifecycle, OUI prefix map, demo/fixture loop, IPC to renderer |
| Renderer + `src/scan/` | `mapObservedBss`, merge, filters, charts, grid rows |

Bundled artifact: `ScanCore.app` copied by `electron-builder.yml` into app resources.

Build helper: `pnpm run build:scancore` → `native/ScanCore/.build/ScanCore.app`.

---

## 2. ScanCore transport

- **Default:** one JSON object per line on **stdout**; optional **UDS** at `$TMPDIR/lv24-wifi-scancore.sock`.
- **Optional TCP:** `127.0.0.1` only; peer must send `{"type":"auth","token":"..."}` from `hello.authToken`.
- **First line:** `hello` with `protocolVersion: 1`.
- **`--demo`:** one error with `demoFallback: true`, exit 0 → Electron loads fixtures.

Details: `native/ScanCore/README.md`.

---

## 3. IPC — renderer ↔ main

Preload: `electron/preload.ts` exposes `window.wifiExplorer`.

### 3.1 Invoke (renderer → main)

| Channel | Payload | Returns |
|---------|---------|---------|
| `scan:start` | — | `{ ok: true }` or `{ ok: false, error }` |
| `scan:stop` | — | `{ ok: true }` |
| `scan:setIntervalMs` | `{ ms: number }` | `{ ok, intervalMs }` (floor 3000 ms in main) |
| `permissions:query` | — | `{ location: string, demoMode: boolean }` |
| `permissions:openSettings` | — | `{ ok: true }` (macOS Location privacy URL) |
| `demo:enable` | — | `{ ok, demoMode: true }` |

### 3.2 Events (main → renderer)

| Channel | Payload |
|---------|---------|
| `scan:snapshot` | ScanCore payload + enrichments (see below) |
| `permissions:status` | `{ location, demoMode }` |

### 3.3 `scan:snapshot` enrichments (main)

| Field | When |
|-------|------|
| `source` | `'scancore'` \| `'fixtures'` |
| `demo` | `true` in fixture / demo mode |
Renderer resolves vendor via `resources/oui/registry.json` (`@/shared/lib/oui`) in `ingestScanPayload` → `ScanViewModel` → grid.

### 3.4 ScanCore ↔ main (JSON Lines)

Inbound to helper: `scan:start`, `scan:stop`, `scan:setIntervalMs`, `permissions:query`, `permissions:openSettings`, `demo:enable`, `shutdown`.

Outbound: `hello`, `permissions:status`, `helper:status`, `scan:snapshot`, `error`.

`scan:snapshot.payload` matches domain `ScanSnapshot` shape (`networks` as `CoreWlanNetworkRecord[]`, not full `ObservedBss`).

---

## 4. Data flow (live path)

1. User starts scan → main `startScanLoop`.
2. If `demoMode` or helper missing → fixture timer (`source: 'fixtures'`).
3. Else spawn ScanCore → on each `scan:snapshot`, main runs OUI attach → `webContents.send('scan:snapshot', …)`.
4. Renderer maps records → `ObservedBss[]`, applies filters, updates charts/history.

Merge/stale rules: `src/scan/mergeSnapshots.ts` (session state in view model).

---

## 5. Fallback tiers A–F

When live scan cannot deliver full data, degrade in order — label UI honestly.

| Tier | Trigger | Behavior |
|------|---------|----------|
| **A — Full** | Location granted + `scanForNetworks` succeeds | All fields; `source: scanForNetworks` |
| **B — Cached** | Scan throttled / in-flight | `cachedScanResults()` with `stale: true` |
| **C — Connected only** | Full scan failed; Wi‑Fi associated | Single row from `CWInterface` (SSID/BSSID/RSSI/channel) |
| **D — Location denied** | TCC denied / restricted | Redact SSID/BSSID/country; show RF if API returns |
| **E — Demo / fixture** | `--demo`, unsigned helper, missing binary, helper crash, `demoFallback: true` | Bundled fixtures; banner **Demo data** |
| **F — Manual import** | User provides Apple Wireless Diagnostics export (future) | Parse locally; no private CLIs |

**Never:** spoof Location, bundled deprecated `airport`, monitor mode in v1.

Electron wiring today: **E** via `demoMode` / argv (`--live` opts out), helper exit → fixture loop; **A–D** inside ScanCore snapshot `source` + `location` fields.

---

## 6. Repo map (implementation)

| Path | Role |
|------|------|
| `electron/` | Main, preload, CSP, `scanCoreHost`, `scanState`, OUI attach |
| `native/ScanCore/` | Swift helper + entitlements |
| `src/domain/` | Shared types (contract with ScanCore JSON) |
| `src/scan/` | Map raw → `ObservedBss`, tests |
| `src/features/scan-live/` | IPC ingest |
| `src/vendor/` | OUI registry |
| `data/oui/` | Bundled IEEE snapshot |

---

## 7. Security notes (IPC)

- Helper listens loopback only; token auth on socket/TCP.
- No cloud upload of scan results by default.
- Crash/analytics: avoid raw BSSID logging (hash or strip).

See also `docs/PERMISSIONS.md`.

---

## 8. Flutter client (second UI)

A **Flutter** app under [`flutter/`](../flutter/) shares **`packages/scan_domain`**, **`packages/scan_core_client`**, and **`native/ScanCore`** on macOS with this Electron stack. Mobile and non-macOS desktop builds start in **demo fixtures** until platform adapters exist; capability limits (especially **iOS** vs CoreWLAN) are documented in [`docs/FLUTTER.md`](FLUTTER.md).
