<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: 21b0473b-243e-4bf6-ac95-58b8f76342a6.jsonl -->

# MUI / LV24 playbook

# LV24 playbook for `lv24-Wifi-Explorer`

There is **no existing Electron, Tauri, or Wi‑Fi/network-scanner app** under `/Users/veeskela/Projects`. The closest thing to clone is **IMS staff web** (a greenfield LV24-family product), with **city admin desks** as the MUI/DataGrid/Charts source of truth.

---

## 1. Top-level inventory

| Path                                                 | What it is                                             | LV24-related?                      |
| ---------------------------------------------------- | ------------------------------------------------------ | ---------------------------------- |
| `/Users/veeskela/Projects/lv24`                      | Workspace wrapper (`AGENTS.md`, ideas, parsers)        | **Yes — ecosystem root**           |
| `/Users/veeskela/Projects/lv24/main`                 | City product monorepo (Vite SPA + Nest mesh + Flutter) | **Yes — canonical city**           |
| `/Users/veeskela/Projects/lv24-identity`             | Shared IdP (Nest, npm workspaces)                      | **Yes**                            |
| `/Users/veeskela/Projects/IMS`                       | Workspace (`ideas/`, `workspace-analysis/`)            | Family sibling, not named `lv24-*` |
| `/Users/veeskela/Projects/IMS/main`                  | Staff medical product cloned from LV24 form            | **Yes — closest new-app clone**    |
| `/Users/veeskela/Projects/ferrum-enterprise`         | Rust language/compiler workspace                       | No                                 |
| `/Users/veeskela/Projects/run-ios.sh` + iOS launcher | Flutter/iOS helper, not a repo                         | No                                 |

**Referenced in docs but not present on this Mac:**

- `C:\0project\lv24-ytk` — YTK (has a documented **desktop** OAuth client `ytk-desktop`)
- `C:\0project\lv24-code` — LV24 Code (VS Code / device-code client)

**Not product repos:** `/Users/veeskela/Projects/lv24/google-parser`, `/Users/veeskela/Projects/lv24/yandex-parsers`, `/Users/veeskela/Projects/lv24/ideas`, `/Users/veeskela/Projects/lv24/main/projects_for_ideas`.

---

## 2. Recommended stack (clone the closest sibling)

**Primary sibling:** `/Users/veeskela/Projects/IMS/main/frontend`  
Reason: it is the last greenfield LV24-family **standalone UI product** — FSD, Vite 8, React 19, MUI 9 + X Pro 8.11, MobX, oxlint/oxfmt, react-intl, AppBar shell + DataGrid desks.

**Overlay from city** (brand + grid policy + charts), not the whole city SPA:

- Sunset theme + fonts: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/`
- Admin grid policy: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/`
- Charts / live utility desk: `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/`

| Layer           | Pin                                                                                                               | Source                                                                                                 |
| --------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Runtime         | **Vite SPA in the browser** (not Electron/Tauri/Next)                                                             | All LV24 UIs                                                                                           |
| Bundler         | Vite **8.1.5**, `@vitejs/plugin-react` **6.0.4**                                                                  | IMS + city                                                                                             |
| UI              | React **19.2.8**, react-router-dom **7.18.1**                                                                     | IMS + city                                                                                             |
| Language        | TypeScript **5.9.3**, `strict`, path alias `@/*`                                                                  | IMS `tsconfig.app.json`                                                                                |
| State           | MobX **6.16.1** + `mobx-react-lite` **4.1.1**                                                                     | Both                                                                                                   |
| i18n            | `react-intl` **8.1.3** — default **ru**, add **en** (city also has **zh**)                                        | City if bilingual; IMS is ru-only                                                                      |
| UI kit          | `@mui/material` / `icons-material` / `system` **9.2.0** + Emotion **11.14.x**                                     | Org policy                                                                                             |
| Paid MUI X      | `@mui/x-data-grid-pro` + `@mui/x-license` **8.11.0** only                                                         | Org key = X **8**                                                                                      |
| Community X     | `@mui/x-charts` **8.11.0** (Host Monitor). Date pickers: city community **9.10.0**; IMS uses pickers-**pro** 8.11 | Prefer city community pickers unless you need range-pro                                                |
| Lint / format   | **oxlint 1.75.0** + **oxfmt 0.60.0** — do **not** resurrect ESLint/Prettier                                       | City + IMS. `/Users/veeskela/Projects/lv24/main/docs/docs-app` is stale (MUI 7 + ESLint)               |
| Package manager | **Yarn Classic 1.22.22**, exact versions, **no `^`/`~`**                                                          | IMS / city backend. City **frontend** is Yarn Berry **4.17.1** — only needed if you copy that lockfile |
| Node            | **20** (identity, IMS, most APIs). City FE Docker is **22** only because of MapLibre                              | Skip 22 unless you add MapLibre                                                                        |
| Electron        | **None in this workspace**                                                                                        | Greenfield if you wrap the SPA                                                                         |

