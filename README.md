# LV24 WiFi Explorer

**Private commercial** desktop Wi‑Fi scanner for macOS. Original LV24 product — clean room; not derived from third-party Wi‑Fi Explorer apps, vendor databases, or `.wifiexplorer` formats.

| | |
|--|--|
| **GitHub (planned)** | [LevapVeeskela/lv24-Wifi-Explorer](https://github.com/LevapVeeskela/lv24-Wifi-Explorer) — **private** |
| **Bundle ID** | `com.lv24.wifi-explorer` |
| **Stack** | Electron 33, Vite 8, React 19, MUI 9, MUI X Pro 8.11 |

Product docs: [`docs/SPEC.md`](docs/SPEC.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) · [`docs/PARITY-GAP.md`](docs/PARITY-GAP.md)

---

## Requirements

- macOS **13.5+** (for real CoreWLAN scan)
- Node **≥ 20**
- Package manager: **pnpm 9** (repo default). Yarn equivalents listed below as placeholders.

---

## How to run

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

1. Copy **`VITE_MUI_LICENSE_KEY`** into `.env.local` from the **lv24 city frontend** `.env.local` (org MUI X v8 key).  
2. **Never commit** `.env.local` or paste the key into chat, logs, CI output, or screenshots.  
3. `pnpm dev` starts Vite on **5173** and Electron; without signed ScanCore + Location, the app uses **demo fixtures** (see [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md)).

Live scan locally (when helper is built and signed):

```bash
pnpm run build:scancore
pnpm run dev:electron -- --live
```

---

## Scripts

### pnpm (authoritative — see `package.json`)

| Script | Purpose |
|--------|---------|
| `pnpm dev` | Vite + Electron |
| `pnpm dev:electron` | Electron only (after Vite up) |
| `pnpm build` | Main/preload + renderer production build |
| `pnpm typecheck` | TypeScript (app + electron) |
| `pnpm build:scancore` | Build `native/ScanCore` Swift helper |
| `pnpm test:scan` | Domain/scan unit tests |
| `pnpm dist:mac` / `dist:win` | electron-builder installers |

### yarn placeholders (if you standardize on yarn later)

| Placeholder | Maps to |
|-------------|---------|
| `yarn install` | `pnpm install` |
| `yarn dev` | `pnpm dev` |
| `yarn build` | `pnpm build` |
| `yarn electron:dev` | `pnpm dev:electron` |
| `yarn dist:mac` | `pnpm dist:mac` |

### electron CLI (examples)

```bash
# Development (from repo root after build)
cross-env WIFI_RENDERER_DEV_URL=http://localhost:5173 electron .

# Demo off (requires ScanCore + permissions)
electron . --live

# Packaged app (after dist)
open dist/mac/LV24\ WiFi\ Explorer.app
```

Env overrides: `WIFI_EXPLORER_DEMO=0`, `WIFI_RENDERER_DEV_URL`.

---

## MUI X license

Paid components: `@mui/x-data-grid-pro`, `@mui/x-license` pinned to **8.11.x**.

- Set **`VITE_MUI_LICENSE_KEY`** in `.env.local` only.  
- Wired in renderer via `applyMuiXLicense()` — do **not** log or print the key.  
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
