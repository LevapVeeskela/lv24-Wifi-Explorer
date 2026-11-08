<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: f309a950-45aa-41aa-9e4d-9053a27394a6.jsonl -->

# UI specification

**LV24 stack:** Material UI **9.2.0** (free Core, not v6/v7/v8) + MUI X **8.11.0**. The v8 key is valid for **Data Grid Pro only**. Charts, date pickers, and tree stay **Community**. Never ship Premium, Charts Pro, or date-pickers-pro, and never bump paid X to 9.x (`NotValidForPackage`).

Visual language is **Sunset** (coral/violet, Manrope + Plus Jakarta), not Intuitibits graphite/system-blue. Keep the screenshot’s **information architecture**, not its branding, vendor logos, or trial footer.

---

# UI specification / Спецификация UI

**Product:** LV24 WiFi Explorer (`lv24-wifi-explorer`)  
**Surface:** `ScanWorkbench` / `ВерстакСканирования`  
**Locale default:** `ru` · fallback `en`  
**No code** — identifiers, regions, tokens, license gates only.

---

## 0. Stack, license, non-goals

| Layer                         | Package                                               | Version policy                 | License                            |
| ----------------------------- | ----------------------------------------------------- | ------------------------------ | ---------------------------------- |
| Core                          | `@mui/material` `@mui/icons-material` `@mui/system`   | **9.2.0** (latest free)        | MIT                                |
| Emotion                       | `@emotion/react` `@emotion/styled`                    | match LV24                     | MIT                                |
| Data grid                     | `@mui/x-data-grid-pro`                                | **8.11.0 pin**                 | **Pro key** `VITE_MUI_LICENSE_KEY` |
| License runtime               | `@mui/x-license`                                      | **8.11.0 pin**                 | same key                           |
| Charts                        | `@mui/x-charts`                                       | 8.11.0 or latest **Community** | **MIT — must stay Community**      |
| Date pickers (only if needed) | `@mui/x-date-pickers`                                 | Community                      | **MIT — must stay Community**      |
| Theme                         | Sunset from `lv24/main/frontend/src/shared/lib/theme` | cssVariables + light/dark      | —                                  |

**Apply key** like IMS `applyMuiXLicense()` at renderer entry. Do not print or commit the key. Empty key → Pro watermark on the grid only.

**Do not import** city `AdminDataGridPro` as-is: it forces pagination, inline header search, and admin column policy. Fork a dedicated `ScanDataGrid` / `СканТаблица` that still uses `DataGridPro` + `dataGridLocale` + `LicenseInfo`.

### 0.1 MUST stay Community (license-safe)

These **must not** be added, even if IMS already has some of them:

| Forbidden package                             | Why                                                                                  |
| --------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@mui/x-data-grid-premium`                    | Key is Pro, not Premium. No row grouping, aggregation, Excel, pivot.                 |
| `@mui/x-charts-pro` / `@mui/x-charts-premium` | Key is validated as `x-data-grid-pro`. Zoom/pan/heatmap/funnel/export = Pro/Premium. |
| `@mui/x-date-pickers-pro`                     | IMS uses this; **Wifi-Explorer must not**. No `DateTimeRangePicker`.                 |
| `@mui/x-tree-view-pro`                        | Not covered; do not add.                                                             |
| Any `@mui/x-*-pro` **9.x**                    | `NotValidForPackage` against the v8 key.                                             |

**Allowed Pro features (DataGridPro 8 only):** column resize, reorder, pin, visibility manager, `apiRef.updateRows`, no pagination, multi-sort, virtualization. Optional later: **tree data** (Pro) to nest BSS under SSID — **not** Premium `rowGrouping`.

**Community substitutes (required):**

- Chart **timescale** (screenshot ↑/↓): resample history in the store + `IconButton` / `ToggleButtonGroup`, same idea as HostMonitor period `Select`. Do **not** use Charts Pro zoom.
- **CSV export:** Community `csvExport`. No Excel.
- **SSID grouping v1:** flat BSS rows. v1.1: DataGridPro `treeData` (`getTreeDataPath: [ssid, bssid]`), never Premium grouping.

### 0.2 Clean-room / PARITY-GAP

- Do not copy WiFi Explorer nibs, strings, icons, `vendors.zip`, Paddle/trial chrome, or `.wifiexplorer` format.
- Vendor cell = `Avatar` initials + text from **our** IEEE OUI DB.
- **Spectrum** = channel occupancy from `ScanSnapshot` (channel + width + RSSI). CoreWLAN has **no FFT / monitor-mode spectrum**. Label the tab honestly: `Channel occupancy` / `Занятость каналов`.
- Snapshot format: `.lv24wifi` or JSON — not their vendor file.

---

## 1. Design principles / Принципы

1. **Instrument density** — compact grid, 8px toolbar padding, no card chrome inside the grid.
2. **Sunset, not clone** — selection = `palette.primary` coral, not macOS system blue. Surfaces = Sunset dark paper (`#221D18` / `#17130F`), not their graphite.
3. **Connected ≠ selected** — two independent treatments.
4. **Color is never the only cue** — signal % + quality word + bar; lock icon + security text.
5. **styles.ts only** — no inline `sx` objects in components (LV24 rule).
6. **FSD:** `app` / `pages` / `widgets` / `features` / `entities` / `shared`.
7. **i18n:** every visible string via `react-intl`, keys below. Default `ru`.