**Do not copy:** deck.gl, MapLibre, Sentry/GA/Metrika, city IdP OIDC, `@lv24/*` city contracts, IMS clinical APIs.

---

## 3. MUI license wiring (do not print the key)

**One env name everywhere:** `VITE_MUI_LICENSE_KEY`

Org rule (city `AGENTS.md` §5g): commercial key is **MUI X major 8 only** (`planVersion=initial` / KV=2). Paid **9.x = `NotValidForPackage`**. Material community **9.x is OK**. Same key is intended for city, YTK, Code, and **future LV24 UIs**.

### Where the key lives (local, gitignored — do not commit)

| File                                                     | Role                         |
| -------------------------------------------------------- | ---------------------------- |
| `/Users/veeskela/Projects/lv24/main/frontend/.env`       | Host Vite                    |
| `/Users/veeskela/Projects/lv24/main/frontend/.env.local` | Host Vite (preferred)        |
| `/Users/veeskela/Projects/lv24/main/infra/.env`          | Docker bake                  |
| `/Users/veeskela/Projects/IMS/main/frontend/.env`        | Same org key, copied locally |
| `/Users/veeskela/Projects/IMS/main/frontend/.env.local`  | Same                         |
| `/Users/veeskela/Projects/IMS/main/infra/.env`           | IMS frontend image bake      |

Placeholders (safe to copy):

- `/Users/veeskela/Projects/lv24/main/infra/.env.example` — commented `# VITE_MUI_LICENSE_KEY=`
- `/Users/veeskela/Projects/IMS/main/infra/.env.example` — `VITE_MUI_LICENSE_KEY=` empty

**Not in** `/Users/veeskela/Projects/lv24/main/frontend/.env.example` (docs live in `/Users/veeskela/Projects/lv24/main/docs/FRONTEND-QUICKREF.md` instead).

The blob in those `.env` files is a **commercial MUI license**, not a public demo key. It is **not** supposed to be committed (`.env` / `.env.local` / `infra/.env` are gitignored). Do not treat it as public just because it is on disk.

### How it is applied

**IMS (simpler — copy this for an all-staff tool):**

1. `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts`  
   `import.meta.env.VITE_MUI_LICENSE_KEY` → trim → `LicenseInfo.setLicenseKey` from `@mui/x-license`.
2. `/Users/veeskela/Projects/IMS/main/frontend/src/main.tsx` imports `applyMuiXLicense()` before render (module also self-invokes).
3. `/Users/veeskela/Projects/IMS/main/frontend/src/vite-env.d.ts` declares `VITE_MUI_LICENSE_KEY?: string`.
4. `/Users/veeskela/Projects/IMS/main/frontend/vite.config.ts` copies the var into Vitest `env` and inlines `@mui/x-license` for tests.
5. `/Users/veeskela/Projects/IMS/main/frontend/Dockerfile` `ARG`/`ENV VITE_MUI_LICENSE_KEY` + fail if empty.
6. Pin proof: `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/muiXGridLicensePin.test.ts`.

**City (lazy — only when admin grids load):**

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/index.tsx` sets the key on first import so the **public map never pulls `@mui/x-license`**.
- Docker: `/Users/veeskela/Projects/lv24/main/infra/frontend.Dockerfile` + compose build-arg in `/Users/veeskela/Projects/lv24/main/infra/docker-compose.core.yml`.
- Pin proof: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/muiXGridLicensePin.test.ts`.
- `resolutions` in `/Users/veeskela/Projects/lv24/main/frontend/package.json` force `@mui/x-data-grid`, `-pro`, `@mui/x-license` to **8.11.0**.

