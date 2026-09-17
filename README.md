# LV24 WiFi Explorer

**Private commercial** desktop Wi‑Fi scanner for macOS. Original LV24 product — clean room; not derived from third-party Wi‑Fi Explorer apps, vendor databases, or `.wifiexplorer` formats.

| | |
|--|--|
| **GitHub** | [LevapVeeskela/lv24-Wifi-Explorer](https://github.com/LevapVeeskela/lv24-Wifi-Explorer) — **private** |
| **Bundle ID** | `com.lv24.wifi-explorer` |
| **Stack** | Electron 33, Vite 8, React 19, MUI 9, MUI X Pro 8.11 |

Product docs: [`docs/SPEC.md`](docs/SPEC.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · [`docs/PERMISSIONS.md`](docs/PERMISSIONS.md) · [`docs/PARITY-GAP.md`](docs/PARITY-GAP.md)

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