**Theme persistence:** `localStorage` key `lv24.wifi-explorer.theme` (`light` | `dark` | `system`). Default **dark**.

---

## 2. Window regions / Регионы окна

```
┌─ TitleBar / Титул ─────────────────────────────────────────┐
│ ScanAppBar / СканАппбар  (band, open/secure, search, cols) │
├─ ScanMainSplit / СканГлавныйСплит (vertical) ──────────────┤
│                                                             │
│  ScanDataGrid / СканТаблица                                 │
│                                                             │
├─ SplitterH / ГоризонтальныйСплиттер ───────────────────────┤
│  BottomDock / НижнийДок                                     │
│   ├ DetailsTabs / ВкладкиДеталей                            │
│   ├ TabPanel (details | signal | occupancy | advanced)      │
│   └ ChartStrip / ЛентаГрафиков  (details tab only)          │
├─ StatusBar / СтрокаСостояния ──────────────────────────────┤
└─────────────────────────────────────────────────────────────┘
```

| Region ID            | RU                       | MUI / custom                                               | License              |
| -------------------- | ------------------------ | ---------------------------------------------------------- | -------------------- |
| `ScanShell`          | `СканОболочка`           | `Box` column, 100dvh                                       | Community            |
| `TitleBar`           | `Титул`                  | Electron chrome + `Typography` / `Chip`                    | Community            |
| `ScanAppBar`         | `СканАппбар`             | `AppBar` `position="static"` + `Toolbar` `variant="dense"` | Community            |
| `ScanMainSplit`      | `СканГлавныйСплит`       | CSS grid + `PaneResizeSeparator` (GuideEditor pattern)     | Community (custom)   |
| `ScanDataGrid`       | `СканТаблица`            | **`DataGridPro`**                                          | **Pro**              |
| `SplitterH`          | `ГоризонтальныйСплиттер` | `Box` `role="separator"`                                   | Community            |
| `BottomDock`         | `НижнийДок`              | `Paper` + `Stack`                                          | Community            |
| `DetailsTabs`        | `ВкладкиДеталей`         | `Tabs` + `Tab`                                             | Community            |
| `NetworkDetailsPane` | `ПанельСведений`         | `Grid` (MUI 9 Grid2) 2 columns                             | Community            |
| `ChartStrip`         | `ЛентаГрафиков`          | 3× `Paper` + Community charts                              | **Community charts** |
| `StatusBar`          | `СтрокаСостояния`        | `Paper`/`AppBar` dense                                     | Community            |

**Not used:** `DataGridPremium`, `Accordion` as the primary details chrome (tabs win). `Accordion` **is** allowed inside `AdvancedDetailsPane` for IE groups.

---

## 3. Title bar / Титул

**ID:** `TitleBar` / `Титул`  
**Components:** Electron traffic-light area (native) + renderer `Stack` `direction="row"`.

**Left — scan state**

| ID                    | RU                    | Content                                                            |
| --------------------- | --------------------- | ------------------------------------------------------------------ |
| `title.scanState`     | `title.scanState`     | `Scanning` / `Сканирование` · `Paused` / `Пауза` · `Demo` / `Демо` |
| `title.connectedSsid` | `title.connectedSsid` | `                                                                  | {ssid}` if associated; else omit |

**Right — associated link (only if connected)**

| ID                 | RU label | Source                                                               |
| ------------------ | -------- | -------------------------------------------------------------------- |
| `title.linkRssi`   | RSSI     | connected BSS `rssiDbm` as `−60 dBm` (never the screenshot’s “−60%”) |
| `title.linkBand`   | Диапазон | `5 GHz`                                                              |
| `title.linkWidth`  | Ширина   | `20 MHz`                                                             |
| `title.linkTxRate` | Скорость | `144 Mbps`                                                           |

Separator: `Divider` `orientation="vertical"` `flexItem` or middots. `Typography` `variant="caption"`.

**Actions (icon-only, `Tooltip` + `aria-label`):**

| ID            | Icon (MUI)               | Action                                              |
| ------------- | ------------------------ | --------------------------------------------------- |
| `title.pause` | `Pause` / `PlayArrow`    | start/stop scan                                     |
| `title.iface` | `SettingsInputAntenna`   | `Menu` of interfaces                                |
| `title.theme` | `DarkMode` / `LightMode` | color scheme                                        |
| `title.about` | `InfoOutlined`           | `Dialog` about — **our** version, not their license |

---

## 4. Toolbar / Панель фильтров — `ScanAppBar`

`AppBar` `color="transparent"` `elevation={0}` over `background.paper`. `Toolbar` `variant="dense"` `disableGutters` + horizontal `Stack` `spacing={1}` `px={1}`.

### 4.1 Band filter — `BandFilter` / `ФильтрДиапазона`

`ToggleButtonGroup` **exclusive**. `size="small"`.