**Docs drift:** `FRONTEND-QUICKREF.md` and some `AGENTS.md` lines still say `App.tsx` calls `LicenseInfo`. **City `App.tsx` does not.** Trust `AdminDataGridPro` / IMS `license.ts`.

### Recipe for Wifi Explorer

1. Copy the value from city `frontend/.env.local` (or `infra/.env`) into a **gitignored** `.env.local`. Never commit it; never log it.
2. Pin Material **9.2.0** + Data Grid Pro / `@mui/x-license` **8.11.0** + yarn `resolutions`.
3. Use IMS `license.ts` if the whole app is a scanner desk. Use the city AdminDataGridPro pattern only if you later add a public surface.
4. Copy `muiXGridLicensePin.test.ts` and `vite-env.d.ts`.
5. Community packages can track latest **free** MUI (Material 9.x, community charts/pickers). **Do not** bump paid Pro/Premium to 9.
6. If you only need community `@mui/x-data-grid` (no Pro), you can skip the key — but then you lose pin/export/premium chrome that every LV24 desk uses.

---

## 4. UI conventions

### Theme

City **Sunset** (`/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/index.ts`):

- `cssVariables.colorSchemeSelector: 'class'`
- Light/dark `colorSchemes` (coral `#CE4420` / `#FB6E4A`, violet secondary, warm stone paper)
- `shape.borderRadius: 10`, buttons `minHeight: 44`, `textTransform: 'none'`
- Flat AppBar (no shadow), cards outlined, DataGrid paper tokens for MUI X v8
- Reduced-motion: **transitions only**, never kill infinite animations

IMS theme is a **teal medical** restyle of the same cssVariables pattern — do **not** use it if the product is branded LV24. Copy Sunset.

Fonts (city only):

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/productFonts.css`
- Manrope Variable (Cyrillic + Latin + ₽) + Plus Jakarta Sans (display/Latin)
- Packages: `@fontsource-variable/manrope` **5.3.0**, `plus-jakarta-sans` **5.3.0`
- Import subsets, not the full barrel
- IMS uses `system-ui` — weaker match

Theme toggle:

- City: light | dark | **system | auto** (time-of-day), storage key `mode`, event `lv24-color-scheme-change`  
  `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/ColorSchemeToggle/`  
  `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/preferences/colorSchemePreference.ts`
- IMS: light/dark only, `ims.theme` + FOUC script in `index.html`

For Wifi Explorer: city Sunset + either city 4-way toggle or IMS 2-way. Storage key like `lv24.wifi-explorer.theme` (follow `lv24.*` / `ims.theme`).

### Layout

| Pattern                            | Path                                                                                  | Use                                |
| ---------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------- |
| Simple AppBar + Container          | `/Users/veeskela/Projects/IMS/main/frontend/src/widgets/layout/StaffShell/`           | Best day-1 shell                   |
| Staff drawer + AppBar + `md` fence | `/Users/veeskela/Projects/lv24/main/frontend/src/widgets/AdminLayout/`                | Only if many desks                 |
| Fill-height grid desk              | `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/adminFillLayout/index.tsx` | Scanner table                      |
| Canonical grid page                | `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/NewsListPage/index.tsx`  | Copy this, not a raw `DataGridPro` |
| Live gauges + `LineChart`          | `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/`        | Closest “utility/scanner” UI       |

Density: default comfortable; `AdminDataGridPro` `responsive` → compact below `md`, hide inline search below `sm`. Touch targets stay 44px.

### DataGrid / Charts

City `AdminDataGridPro`: license on import, ru/en/zh chrome, pin `__check__` left / `actions` right, pageSize 25, inline header LIKE search, `headerFilters` off, pagination on, fill parent height.

IMS `StaffDataGrid` is a thinner wrapper (`autoHeight`, toolbar, ru locale only) — fine for v1 lists.

Charts: community `@mui/x-charts/LineChart` on Host Monitor only. **No Charts Pro** in the repo.

### Component / style rules

