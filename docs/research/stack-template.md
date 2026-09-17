<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: ba4a3091-2b77-4190-a1e5-406a1c4d40b0.jsonl -->

# Stack template / copy recipe

## Executive finding

A full scan of `/Users/veeskela/Projects` shows **no Electron, Tauri, `electron-vite`, or `electron-builder` project on disk**. Parser desktops are **documented** (`lv24/main/docs/plans/2026-07-06-place-model-enrichment.md` → `desktop/electron/main.js`, `registerDesktopIpc()`) but **not present**—only gitignored stubs:

- `/Users/veeskela/Projects/lv24/google-parser/.env.local`
- `/Users/veeskela/Projects/lv24/yandex-parsers/.env.local`

So the “best template” is the **closest Vite + MUI + MUI X sibling**, plus small borrowings for license bootstrap, env hygiene, and product-repo layout.

---

## Inventory (what exists where)

| Pattern | Found? | Location |
|--------|--------|----------|
| `lv24-*` package names | Yes | `lv24-identity`, `lv24-docs` |
| Vite + React 19 + TS 5.9 | Yes | `lv24/main/frontend`, `IMS/main/frontend` |
| MUI Material **9.2** + X **8.11** + `@mui/x-license` | Yes | both frontends above |
| `@mui/x-charts` | **Only lv24 city FE** | `lv24/main/frontend` (`HostMonitorPage` `LineChart`) |
| `@mui/x-data-grid-pro` | Yes | lv24 + IMS |
| MUI **7** (no X) | Yes | `lv24/main/docs/docs-app` (ESLint stack—not a good desktop donor) |
| `electron-vite` / `electron-builder` / `electron-builder.yml` | **None** | — |
| GitHub Actions CI | **One workflow** | `/Users/veeskela/Projects/lv24-identity/.github/workflows/ci.yml` |
| macOS `.entitlements` (location/network) | **None for desktop** | closest: Flutter `Info.plist` location strings under `lv24/main/mobile/app/ios/` |
| Tauri | **None** | — |

**`package.json` naming in ecosystem:** standalone products use **`lv24-<product>`** (e.g. `"name": "lv24-identity"`, `"name": "lv24-docs"`). City FE is still `"name": "frontend"` inside monorepo; IMS uses `"ims-frontend"`.

**MUI pin policy (both lv24 + IMS):** Material **9.x**, commercial X **8.11 only** (paid X 9.x → `NotValidForPackage`). Both use `resolutions`/`yarn` or npm overrides pattern on `@mui/x-data-grid-pro` + `@mui/x-license`.

---

## Recommended single structural template

### Primary: `/Users/veeskela/Projects/lv24/main/frontend`

**Why this one (not IMS, not docs-app, not lv24-identity):**

1. **Only sibling with DataGrid Pro and Charts together** at the same pins you want for a WiFi explorer (tables + signal/time-series charts). Reference: `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/index.tsx` (`@mui/x-charts/LineChart`).
2. **Richest MUI X desk layer**: `AdminDataGridPro`, `adminDataGridPolicy`, locale, responsive policy—closer to a network-scan results UI than IMS’s thinner `StaffDataGrid`.
3. **Same stack pins as IMS** (Vite 8.1.5, React 19.2.8, oxlint/oxfmt, Vitest) but **proven chunking** for heavy optional vendors (`vite.config.ts` `manualChunks` comments explicitly warn about Data Grid / shell cycles—relevant when Electron loads one renderer bundle).
4. **Documented MUI license + Docker fail-closed** in lv24 ops (`infra/frontend.Dockerfile`, `infra/.env.example` comments)—even if Wifi Explorer skips Docker, the env contract is the house standard.
5. **Identity docs already assume Electron PKCE clients** (`lv24-identity/docs/ARCHITECTURE.md`)—Wifi Explorer fits the lv24 product line, not IMS.

**What it does *not* give you:** Electron main/preload, `electron-builder`, macOS entitlements, or CI for a desktop artifact—you must add those (historically they lived in absent `google-parser` repos).

### Secondary borrowings (not the main clone root)