| value | EN      | RU      | Rule                                                                                                       |
| ----- | ------- | ------- | ---------------------------------------------------------------------------------------------------------- |
| `all` | All     | Все     | default                                                                                                    |
| `24`  | 2.4 GHz | 2,4 ГГц | `band === '2.4'`                                                                                           |
| `5`   | 5 GHz   | 5 ГГц   | `band === '5'`                                                                                             |
| `6`   | 6 GHz   | 6 ГГц   | `band === '6'`; if hardware/OS has no 6 GHz BSS, keep enabled, empty grid + hint `scan.filter.band6.empty` |

**a11y:** `aria-label={scan.filter.band}`.

### 4.2 Security filter — `SecurityFilter` / `ФильтрЗащиты`

`ToggleButtonGroup` **multi-select** (`value: Array<'open' \| 'secure'>`).

| value    | EN     | RU         | Rule                         |
| -------- | ------ | ---------- | ---------------------------- |
| `open`   | Open   | Открытые   | `securityClass === 'open'`   |
| `secure` | Secure | Защищённые | `securityClass === 'secure'` |

**Logic:** `[]` or `['open','secure']` = all. Only `open` / only `secure` = filter. Do not treat both-off as empty (matches “idle = all”).

Lock glyph on Secure button: `Lock` / `LockOpen` as **adornment**, not the only meaning (text remains).

### 4.3 Search — `ScanSearch` / `СканПоиск`

`TextField` `size="small"` `placeholder={scan.search.placeholder}`  
EN: `Filter networks` · RU: `Фильтр сетей`  
**Do not** copy the screenshot’s “Filterror”.

- `InputAdornment` start: `Search`
- clear `IconButton` when non-empty
- debounce **150 ms**
- match (case-fold): `ssid`, `bssid`, `vendor`, `annotation`, `security`
- hidden SSID: search `\u0000` / literal `<hidden>` / RU `«скрытая»` still finds `hidden === true` rows
- shortcut: `Mod+F` focuses this field; `Escape` clears if focused

**Do not** enable DataGrid `headerFilters` or city inline header search.

### 4.4 Column picker — `ColumnPicker` / `ВыборКолонок`

`IconButton` `ViewColumn` → DataGridPro **columns management** (`slotProps.columnsManagement` / `GridToolbarColumnsButton` in a `Popover`).

- Persist `columnVisibilityModel` → `lv24.wifi-explorer.columns`
- System fields never togglable: `__check__` (unused v1), `seriesColor`
- Restore default: menu item `scan.columns.reset`

**Pro** (column manager + resize). Not Premium.

### 4.5 Optional v1 toolbar extras

| ID                | Component                                 | License   |
| ----------------- | ----------------------------------------- | --------- |
| `RssiFloorFilter` | `Slider` or `Select` min RSSI             | Community |
| `ScanSensitivity` | `Select` dwell/interval                   | Community |
| `ExportCsv`       | `Button` → Community CSV                  | Community |
| `IssuesToggle`    | `Badge` + `ToggleButton` show Issues rows | Community |

---

## 5. Main grid / Главная таблица — `ScanDataGrid`

**Component:** `DataGridPro`  
**Wrapper:** `ScanDataGrid` / `СканТаблица`  
**Row id:** `bssid` normalized (`aa:bb:cc:dd:ee:ff` lowercase).  
**Pagination:** `false`.  
**Density:** `compact` always (desktop instrument).  
**Row height:** ~28–32 px. **Header:** ~36 px (no stacked search).  
**Checkbox selection:** off (v1 single select).  
**`disableRowSelectionOnClick`:** false.  
**`hideFooter`:** true (counts live in `StatusBar`).  
**Sort:** default `signalPct` desc (or `rssiDbm` desc).  
**Live updates:** `apiRef.current.updateRows` on each `scan:snapshot`; do not remount.  
**Stale rows:** after N missed scans, `opacity` 0.45 + `aria-label` stale; drop after TTL.

**Pro on:** `disableColumnResize={false}`, `disableColumnReorder={false}`, pin `seriesColor` + `ssid` left (optional).  
**Off:** `headerFilters`, excel, aggregation, row grouping.

**Do not** equal-flex all columns (admin policy). Use content widths: BSSID ~128, SSID flex 1.2, signal ~140, channel 64, etc.

### 5.1 Columns — screenshot + v1

**Visible by default** (screenshot order, original headers):

| `field`        | EN header     | RU header     | Cell                                             | Notes                                            |
| -------------- | ------------- | ------------- | ------------------------------------------------ | ------------------------------------------------ |
| `seriesColor`  | (none)        | (none)        | 8×8 `Box` swatch                                 | Chart color; `filterable:false` `hideable:false` |
| `bssid`        | BSSID         | BSSID         | `Typography` mono, truncate middle               | Copy on `Mod+C` when focused                     |
| `ssid`         | Network name  | Имя сети      | text; hidden → `‹hidden›` / `‹скрытая›` italic   | Connected: `Wifi` icon + weight 600              |
| `securityLock` | (icon)        | (icon)        | `Lock` / `LockOpen` + `Tooltip` full security    | Not hideable; sort by `securityClass`            |
| `vendor`       | Vendor        | Производитель | `Stack` `Avatar` 16px initials + name            | Our OUI, not their logos                         |
| `annotation`   | Annotations   | Пометки       | `IconButton` `StickyNote2` if empty; text if set | `Dialog` or inline `TextField`                   |
| `signal`       | Signal        | Сигнал        | `%` + `LinearProgress`                           | Sort by `signalPct` / `rssiDbm`                  |
| `channel`      | Channel       | Канал         | number                                           | —                                                |
| `channelWidth` | Channel width | Ширина канала | `20 MHz`                                         | —                                                |
| `band`         | Band          | Диапазон      | `2.4` / `5` / `6` + UNII suffix in tooltip       | —                                                |
| `phyMode`      | Mode          | Режим         | `a/n/ac` compact; tooltip `802.11a/n/ac`         | —                                                |