- FSD: `app → pages → widgets → features → entities → shared`; imports only downward; slice `index.ts`
- Styles **only** in `styles.ts` / `*.styles.ts` — no `sx={{}}` / `style={{}}` in components
- Scheme-safe alpha: `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/schemeSx.ts` (`paperAlpha`, never `alpha('#fff')` or `theme.palette.mode` branches)
- Icons: path imports (`@mui/icons-material/Wifi`) — never the barrel
- Selects with >8 options → `Autocomplete`
- Theme type-only X augmentations: `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/muiXThemeAugmentation.d.ts` (do not import X from the runtime theme file)

### i18n

- City: `ru` / `en` / `zh`, shards staff vs public, `react-intl`
- IMS: `APP_LOCALE = 'ru'` in `/Users/veeskela/Projects/IMS/main/frontend/src/shared/i18n/index.ts`
- Identity hosted pages: `en` default, `ru`, `zh-CN`
- DataGrid ru pack needs a `paginationDisplayedRows` patch (official 8.11 footer stays English)

Recommend **ru default + en** for a tool; skip zh unless you want city parity.

---

## 5. Folder / tooling conventions

**New-product disk layout (IMS, preferred):**

```
/Users/veeskela/Projects/lv24-wifi-explorer/   # workspace; ideas stay out of git
  ideas/
  main/                                        # THE git repo
    AGENTS.md
    README.md
    frontend/                                  # Vite app
    docs/plans/
```

City uses the same `…/lv24/main` split. Identity is repo-at-root (API-only).

**Frontend FSD (IMS):**

`/Users/veeskela/Projects/IMS/main/frontend/src/{app,pages,widgets,features,entities,shared,test}`

City also has leftover `components/`, `stores/`, `services/` — do not revive those.

**Lint/format configs to copy:**

- `/Users/veeskela/Projects/IMS/main/frontend/.oxlintrc.json`
- `/Users/veeskela/Projects/IMS/main/frontend/.oxfmtrc.json` (printWidth 100, singleQuote, LF)
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.json`
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.app.json`
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.node.json`
- `/Users/veeskela/Projects/IMS/main/frontend/src/test/setup.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/test/render.tsx`

**CI:**

- City: **GitLab** `/Users/veeskela/Projects/lv24/main/.gitlab-ci.yml` — no GitHub Actions
- Identity: GitHub Actions `/Users/veeskela/Projects/lv24-identity/.github/workflows/ci.yml` (Node 20, `npm ci`) **and** GitLab
- IMS: **no** `.github/workflows`

For a small tool: copy identity’s GitHub Actions shape, but run **yarn** + `oxlint`/`vitest` like IMS.

**README style:** short Russian/English lock table, architecture box, local `copy .env.example`, “do not print secrets”. IMS README is the right length; city README is a dump — do not clone it.

**Commits:** `[IMS](<area>) - …` / city equivalent — **not** Conventional Commits. Use `[Wifi](<area>) - …` or `[LV24](wifi) - …`.

**Versions:** pin exact. Yarn `resolutions` for `@mui/x-license` / grid 8.11.

---

## 6. Desktop / scanner architecture — what exists

**Nothing to clone for main/renderer/IPC/native addons.**

| Candidate                                           | Why it is not a shell                                                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| City + IMS frontends                                | Browser Vite SPAs behind nginx                                                                                                   |
| Flutter `/Users/veeskela/Projects/lv24/main/mobile` | iOS/Android product; Windows runner is dogfood only; **no macOS desktop**                                                        |
| YTK desktop                                         | Only an OAuth `ytk-desktop` loopback client in `/Users/veeskela/Projects/lv24-identity/docs/PRODUCTS.md` — **repo missing here** |
| Host Monitor                                        | Staff **web** desk: poll + `LineChart` + MUI Table — closest **UX**, still HTTP                                                  |

**Practical architecture for Wifi Explorer:**

1. Day 1: IMS-shaped Vite renderer (AppBar + DataGrid of APs/clients + optional Host Monitor charts).
2. Native scan: **greenfield** (macOS CoreWLAN / `wdutil`, Windows WLAN API). No shared native package.
3. If you wrap later: keep the Vite app as the UI; invent the shell. There is no LV24 Electron IPC convention.

---

## 7. GitHub / org naming

From `.git/config` (git CLI is broken on this Mac due to Xcode license; remotes still readable):

| Repo     | `origin`                                         | Extra                                                |
| -------- | ------------------------------------------------ | ---------------------------------------------------- |
| City     | `git@github.com:LevapVeeskela/lv24.git`          | `gitlab` = `git@gitlab.com:lv24-company/lv24.git`    |
| Identity | `git@github.com:LevapVeeskela/lv24-identity.git` | GitLab deploy exists; no second remote in this clone |
| IMS      | `git@github.com:LevapVeeskela/IMS.git`           | GitHub only                                          |

`package.json` `repository` fields are **not** used for first-party apps (only a vendored MCP). Flutter packages incorrectly say `https://github.com/lv24/lv24` — ignore that; real GitHub user is **`LevapVeeskela`**.