| Donor | Take |
|-------|------|
| `/Users/veeskela/Projects/IMS/main/frontend` | `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts` + `main.tsx` calling `applyMuiXLicense()` **before** render (cleaner for a desktop app that always uses Pro grids/charts, vs lv24’s license only on first `AdminDataGridPro` import). |
| `/Users/veeskela/Projects/lv24-identity` | Repo shape: root `package.json` `"name": "lv24-…"`, `.gitignore` (`.env`, `.env.local`, `*.pem`), `.github/workflows/ci.yml` as a **skeleton** (adapt to `yarn check` + electron unit tests). |
| `/Users/veeskela/Projects/lv24/main/mobile/app/ios/Runner/Info.plist` | **Concept only** for `NSLocationWhenInUseUsageDescription` when you add macOS plist/entitlements for WiFi/geo-adjacent APIs—not copy verbatim. |

**Runner-up:** `/Users/veeskela/Projects/IMS/main/frontend` if you want a **minimal** staff SPA (no charts, simpler grids, `@/` alias only)—faster to strip, but you’d **add `@mui/x-charts` from scratch** and lose lv24’s chart + admin grid policy examples.

---

## Theme, license, DataGrid, Charts (concrete paths)

**Theme (lv24 Sunset + CSS variables):**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/index.ts`
- Supporting: `ColorSchemeSync`, `theme`-related types under `src/shared/lib/theme/` (grep `muiXThemeAugmentation` if present)

**License bootstrap (pick hybrid):**

- **Copy pattern from IMS:** `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts`, wire in renderer entry (equivalent of `main.tsx`).
- **Optional lazy pattern from lv24:** `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/index.tsx` (sets key on module load).
- **Pin test:** copy `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/muiXGridLicensePin.test.ts` (or IMS’s twin).

**DataGrid:**

- Wrapper: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/` (+ `styles.ts`)
- Policy: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/adminDataGridPolicy/`
- Locale: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/dataGridLocale/`
- Example desk: any `src/pages/admin/*Page` using `AdminDataGridPro` (e.g. business/promo desks)

**Charts:**

- `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/index.tsx` (`LineChart`, time axis, multi-series)