**Hidden by default (column picker) — v1 scanner extras:**

| `field`         | EN         | RU             | Why                                             |
| --------------- | ---------- | -------------- | ----------------------------------------------- |
| `rssiDbm`       | RSSI       | RSSI           | raw dBm                                         |
| `noiseDbm`      | Noise      | Шум            | dBm (not “−1%”)                                 |
| `snrDb`         | SNR        | ОСШ            | `rssi − noise`                                  |
| `signalQuality` | Quality    | Качество       | Excellent / Хорошо / …                          |
| `security`      | Security   | Защита         | `WPA2-Personal`                                 |
| `encryption`    | Encryption | Шифрование     | `CCMP-128`                                      |
| `maxRateMbps`   | Max rate   | Макс. скорость | —                                               |
| `frequencyMHz`  | Frequency  | Частота        | —                                               |
| `unii`          | UNII       | UNII           | `UNII-2A`                                       |
| `networkType`   | Type       | Тип            | Infrastructure / IBSS / …                       |
| `connected`     | Connected  | Подключено     | boolean + `Chip`                                |
| `hidden`        | Hidden     | Скрытая        | boolean                                         |
| `firstSeen`     | First seen | Впервые        | relative                                        |
| `lastSeen`      | Last seen  | Недавно        | relative                                        |
| `country`       | Country    | Страна         | if present                                      |
| `favorite`      | Favorite   | Избранное      | star                                            |
| `iface`         | Interface  | Интерфейс      | scan iface                                      |
| `issueFlags`    | Issues     | Проблемы       | `Chip` count; heuristics from capability matrix |

**Signal bar (`SignalBar` / `ПолосаСигнала`):**

- Track: `action.hover` / divider.
- Fill: map quality → `success` / `warning` / `error` (Sunset tokens), **plus** numeric `%`.
- Determinate `LinearProgress` height 6–8 px, no animation on live tick (avoid flicker): `transition: none` on bar.
- Tooltip: `RSSI −53 dBm · SNR 48 dB · Excellent`.

**Series color:** stable hash(BSSID) → 8–12 Sunset-safe hues. Same color on occupancy bars and signal series. Persist optional later.

### 5.2 Selection highlight / Выделение

| Token           | Meaning                                                                                                                                                                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `row--selected` | `palette.action.selected` + `palette.primary.main` left 3 px bar; text `primary.contrastText` **only if** contrast fails — prefer keep `text.primary` on tinted coral (`alpha(primary, 0.16)` like Sunset dark). **Do not** use screenshot electric blue. |
| Focus           | MUI `action.focus` outline on the row, `:focus-visible` only                                                                                                                                                                                              |
| Hover           | `action.hover`                                                                                                                                                                                                                                            |
| Multi           | v1 off                                                                                                                                                                                                                                                    |

`onRowClick` / `onRowSelectionModelChange` → `selectedBssid`. Details + charts bind to this id. Empty selection → details empty state.

### 5.3 Connected-network treatment / Подключённая сеть

Independent of selection.

| Cue                                              | Spec                                                                                                                                                |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Title bar                                        | SSID + link stats                                                                                                                                   |
| Row                                              | `Wifi` icon in `ssid` cell; `fontWeight: 600`                                                                                                       |
| Optional `Chip` `size="small"` `color="success"` | `Connected` / `Подключено`                                                                                                                          |
| Left accent                                      | 3 px `success.main` **under** selection bar (selection wins if both)                                                                                |
| Sort pin                                         | **Do not** force-sort connected to top (keeps channel/signal sort honest). Optional later: pin row via Pro `pinnedRows` — nice-to-have, not v1 must |
| Disappeared                                      | if association lost, remove cues immediately                                                                                                        |

---

## 6. Bottom dock / Нижний док

### 6.1 Tabs — `DetailsTabs` / `ВкладкиДеталей`

`Tabs` `variant="scrollable"` `scrollButtons="auto"` `allowScrollButtonsMobile`. Selected tab: Sunset primary indicator.

| `value`     | EN                | RU                | Panel                               |
| ----------- | ----------------- | ----------------- | ----------------------------------- |
| `details`   | Network details   | Сведения о сети   | `NetworkDetailsPane` + `ChartStrip` |
| `signal`    | Signal strength   | Уровень сигнала   | full-width `SignalHistoryChart`     |
| `occupancy` | Channel occupancy | Занятость каналов | 2.4 / 5 / 6 charts, larger          |
| `advanced`  | Advanced details  | Дополнительно     | `AdvancedDetailsPane`               |

Keyboard: `Mod+1…4`. `aria-controls` / `id` pairs.

