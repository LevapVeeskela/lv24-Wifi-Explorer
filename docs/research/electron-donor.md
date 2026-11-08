<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: d1bd06d8-84f2-41d8-90d6-1bc7d070ee09.jsonl -->

# Electron donor notes

## 1. Repo metadata (`gh repo view`)

| Field             | Value                                            |
| ----------------- | ------------------------------------------------ |
| **name**          | `lv24-desktop-cv`                                |
| **description**   | LV24 CV desktop Electron app                     |
| **isPrivate**     | `true`                                           |
| **defaultBranch** | `main`                                           |
| **url**           | https://github.com/LevapVeeskela/lv24-desktop-cv |

## 2. Layout (no full clone)

Monorepo (pnpm), not a flat `electron/` app:

```
package.json, pnpm-workspace.yaml, pnpm-lock.yaml, .nvmrc
apps/desktop/          ← sole Electron app (@lv24-desktop-cv/desktop)
infra/electron-builder.yml
docs/, scripts/, .github/workflows/verify.yml
```

There is **no** top-level `electron/` directory. Main/preload live under `apps/desktop/src/`. Renderer is `apps/desktop/renderer/`. **No entitlements, no Info.plist** anywhere in the recursive tree.

## 3. Stack & versions

| Layer                | Details                                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------------- |
| **Package manager**  | pnpm **9.15.0**, Node ≥20                                                                       |
| **Electron**         | **33.2.1**                                                                                      |
| **electron-builder** | **25.1.8**                                                                                      |
| **electron-updater** | **6.6.2**                                                                                       |
| **Vite**             | **8.1.4** (`root: renderer`, dev port **5175**)                                                 |
| **MUI**              | `@mui/material` **9.2.0**, `@mui/icons-material` **9.2.0**                                      |
| **MUI X (paid)**     | `@mui/x-data-grid-pro` **8.11.0**, `@mui/x-license` **8.11.0** (root `pnpm.overrides` pin 8.11) |
| **React (desktop)**  | **18.3.1** (city `lv24/main/frontend` is **19.2.8** + yarn)                                     |
| **Native**           | `better-sqlite3` + `@electron/rebuild` (CV offline cache — likely irrelevant to Wifi Explorer)  |

**MUI license wiring:** `apps/desktop/renderer/src/main.tsx` — `LicenseInfo.setLicenseKey(import.meta.env.VITE_MUI_LICENSE_KEY)`; Vite `envDir` = `apps/desktop`; README says copy key from `main/frontend/.env.local`. Guard test: `apps/desktop/renderer/src/muiXGridLicensePin.test.ts`.

## 4. macOS packaging

From `infra/electron-builder.yml`:

- **appId:** `by.lv24.desktop.cv`
- **mac:** DMG, **x64 + arm64**, `hardenedRuntime: true`
- **No** `entitlements`, `entitlementsInherit`, notarization, or custom Info.plist
- Windows: NSIS; signing explicitly off for local CI (`signAndEditExecutable: false`)
- Publish/auto-update feed commented out; README treats Apple/EV signing as **residual**

**Gap:** `apps/desktop/package.json` runs `electron-builder --mac dmg` with **no** `--config ../../infra/electron-builder.yml` and no `"build"` block in package.json — confirm config path when you adopt this.

## 5. IPC & security pattern

- **Preload:** `contextBridge.exposeInMainWorld('cvDesktop', { … ipcRenderer.invoke … })` — `apps/desktop/src/preload.ts`
- **Main:** many `ipcMain.handle('cv:…')` handlers + auth/settings/updater modules — `apps/desktop/src/main.ts`
- **Window:** `contextIsolation: true`, `nodeIntegration: false`, `sandbox: true` — `apps/desktop/src/window.ts`
- **CSP** injected in main — `apps/desktop/src/csp.ts`
- **Auth:** tokens in main + `safeStorage`; renderer only sees status flags (documented in README)

Types for the bridge: `apps/desktop/renderer/src/types/cvDesktop.d.ts`.

## 6. vs `lv24/main/frontend`

|              | **lv24-desktop-cv**             | **lv24/main/frontend**                  |
| ------------ | ------------------------------- | --------------------------------------- |
| Electron     | Yes, full shell                 | **No** — Vite SPA only                  |
| MUI versions | Matched 9.2 + X 8.11            | Same MUI pin policy                     |
| React        | 18.3.1                          | 19.2.8                                  |
| Tooling      | pnpm                            | yarn 4                                  |
| Domain       | Entire CV product + SQLite sync | Full city web app (maps, deck.gl, etc.) |

Bootstrapping Wifi Explorer from **main/frontend** would mean inventing Electron from scratch. This repo is the **only** LV24 Electron reference in scope.

---

# Verdict: **USE as Electron donor (selective)** — not **IGNORE**, not **clone whole repo**

**Use** it for: Vite+Electron layout, main/preload/tsconfig split, window hardening, CSP hook, electron-builder mac skeleton, MUI license bootstrap, dependency pins.

**Do not** use as: full app template (hundreds of CV-specific renderer/IPC files), macOS entitlements donor (none exist), or UI donor from city frontend without a deliberate React 18→19 choice.

### GitHub paths to copy/adapt (branch `main`)

**Infra / deps**

- `infra/electron-builder.yml`
- `package.json` (root `pnpm.overrides` for MUI X)
- `apps/desktop/package.json` (electron/vite/build scripts + versions)
- `apps/desktop/vite.config.ts`
- `apps/desktop/tsconfig.main.json`
- `apps/desktop/.env.local.example`

**Electron shell (patterns — rewrite bridge name & handlers for Wifi)**

- `apps/desktop/src/window.ts`
- `apps/desktop/src/csp.ts` (extend `connect-src` / entitlements for Wi‑Fi APIs as needed)
- `apps/desktop/src/preload.ts`
- `apps/desktop/src/main.ts` (trim to window + CSP + your IPC; drop CV/sqlite/auth unless needed)
- Optional security helpers: `ipcSanitize.ts`, `navigationPolicy.ts`

**MUI**

- `apps/desktop/renderer/src/main.tsx`
- `apps/desktop/renderer/src/muiXGridLicensePin.test.ts`

**CI reference (optional)**

- `.github/workflows/verify.yml`

### Explicitly **do not** bulk-copy

- `apps/desktop/renderer/src/features/cv/**`, pages, CV API IPC (`cvDraftIpc.ts`, `authIpc.ts`, `sqlite.ts`, etc.)
- `scripts/sync-cv-lib.ps1`, provenance/OpenAPI CV gates

### Versions to align Wifi Explorer with (unless you intentionally bump)

- **electron:** `33.2.1`
- **electron-builder:** `25.1.8`
- **@mui/material / icons:** `9.2.0`
- **@mui/x-data-grid-pro / @mui/x-license:** `8.11.0`
- **vite:** `8.1.x` (desktop uses `8.1.4`; city FE `8.1.5`)

**Wifi Explorer–specific gap:** you will need **new** macOS entitlements (and likely Info.plist usage strings) for network/Wi‑Fi scanning — this repo does not provide them; copying `hardenedRuntime: true` alone is not enough for privileged APIs.

[REDACTED]