**Date pickers (if needed):**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/PickersLocaleProvider/index.tsx`
- IMS alternative: `/Users/veeskela/Projects/IMS/main/frontend/src/shared/ui/PickersProvider`

---

## Env files and secrets (house pattern)

| Layer | lv24 city | IMS | lv24-identity |
|-------|-----------|-----|----------------|
| Local secrets | `frontend/.env`, `frontend/.env.local` (gitignored via `*.local` + root rules) | same | `.env`, `.env.local` at repo root + `apps/api/.env` |
| Tracked template | `frontend/.env.example` (no license line—see infra) | `infra/.env.example` with empty `VITE_MUI_LICENSE_KEY=` | `apps/api/.env.example` |
| MUI key var | `VITE_MUI_LICENSE_KEY` | same | N/A |
| CI/build fail if key empty | `infra/frontend.Dockerfile` RUN guard + compose `:?` | `IMS/main/frontend/Dockerfile` + compose | N/A |

For **Wifi Explorer (Electron)**, mirror lv24/IMS: **tracked** `.env.example` with commented `VITE_MUI_LICENSE_KEY=`; real key only in `.env.local`; optional `electron-builder` env for signing secrets (`APPLE_ID`, `CSC_LINK`, etc.) **never committed**. Reuse lv24-identity `.gitignore` lines for `.env`, `*.pem`, `*.key`.

**Note:** stub parser `.env.local` files under `lv24/google-parser` and `lv24/yandex-parsers` contain a real key on disk—treat as secrets; do not commit or copy into a new repo.

---

## GitHub Actions / electron-builder / macOS entitlements

- **Actions:** only `/Users/veeskela/Projects/lv24-identity/.github/workflows/ci.yml` (Node 20, `npm ci`, `npm run ci`, Postgres via compose). **lv24/main has no `workflows/*.yml`.**
- **`electron-builder.yml`:** **zero files** under Projects.
- **macOS entitlements:** **none** for Electron. For WiFi/location you will **author** something like:
  - `com.apple.security.network.client` (outbound)
  - optionally location usage description in `Info.plist` (pattern from mobile: `/Users/veeskela/Projects/lv24/main/mobile/app/ios/Runner/Info.plist` `NSLocationWhenInUseUsageDescription`)
  - WiFi scan may need **Additional Capabilities** / location / “Access WiFi Information” depending on API—no prior art in this workspace.

Docs that mention **electron-builder drift** (worker Docker, not desktop): `/Users/veeskela/Projects/lv24/main/infra/places-refine.Dockerfile` comments.

---

## README / LICENSE norms

- **README:** product repos use long README + `docs/` index (`lv24-identity/README.md`, `lv24/main/frontend/README.md` quick start + pin table). IMS README stresses filling `VITE_MUI_LICENSE_KEY` without printing it.
- **LICENSE:** no standard lv24 frontend LICENSE file; **only** notable repo LICENSE in tree is **MPL-2.0** at `/Users/veeskela/Projects/ferrum-enterprise/LICENSE`. lv24-identity README states **private commercial**—match that for Wifi Explorer unless you choose otherwise.

---

## Recommended `package.json` identity

```json
{
  "name": "lv24-wifi-explorer",
  "productName": "LV24 WiFi Explorer",
  "version": "0.1.0",
  "private": true,
  "description": "LV24 desktop WiFi exploration tool (Electron + Vite + MUI)"
}
```

- **`name`:** npm-style lowercase `lv24-wifi-explorer` (consistent with `lv24-identity`, `lv24-docs`).
- **`productName`:** human/electron-builder menu name **LV24 WiFi Explorer** (folder may stay `lv24-Wifi-Explorer` on disk).
- After adding Electron, expect **new** scripts (`dev`, `build`, `dist`) and deps (`electron`, `electron-builder` or `electron-vite`)—none exist to copy locally.

---

## Copy-recipe (absolute paths)

**Target (suggested):** `/Users/veeskela/Projects/lv24-Wifi-Explorer/`  
**Primary donor:** `/Users/veeskela/Projects/lv24/main/frontend/`

### A. Copy (then trim/rename)

**Tooling / scaffold**

- `/Users/veeskela/Projects/lv24/main/frontend/tsconfig.json`
- `/Users/veeskela/Projects/lv24/main/frontend/tsconfig.app.json`
- `/Users/veeskela/Projects/lv24/main/frontend/tsconfig.node.json`
- `/Users/veeskela/Projects/lv24/main/frontend/index.html`
- `/Users/veeskela/Projects/lv24/main/frontend/.gitignore`
- `/Users/veeskela/Projects/lv24/main/frontend/vite.config.ts` → **simplify** `manualChunks` if renderer stays small; keep comments if you lazy-load grid/charts
- `/Users/veeskela/Projects/lv24/main/frontend/vitest.config.ts` (if present) or IMS `/Users/veeskela/Projects/IMS/main/frontend/vite.config.ts` `test` block
- `/Users/veeskela/Projects/lv24/main/frontend/.yarnrc.yml` **only if** you standardize on Yarn 4 like lv24; else IMS uses Yarn 1—pick one

**MUI core**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/index.ts` (+ any co-located theme augmentation `.d.ts` under `theme/`)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/ColorSchemeSync/` (if using lv24 dark/light)
- `/Users/veeskela/Projects/lv24/main/frontend/src/vite-env.d.ts` → **trim** to Wifi-relevant `VITE_*` keys

**MUI X – license + grid + charts**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/` (entire folder)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/adminDataGridPolicy/` (entire folder)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/dataGridLocale/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/adminDataGridLikeFilter/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/applyAdminInlineHeaderSearch/` (optional; drop if no inline header search)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/muiXGridLicensePin.test.ts`
- **From IMS (merge):** `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts`
- **Chart reference page (copy as `src/pages/` starter or docs-only):** `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/index.tsx` + its local `styles`/helpers **only after** stripping admin API deps

**Pickers (optional)**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/PickersLocaleProvider/`

**Test harness**

- `/Users/veeskela/Projects/IMS/main/frontend/src/test/setup.ts` and `/Users/veeskela/Projects/IMS/main/frontend/src/test/render.tsx` (lighter than lv24’s map-heavy tests)

**Repo hygiene (from identity)**

- `/Users/veeskela/Projects/lv24-identity/.gitignore` (merge with frontend `.gitignore`)
- `/Users/veeskela/Projects/lv24-identity/.github/workflows/ci.yml` (rewrite steps for your package manager + tests)

### B. Rewrite from scratch (do not copy city monolith)

- `/Users/veeskela/Projects/lv24/main/frontend/package.json` → new name, **add Electron** deps/scripts; **drop** deck.gl, maplibre, three, `@lv24/*` workspace packages, locale shard scripts
- `/Users/veeskela/Projects/lv24/main/frontend/src/app/App.tsx` → minimal routes (explorer home, scan results, settings)
- `/Users/veeskela/Projects/lv24/main/frontend/src/main.tsx` (or lv24 entry path)—**add** `applyMuiXLicense()` from IMS
- All of `src/pages/`, `src/widgets/`, `src/features/` except borrowed admin/chart **skeleton**
- `README.md`, `LICENSE`, product `docs/`
- **Entire Electron layer:** `electron/main.ts`, `preload.ts`, IPC for WiFi APIs, `electron-builder` config (yml or `package.json` `build` section)
- macOS `entitlements.mac.plist`, hardened runtime, notarization env docs
- `.env.example` for Wifi Explorer (include `VITE_MUI_LICENSE_KEY=` comment only)
- GitHub Actions: build matrix (mac/win/linux) + **secrets** for signing

### C. Do **not** copy

- `/Users/veeskela/Projects/lv24/main/frontend/src/i18n/` locale shards + Python rebuild scripts (unless you need ru/en/zh at v1)
- Map/deck/Leaflet/battlefield assets under `public/`
- Sentry, SEO, analytics, identity OIDC wiring from `.env.example`
- `/Users/veeskela/Projects/lv24/main/infra/*` Docker bake (optional later)
- `/Users/veeskela/Projects/lv24/main/docs/docs-app/` (MUI 7 + ESLint—different generation)
- `/Users/veeskela/Projects/lv24/google-parser/.env.local` / `yandex-parsers/.env.local` (secrets + wrong product)

### D. `package.json` dependency slice to **preserve from lv24 frontend** (versions as pinned there)

From `/Users/veeskela/Projects/lv24/main/frontend/package.json`:

- `@mui/material`, `@mui/icons-material`, `@mui/system` **9.2.0**
- `@mui/x-data-grid-pro`, `@mui/x-license`, `@mui/x-charts` **8.11.0**
- `@emotion/react`, `@emotion/styled`
- `react`, `react-dom` **19.2.8**
- `vite` **8.1.5**, `@vitejs/plugin-react` **6.0.4**, `typescript` **5.9.3**
- `oxlint`, `oxfmt`, `vitest` (tooling parity)
- `resolutions` block for `@mui/x-data-grid*` / `@mui/x-license`

Add net-new: `electron`, `electron-builder` *or* `electron-vite`, `@types/node` for main process.

---

## Tauri vs Electron

No Tauri reference implementation exists under Projects. Ecosystem docs assume **Electron + React/MUI/Vite** for parser desktops. For **Wifi Explorer**, staying on **Electron** matches documented IPC/runbook language; Tauri would be greenfield with no sibling template.

---

## Summary

**Best structural template:** `/Users/veeskela/Projects/lv24/main/frontend` — only local source of **Vite 8 + MUI 9 + X Data Grid Pro + X Charts 8.11** with production-grade grid policy and a real `LineChart` desk. **Electron packaging, CI for installers, and macOS entitlements are absent**; merge **IMS** license entry bootstrap and **lv24-identity** repo/CI/env-ignore patterns, then implement the shell and WiFi IPC net-new (optionally restoring desktop code from the missing `google-parser` repo if it exists elsewhere on your machine).

[REDACTED]