### 6.2 Network details — `NetworkDetailsPane` / `ПанельСведений`

**Layout:** MUI 9 `Grid` `container` `columns={12}` `spacing={1}` `px={2}` `py={1}`.  
Two columns: `xs={12} md={6}`. Each field is `DetailsField` / `ПолеСведения`: label `caption` `text.secondary` + value `body2` `text.primary`. Mono for BSSID/MAC.

**Empty:** `selectedBssid == null` → `Typography` `scan.details.empty` «Выберите сеть» / «Select a network».

**Field grid (screenshot order, original copy):**

**Column A**

| `fieldId`       | EN             | RU               | Format                                                                              |
| --------------- | -------------- | ---------------- | ----------------------------------------------------------------------------------- |
| `ssid`          | SSID           | SSID             | raw; hidden placeholder                                                             |
| `bssid`         | BSSID          | BSSID            | full colon MAC                                                                      |
| `vendor`        | Vendor         | Производитель    | OUI name                                                                            |
| `signalQuality` | Signal quality | Качество сигнала | Excellent / Отличное · Good / Хорошее · Fair / Среднее · Weak / Слабое · None / Нет |
| `signalPct`     | Signal         | Сигнал           | `81%`                                                                               |

**Column B**

| `fieldId`     | EN       | RU             | Format                    |
| ------------- | -------- | -------------- | ------------------------- |
| `band`        | Band     | Диапазон       | `5 GHz UNII-2A`           |
| `phyMode`     | Mode     | Режим          | `802.11a/n/ac`            |
| `maxRateMbps` | Max rate | Макс. скорость | `260.1 Mbps`              |
| `channel`     | Channel  | Канал          | `60`                      |
| `noiseDbm`    | Noise    | Шум            | `−95 dBm` (**not** “−1%”) |

**Row 3 (wraps both columns, still 2-col):**

| `fieldId`      | EN            | RU            | Format                          |
| -------------- | ------------- | ------------- | ------------------------------- |
| `networkType`  | Type          | Тип           | Infrastructure / Инфраструктура |
| `security`     | Security      | Защита        | WPA2-Personal                   |
| `encryption`   | Encryption    | Шифрование    | CCMP-128                        |
| `channelWidth` | Channel width | Ширина канала | 20 MHz                          |
| `snrDb`        | SNR           | ОСШ           | `48.00 dB`                      |

v1 extras in this pane (if space, else Advanced): `frequencyMHz`, `country`, `firstSeen`, `lastSeen`, `connected`.

**Copy:** click-to-copy value; `Snackbar` `scan.copied`.

### 6.3 Advanced — `AdvancedDetailsPane` / `ПанельДополнительно`

`Accordion` `disableGutters` `square` groups (Community):

| ID             | EN                   | RU                      |
| -------------- | -------------------- | ----------------------- |
| `adv.radio`    | Radio                | Радио                   |
| `adv.security` | Security             | Защита                  |
| `adv.ies`      | Information elements | Информационные элементы |
| `adv.issues`   | Issues               | Проблемы                |

IE decode is **ours** (capability matrix), not their engine. Missing CoreWLAN fields → `—` + tooltip `scan.field.unavailable`.

---

## 7. Charts / Графики

**Package:** `@mui/x-charts` only. Pattern: HostMonitor `LineChart` in outlined `Paper`.

`ChartStrip` / `ЛентаГрафиков` — 3 panes, `Grid` `xs={12} md={4}` **or** inner horizontal splitters. Height 140–180 px. Visible on **details** tab. Signal/occupancy tabs reuse the same chart components at height 280+.

### 7.1 Signal history — `SignalHistoryChart` / `ГрафикИсторииСигнала`

| Item      | Spec                                                                                                          |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| Component | `LineChart` Community                                                                                         |
| X         | time, `scaleType: 'time'`                                                                                     |
| Y         | 0–100 `%` **or** −100–0 dBm (toggle `scan.chart.unit`)                                                        |
| Series    | selected BSS; optional 2–3 comparison later                                                                   |
| Marks     | `showMark: false`                                                                                             |
| Timescale | store window: 30s / 1m / 5m / 15m / 1h — `IconButton` `UnfoldMore`/`UnfoldLess` or ↑/↓ **when chart focused** |
| Empty     | no samples yet — HostMonitor-style caption                                                                    |
| Color     | `seriesColor` of selected row                                                                                 |

**Do not** use Charts Pro zoom/pan.

### 7.2 Band occupancy — `OccupancyChart` / `ГрафикЗанятости`

Two (or three) Community `BarChart`s: `2.4 GHz` · `5 GHz` · `6 GHz` if any 6 GHz BSS or UNII-5/6/7/8 present.

| Item       | Spec                                                                                                                        |
| ---------- | --------------------------------------------------------------------------------------------------------------------------- |
| X          | channel numbers (2.4: 1–14; 5: UNII set; 6: 1–233 stepped)                                                                  |
| Y          | 0–100 occupancy score from overlapping BSS RSSI/width (our heuristic)                                                       |
| Selected   | highlight bar + label `Channel {n}` / `Канал {n}`                                                                           |
| Overlap    | stacked or two series: others vs selected                                                                                   |
| PARITY-GAP | caption `scan.chart.occupancy.hint`: «По данным активного сканирования, не RF-спектр» / «From active scan, not RF spectrum» |