**How they create repos:** no `gh repo create` script in-tree. Pattern: private repo on **personal** `LevapVeeskela`, SSH origin, optional GitLab `lv24-company` + `/Users/veeskela/Projects/lv24/main/infra/scripts/git-push-dual.ps1` (city-only).

**Recommended names:**

| Surface                                             | Name                                                                         |
| --------------------------------------------------- | ---------------------------------------------------------------------------- |
| Disk folder                                         | `/Users/veeskela/Projects/lv24-wifi-explorer` (kebab, like `lv24-identity`)  |
| Git repo                                            | `lv24-wifi-explorer` (user-typed `lv24-Wifi-Explorer` will fight GitHub)     |
| GitHub                                              | `git@github.com:LevapVeeskela/lv24-wifi-explorer.git`                        |
| GitLab (optional)                                   | `git@gitlab.com:lv24-company/lv24-wifi-explorer.git`                         |
| `package.json` `name`                               | `lv24-wifi-explorer`                                                         |
| IdP `product_id` (only if you join the suite later) | `wifi` / `wifi-explorer` — not registered today (`city`, `code`, `ytk` only) |

Default branch: city/identity `master` + `develop`; IMS `master` only.

---

## 8. Node / shared packages

- **Node 20** everywhere except city frontend image (Node 22 + MapLibre). No `.nvmrc`.
- **Electron:** none.
- City internal packages (do **not** take unless you talk to city APIs):  
  `/Users/veeskela/Projects/lv24/main/packages/{assistant-contract,realtime-client,realtime-contract,mailer-contract,provider-proxy-contract}` as `@lv24/*` `file:` deps.
- Identity: `/Users/veeskela/Projects/lv24-identity/packages/sdk` (`@lv24-identity/sdk`) — only if this app becomes an RP.
- IMS: `/Users/veeskela/Projects/IMS/main/packages/*` — medical contracts, irrelevant.

---

## 9. Exact files to copy as boilerplate

### Skeleton (IMS)