Screenshot’s empty grey bars + one green selected bar = this model.

### 7.3 Selected BSS bar — `SelectedChannelChart` / `ГрафикВыбранногоКанала`

Community `BarChart` one category = SSID, value = `signalPct`, color = series swatch. Axis label `Channel {n}`. Can merge into occupancy as highlight; keep a third pane to match the IA.

### 7.4 Chart a11y

Each chart: `aria-label`, `slotProps` hide decorative legend if redundant, **visually hidden** HTML `Table` of last N points (`scan.chart.table`). Keyboard: Tab into chart container; ↑/↓ timescale; ←/→ next/prev sample in the table (not Charts Pro).

---

## 8. Status bar / Строка состояния — `StatusBar`

`Paper` `square` `elevation={0}` height 28–32 px. `Stack` `direction="row"` `justifyContent="space-between"`. `Typography` `caption`.

**Left**

| ID                     | EN                                                                  | RU                                                        |
| ---------------------- | ------------------------------------------------------------------- | --------------------------------------------------------- |
| `status.sortHint`      | Signal · use ↑ or ↓ to change timescale **when a chart is focused** | Сигнал · ↑/↓ меняют шкалу времени, когда фокус на графике |
| `status.networksFound` | Networks found: {n}                                                 | Сетей: {n}                                                |
| `status.selected`      | Selected: {n}                                                       | Выбрано: {n}                                              |

`aria-live="polite"` on the counts (announce on change, not every scan tick — debounce 1s).

**Right — replace their trial line**

**Forbidden:** “Not Activated”, “Days Remaining”, Paddle, their license SKU.

| ID                | EN                          | RU                           |
| ----------------- | --------------------------- | ---------------------------- |
| `status.scanCore` | ScanCore: ok / error / demo | ScanCore: ок / ошибка / демо |
| `status.location` | Location: granted / denied  | Геолокация: разрешена / нет  |
| `status.lastScan` | Last scan: {relative}       | Последнее: {relative}        |
| `status.version`  | v{semver}                   | v{semver}                    |
| `status.about`    | About                       | О программе                  |

`status.about` opens `AboutDialog` / `ДиалогОПрограмме`: product name **LV24 WiFi Explorer**, version, ScanCore version, Location privacy sentence, MUI attribution (MIT + Pro grid). No third-party scanner names.

---

## 9. Dark theme density / Тёмная плотность

| Token                | Value                                                                |
| -------------------- | -------------------------------------------------------------------- |
| Default scheme       | dark                                                                 |
| `shape.borderRadius` | Sunset 10 for dialogs/chips; **grid 0** (square instrument)          |
| Toolbar              | dense, 8 px vertical                                                 |
| DataGrid             | `density="compact"`; `palette.DataGrid.bg/headerBg/pinnedBg` = paper |
| Dividers             | `palette.divider`                                                    |
| Scrollbars           | thin, Sunset divider thumb                                           |
| Charts               | `theme.palette` series; axis `text.secondary`                        |
| Compact padding      | `spacing(1)` in dock; `spacing(0.5)` in field grid                   |

Light scheme must remain WCAG AA (Sunset already tuned). Do not ship a third “WiFi Explorer skin”.

---

## 10. Keyboard and accessibility / Клавиатура и a11y

### 10.1 Focus scopes (Tab order)

1. `TitleBar` icon actions
2. `BandFilter` → `SecurityFilter` → `ScanSearch` → `ColumnPicker`
3. `ScanDataGrid` (MUI X grid roving tabindex)
4. `SplitterH`
5. `DetailsTabs` → panel fields
6. `ChartStrip` panes
7. `StatusBar` About

Skip links: `scan.a11y.skipToGrid` / `К таблице`, `scan.a11y.skipToDetails` / `К сведениям`.

### 10.2 Shortcuts

| Key                            | Scope             | Action                                                    |
| ------------------------------ | ----------------- | --------------------------------------------------------- |
| `Mod+F`                        | global            | focus search                                              |
| `Escape`                       | search focused    | clear query                                               |
| `Escape`                       | menu/dialog       | close                                                     |
| `ArrowUp/Down`                 | **grid**          | move selection                                            |
| `ArrowUp/Down`                 | **chart focused** | timescale ±                                               |
| `Enter`                        | grid              | keep selection, focus details                             |
| `Space`                        | grid              | toggle `favorite`                                         |
| `Mod+C`                        | grid              | copy BSSID (or SSID if ssid cell)                         |
| `Mod+1…4`                      | global            | details tabs                                              |
| `Mod+P`                        | global            | pause/resume scan                                         |
| `Home`/`End`                   | grid              | first/last visible row                                    |
| `ArrowLeft/Right` `Home` `End` | splitter focused  | resize (GuideEditor keys; vertical splitter uses Up/Down) |

Document ↑/↓ conflict in status hint: **focus-dependent**.

### 10.3 A11y requirements

- All `IconButton`s: `aria-label` from i18n, `Tooltip`.
- Lock + security **text** (tooltip minimum).
- Signal: % + quality word + bar.
- Swatch: `aria-hidden` (decorative); series named in charts.
- Splitters: `role="separator"`, `aria-orientation`, `aria-valuemin/max/now`, `tabIndex={0}`.
- Live region: network count, permission denial, ScanCore errors (`role="status"` / `Alert`).
- Reduced motion: no progress animation; chart updates without spring.
- Contrast: selected row AA against coral tint; if fail, use outline + weight, not low-contrast blue-on-blue.
- Charts: data table alternative.

---

## 11. Responsive and splitters / Адаптив и сплиттеры

MUI has **no** Splitter. **Do not** add a paid splitter. Use GuideEditor: CSS grid fractions + `PaneResizeSeparator`.

### 11.1 Desktop (`md+`, primary)

| Splitter                  | ID                               | Axis                     | Persist key                | Min                          | Default               |
| ------------------------- | -------------------------------- | ------------------------ | -------------------------- | ---------------------------- | --------------------- |
| Grid vs dock              | `split.main` / `сплит.главный`   | horizontal (row heights) | `lv24.wifi-explorer.panes` | grid 160 px, dock 180 px     | grid 0.58 / dock 0.42 |
| Details vs charts         | `split.dock` / `сплит.док`       | horizontal               | same JSON                  | details 72 px, charts 120 px | 0.45 / 0.55           |
| Chart panes (optional v1) | `split.charts` / `сплит.графики` | vertical                 | same                       | 160 px each                  | 1/3                   |

Reset control: `scan.panes.reset` in About or toolbar overflow.

Collapse dock: double-click splitter → tabs-only (~40 px); again to restore.

### 11.2 Tablet (`sm`–`md`)

`Tabs` at shell level: `Grid` | `Details` | `Charts`. Hide splitters. `ScanDataGrid` `responsive` essential fields: `ssid`, `signal`, `channel`, `securityLock`, `connected`.

### 11.3 Phone (`xs`) — not v1 target

If window tiny: same three tabs; hide occupancy 6 GHz chart; `ColumnPicker` presets “Essential”. No `AdminDataGridCardList` in v1.

### 11.4 Window

Electron: min 960×640. `ScanShell` `height: 100%` `overflow: hidden`. Grid and charts **fill**; no page scroll except tab body.

---

## 12. Component map / Карта компонентов

| UI job                      | Component                                         | Package                      | License            |
| --------------------------- | ------------------------------------------------- | ---------------------------- | ------------------ |
| App frame                   | `Box` `Stack` `CssBaseline` `ThemeProvider`       | material 9                   | Community          |
| Top bars                    | `AppBar` `Toolbar`                                | material                     | Community          |
| Band / security             | `ToggleButtonGroup` `ToggleButton`                | material                     | Community          |
| Search                      | `TextField` `InputAdornment`                      | material                     | Community          |
| Icons                       | `@mui/icons-material`                             | icons 9                      | Community          |
| Column picker               | `IconButton` + DataGridPro columns management     | material + **data-grid-pro** | **Pro**            |
| BSS table                   | **`DataGridPro`**                                 | **x-data-grid-pro 8.11**     | **Pro**            |
| Signal bar                  | `LinearProgress`                                  | material                     | Community          |
| Vendor                      | `Avatar` `Typography`                             | material                     | Community          |
| Lock / wifi                 | `Lock` `LockOpen` `Wifi`                          | icons                        | Community          |
| Details tabs                | `Tabs` `Tab` `Box` role=tabpanel                  | material                     | Community          |
| Details fields              | `Grid` + `Typography`                             | material                     | Community          |
| Advanced groups             | `Accordion` `AccordionSummary` `AccordionDetails` | material                     | Community          |
| Issues                      | `Chip` `Alert`                                    | material                     | Community          |
| Signal chart                | `LineChart`                                       | **x-charts**                 | **Community MUST** |
| Occupancy                   | `BarChart`                                        | **x-charts**                 | **Community MUST** |
| Mini spark (optional later) | `SparkLineChart`                                  | x-charts                     | Community          |
| Timescale                   | `IconButton` / `ToggleButtonGroup` / `Select`     | material                     | Community          |
| About / notes               | `Dialog` `DialogTitle` `TextField`                | material                     | Community          |
| Status                      | `Paper` `Typography` `Link`                       | material                     | Community          |
| Toasts                      | `Snackbar`                                        | material                     | Community          |
| Splitters                   | custom `Box` (GuideEditor)                        | —                            | MIT in-repo        |
| Theme toggle                | existing Sunset `ColorSchemeToggle`               | material                     | Community          |
| Date/time (avoid)           | if ever: `Select` presets only                    | material                     | Community          |

**Not in v1:** `DataGrid` Community (loses resize), `DataGridPremium`, `ChartsPro`, `Heatmap`, `DateRangePicker`, `TreeViewPro`.

---

## 13. i18n identifiers (ru default)

Prefix `scan.`.