- `/Users/veeskela/Projects/IMS/main/frontend/package.json`
- `/Users/veeskela/Projects/IMS/main/frontend/vite.config.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.json`
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.app.json`
- `/Users/veeskela/Projects/IMS/main/frontend/tsconfig.node.json`
- `/Users/veeskela/Projects/IMS/main/frontend/.oxlintrc.json`
- `/Users/veeskela/Projects/IMS/main/frontend/.oxfmtrc.json`
- `/Users/veeskela/Projects/IMS/main/frontend/index.html` (rewrite title + storage key)
- `/Users/veeskela/Projects/IMS/main/frontend/src/main.tsx`
- `/Users/veeskela/Projects/IMS/main/frontend/src/app/App.tsx` (strip clinical routes)
- `/Users/veeskela/Projects/IMS/main/frontend/src/app/providers/ColorSchemeSync.tsx`
- `/Users/veeskela/Projects/IMS/main/frontend/src/widgets/layout/StaffShell/`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/ui/ThemeToggle/`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/themeStore.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/schemeSx.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/muiXGridLicensePin.test.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/dataGridLocale.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/ui/StaffDataGrid/`
- `/Users/veeskela/Projects/IMS/main/frontend/src/shared/i18n/`
- `/Users/veeskela/Projects/IMS/main/frontend/src/vite-env.d.ts`
- `/Users/veeskela/Projects/IMS/main/frontend/src/test/render.tsx`
- `/Users/veeskela/Projects/IMS/main/frontend/src/test/setup.ts`
- `/Users/veeskela/Projects/IMS/main/.gitignore`
- `/Users/veeskela/Projects/IMS/main/README.md` (structure only)
- `/Users/veeskela/Projects/IMS/main/AGENTS.md` (discipline only — strip IMS product rules)

### LV24 look + grid/charts (city)

- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/index.ts`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/productFonts.css`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/muiXThemeAugmentation.d.ts`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminDataGridPro/` (+ `styles`)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/adminDataGridPolicy/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/applyAdminInlineHeaderSearch/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/adminDataGridLikeFilter/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/mui/dataGridLocale/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/adminFillLayout/index.tsx`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminGridActionsMenu/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/AdminColumnHeaderWithSearch/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/NewsListPage/` (reference desk)
- `/Users/veeskela/Projects/lv24/main/frontend/src/pages/admin/HostMonitorPage/` (charts + live refresh)
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/ui/ColorSchemeToggle/`
- `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/preferences/colorSchemePreference.ts`
- Optional Yarn 4 notes: `/Users/veeskela/Projects/lv24/main/frontend/.yarnrc.yml` (peer-warning filters for Material 9 × Grid 8)

### License / env templates

- `/Users/veeskela/Projects/IMS/main/infra/.env.example` (empty `VITE_MUI_LICENSE_KEY=`)
- `/Users/veeskela/Projects/lv24/main/infra/.env.example` (commented key + bake notes)
- `/Users/veeskela/Projects/lv24/main/docs/FRONTEND-QUICKREF.md` § Configuration (policy text; ignore the stale `App.tsx` sentence)

### Do not copy

- `/Users/veeskela/Projects/lv24/main/docs/docs-app/` (MUI 7, ESLint, Prettier, `^` versions)
- City `main.tsx` bootstrap (Sentry, SW, map, legal consent)
- Identity `package.json` (`^` on Nest — FE policy forbids that)

---

## 10. Risks / missing pieces

1. **No desktop shell and no Wi‑Fi stack.** Scanning, permissions, and IPC are invented work.
2. **`lv24-ytk` / `lv24-code` are not on this machine.** The only documented desktop client is YTK OAuth loopback, and you cannot read that repo here.
3. **Yarn 1 vs Yarn 4.** IMS (recommended) is Classic 1.22.22; city FE is Berry 4.17.1. Pick one lockfile and stay there.
4. **Node 20 vs 22.** 22 is a MapLibre constraint, not a family default.
5. **License leakage.** Same org key is sitting in multiple gitignored `.env` files. Keep it out of git, Docker layers that get published, and agent logs. IMS analysis even warned not to silently bake city `.env` into other products — Wifi Explorer is LV24-named, so **policy allows reuse**, process still says “never print / never commit”.
6. **Paid X 9 will watermark** even with a valid v8 key.
7. **Stale docs** (`App.tsx` license, `docs-app` MUI 7) will mislead if you follow them literally.
8. **GitHub is a personal account**, not `lv24` or `lv24-company`. GitLab org is optional and city-centric.
9. **No shared UI package.** Theme/grid will be copied files, not `@lv24/ui`.
10. **Identity product registry** has no `wifi` membership; skip IdP unless you need suite login.
11. **This Mac’s `git` CLI is blocked** by the Xcode license; remotes were read from `.git/config`.

---

### Day-1 build order

1. Create `/Users/veeskela/Projects/lv24-wifi-explorer/main` as the git product (IMS layout).
2. Copy IMS frontend kit; replace theme with city Sunset + fonts.
3. Wire `VITE_MUI_LICENSE_KEY` via IMS `license.ts`; pin X 8.11; add the pin test.
4. StaffShell + one desk: DataGrid of scan rows (NewsList / StaffDataGrid pattern) + optional Host Monitor charts.
5. Private GitHub `LevapVeeskela/lv24-wifi-explorer`.
6. Treat native Wi‑Fi as a later, undocumented layer — there is no LV24 sibling for it.