**Chrome:** `scan.title.scanning` `scan.title.paused` `scan.title.demo`  
**Filters:** `scan.filter.band` `scan.filter.band.all` `scan.filter.band.24` `scan.filter.band.5` `scan.filter.band.6` `scan.filter.band6.empty` `scan.filter.open` `scan.filter.secure`  
**Search:** `scan.search.placeholder` `scan.search.clear`  
**Columns:** `scan.col.bssid` `scan.col.ssid` `scan.col.vendor` `scan.col.annotation` `scan.col.signal` `scan.col.channel` `scan.col.channelWidth` `scan.col.band` `scan.col.phyMode` `scan.col.rssi` `scan.col.noise` `scan.col.snr` `scan.col.security` `scan.col.encryption` `scan.col.maxRate` `scan.col.frequency` `scan.col.unii` `scan.col.type` `scan.col.connected` `scan.col.hidden` `scan.col.firstSeen` `scan.col.lastSeen` `scan.col.country` `scan.col.favorite` `scan.col.iface` `scan.col.issues` `scan.columns.reset`  
**Details:** `scan.details.empty` `scan.details.ssid` … (same field ids) `scan.field.unavailable` `scan.copied`  
**Tabs:** `scan.tab.details` `scan.tab.signal` `scan.tab.occupancy` `scan.tab.advanced`  
**Charts:** `scan.chart.signal` `scan.chart.occupancy` `scan.chart.occupancy.hint` `scan.chart.selected` `scan.chart.unit.pct` `scan.chart.unit.dbm` `scan.chart.empty` `scan.chart.timescale` `scan.chart.table`  
**Status:** `scan.status.found` `scan.status.selected` `scan.status.timescaleHint` `scan.status.scanCore` `scan.status.location` `scan.status.lastScan` `scan.about.title`  
**A11y:** `scan.a11y.skipToGrid` `scan.a11y.skipToDetails` `scan.a11y.rowSelected` `scan.a11y.connected` `scan.a11y.splitterMain`  
**Quality:** `scan.quality.excellent` `scan.quality.good` `scan.quality.fair` `scan.quality.weak` `scan.quality.none`  
**Issues (heuristics):** `scan.issue.overlap24` `scan.issue.weakSecurity` `scan.issue.lowSignal` `scan.issue.crowded` `scan.issue.width40on24` `scan.issue.hiddenSsid` `scan.issue.band24only`

Hidden SSID display: `scan.ssid.hidden`.

---

## 14. Suggested FSD map (no files created)

| Path                            | Role                       |
| ------------------------------- | -------------------------- |
| `pages/ScanWorkbenchPage`       | shell + splits             |
| `widgets/ScanAppBar`            | filters                    |
| `widgets/ScanDataGrid`          | DataGridPro wrapper        |
| `widgets/NetworkDetailsPane`    | 2-col fields               |
| `widgets/ChartStrip`            | three charts               |
| `widgets/StatusBar`             | counts + about             |
| `features/scan-filters`         | band/security/search model |
| `features/scan-selection`       | selected + connected       |
| `features/signal-history`       | ring buffer + timescale    |
| `features/channel-occupancy`    | occupancy heuristic        |
| `entities/bss`                  | row type / i18n field ids  |
| `shared/lib/mui/license.ts`     | `applyMuiXLicense`         |
| `shared/lib/theme`              | Sunset                     |
| `shared/ui/PaneResizeSeparator` | from GuideEditor           |

---

## 15. States / Состояния

| State              | Grid                                     | Dock                                   | Status                             |
| ------------------ | ---------------------------------------- | -------------------------------------- | ---------------------------------- |
| Scanning           | live rows                                | last selection sticky if still present | `found` updates                    |
| Paused             | frozen                                   | frozen                                 | `Paused`                           |
| Demo               | fixture rows + `Chip` Demo               | same                                   | `ScanCore: demo`                   |
| Location denied    | masked SSID/BSSID per ScanCore           | explanation `Alert`                    | `Location: denied` + open Settings |
| No iface           | empty overlay                            | —                                      | error                              |
| No match (filters) | DataGrid overlay `scan.grid.emptyFilter` | —                                      | found = 0                          |
| ScanCore down      | overlay + retry                          | —                                      | error                              |

Overlay: DataGrid `slots.noRowsOverlay` — not a page-level spinner that unmounts the grid.

---

## 16. Implementation order

1. `ScanShell` + Sunset dark + license pin + empty `DataGridPro` compact.
2. Columns (screenshot set) + selection + connected cues.
3. `ScanAppBar` filters + search + column visibility persist.
4. `NetworkDetailsPane` 2-col.
5. Community `LineChart` + timescale buttons.
6. Occupancy `BarChart` + PARITY-GAP caption.
7. Splitters + persist.
8. `StatusBar` / About (no trial).
9. Keyboard, live region, hidden-SSID, Issues chips.
10. Tablet tab fallback.

---

## 17. Explicit non-copies

- Commercial trial / “5 days remaining”
- System-blue full-row brand highlight
- Vendor logo pack
- Wordmark / toolbar typography of WiFi Explorer
- “Noise: −1%” — we show dBm
- True RF spectrum / monitor mode
- Their Issues engine, coloring-rules product, `.wifiexplorer`
- IMS `@mui/x-date-pickers-pro`
- MUI X Premium / Charts Pro / paid X 9.x

This is implementation-ready for a swarm: fork `ScanDataGrid` from Pro (not city admin grid), keep every chart on `@mui/x-charts`, and treat the screenshot as **layout reference** under Sunset.
