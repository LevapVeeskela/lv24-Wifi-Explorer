# LV24 WiFi Explorer — condensed product spec (v1)

**Тип:** оригинальный macOS desktop Wi‑Fi scanner (clean room).  
**Идентификаторы модели, колонок, IPC, файлов — English.** UI copy — RU/EN (собственный текст).

Подробные исследования: `docs/research/`. Этот файл — краткая «истина» для реализации v1.

---

## 1. Information architecture (IA)

Одно главное окно `MainWindow`; отдельные sheet/window для onboarding, settings, export.

```
lv24-Wifi-Explorer
├── OnboardingSheet              (Location + что умеет active scan)
├── PermissionBlockedView        (SSID/BSSID redacted)
├── MainWindow
│   ├── ScanTitleBar / Toolbar   (scan toggle, associated summary, filter focus)
│   ├── ScanAppBar               (band, security, search)
│   ├── SplitView
│   │   ├── ScanDataGrid         (1 row = 1 ObservedBss)
│   │   └── BottomDock           (tabs: details, signal, occupancy charts)
│   └── StatusBar                (counts, scan state, errors)
├── SettingsWindow               (columns, annotations, vendor DB — v1+)
├── SnapshotDocument             (*.lv24scan, open/save)
└── ExportSheet                  (CSV — v1)
```

**Associated vs selected:** `AssociatedLink` (текущий Wi‑Fi Mac) ≠ выделенная строка `ObservedBss`. Toolbar живёт от associated; inspector — от selection.

---

## 2. BSS model

| Concept        | Rule                                                                                            |
| -------------- | ----------------------------------------------------------------------------------------------- |
| **BSS**        | Одна строка таблицы = один `bssid` на одном primary channel (`ObservedBss`).                    |
| **ESS**        | Несколько BSS с одним SSID — разные строки; группировка только в UI (same-SSID bars).           |
| **CoreWLAN**   | `CWNetwork` мапится в `CoreWlanNetworkRecord` (raw), затем в `ObservedBss` (derived).           |
| **Associated** | `AssociatedLink` из `CWInterface` — не копировать Tx rate / active PHY на BSS row.              |
| **Stale**      | `missCount` → dimmed; после `forgetAfter` (~60 s) удалить из live session (history в snapshot). |

Ключевые типы: `packages/core/src/domain/bss.ts`, `identity.ts`, `signal.ts`.

---

## 3. Table columns (default visible)

| column id      | EN title      | Notes                             |
| -------------- | ------------- | --------------------------------- |
| `seriesColor`  | (swatch)      | Stable color per BSSID for charts |
| `bssid`        | BSSID         | Truncate middle; tooltip full MAC |
| `ssid`         | Network Name  | `Hidden` if hidden                |
| `securityLock` | (lock)        | Open vs secure affordance         |
| `vendor`       | Vendor        | IEEE OUI lookup                   |
| `annotation`   | Annotation    | User-editable (v1 patterns)       |
| `signal`       | Signal        | Bar + % or dBm                    |
| `channel`      | Channel       | Primary channel number            |
| `channelWidth` | Channel Width | 20/40/80/160 MHz                  |
| `band`         | Band          | 2.4 / 5 / 6 GHz                   |
| `phyMode`      | Mode          | e.g. `a/n/ac`                     |
| `security`     | Security      | Off by default                    |
| `rssiDbm`      | RSSI          | dBm                               |
| `noiseDbm`     | Noise         | dBm; invalid → `—`                |
| `snrDb`        | SNR           | Derived                           |
| `lastSeenAt`   | Last Seen     | Session time                      |
| `networkType`  | Type          | Infrastructure / IBSS             |

Sort: primary column; secondary key always `bssid`. Signal sorts by dBm even when UI shows %.

---

## 4. Filters (`ScanFilter`)

Предикаты по уже построенным `ObservedBss` — без повторного опроса CoreWLAN.

| Field               | Semantics                                                                  |
| ------------------- | -------------------------------------------------------------------------- |
| `bands`             | `'all'` or subset of `2.4`, `5`, `6`                                       |
| `security`          | `any` \| `open` (`isOpen`) \| `secure` (PSK/802.1X/OWE; WEP counts secure) |
| `ssidQuery`         | Substring, case-insensitive, display name / UTF-8                          |
| `vendorQuery`       | Substring on organization / OUI                                            |
| `minRssiDbm`        | Lower bound inclusive; `null` = off                                        |
| `minSnrDb`          | Lower bound; rows without SNR dropped if set                               |
| `presence`          | `live` / `stale` / `all`                                                   |
| `includeIbss`       | Include ad-hoc                                                             |
| `includeHiddenSsid` | Include hidden networks                                                    |

Status bar counts: **after** filters (`visibleCount` / `totalCount`).

---

## 5. Scan pacing (≥ 3 s)

**Active scan only (v1):** `scanForNetworks(withSSID:nil, includeHidden:)`.

Между **стартами** циклов:

```text
sleepMs = max(userFloorMs, max(3000, lastScanDurationMs * 1.1))
```

- Минимум **3 s** между стартами (не spin при ошибках).
- UI interval presets: `3 | 5 | 10 | 15` s; floor = 3000 ms.
- Band filter — **display only**; адаптер сканирует все поддерживаемые каналы.
- Пока scan in-flight: не стартовать второй; Stop отменяет следующий цикл.

---

## 6. Location (summary)

SSID, BSSID, `countryCode` — **Location-gated** на macOS. Без TCC identity поля redacted; RF (RSSI, channel) могут приходить. Подробно: `docs/PERMISSIONS.md`.

`permissions:status.location`: `granted` | `denied` | `not-determined` | `restricted`.

---

## 7. Signal formulas

### 7.1 Noise validity

`noiseDbm` valid only if `NOISE_VALID_DBM.min ≤ noise ≤ NOISE_VALID_DBM.max` (−120…−20).  
CoreWLAN `0` → **invalid** (no sample).

### 7.2 SNR

```text
snrDb = rssiDbm − noiseDbm   // both dBm; null if noise invalid
```

### 7.3 Quality label (`SignalQuality`)

Basis: **`snr`** if valid noise; else **`rssi-fallback`**.

**SNR thresholds (dB), inclusive lower bound:**

| quality   | min SNR |
| --------- | ------- |
| excellent | 40      |
| good      | 25      |
| fair      | 15      |
| poor      | 10      |
| unusable  | &lt; 10 |

**RSSI fallback (dBm), if no SNR:**

| quality   | min RSSI |
| --------- | -------- |
| excellent | −50      |
| good      | −60      |
| fair      | −70      |
| poor      | −80      |
| unusable  | &lt; −90 |

Pick highest tier where `value ≥ min`. Эвристика UI, не IEEE.

### 7.4 Signal bar / percent (linear dBm)

Display % for RSSI — **linear map**, not vendor “accurate conversion”:

```text
rssiClamped = clamp(rssiDbm, -100, -50)
signalPercent = round((rssiClamped + 100) / 50 * 100)   // 0..100
```

−100 dBm → 0%; −50 dBm → 100%; below −100 → 0%; above −50 → 100%.

Charts may also show raw dBm axis (−100…−30 typical grid).

---

## 8. Issues heuristics (v1 strip)

Open thresholds; keys map to i18n (`scan.issue.*`):

| key                          | Trigger                                                        |
| ---------------------------- | -------------------------------------------------------------- |
| `scan.issue.hiddenSsid`      | SSID available and `hidden`                                    |
| `scan.issue.weakSecurity`    | `primary` is `open` or `wep`                                   |
| `scan.issue.lowSignal`       | `rssiDbm < −70` (see `src/features/scan-issues/thresholds.ts`) |
| `scan.issue.width40on24`     | band 2.4 and width 40 MHz                                      |
| `scan.issue.crowdedChannel`  | ≥ 4 other BSS with overlapping primary channel + band          |
| `scan.issue.overlap24`       | 2.4 GHz primary not 1/6/11 (Japan ch14 exception)              |
| `scan.issue.band24only`      | same SSID (octet match) appears only on 2.4 GHz, not hidden    |
| `scan.issue.tooManyNetworks` | ≥ 80 BSS in the current scan                                   |
| `scan.issue.largeGroup`      | same SSID has ≥ 8 BSS                                          |

---

## 9. Snapshot `.lv24scan`

| Item        | Rule                                                                                              |
| ----------- | ------------------------------------------------------------------------------------------------- |
| Extension   | `*.lv24scan` only (not `.wifiexplorer` / competitor UTI)                                          |
| Contents    | BSS rows + per-BSSID history + annotations + pinned colors + metadata (app version, OS, interval) |
| Open        | Inspector + editable annotations; live scan stopped on open                                       |
| Format      | JSON document v1 (SQLite optional later)                                                          |
| Save prompt | LV24 copy on stop/quit                                                                            |

---

## 10. Clean-room non-copies

**Do not:** Intuitibits / WiFi Explorer brand, assets, help text, trial UX, `.wifiexplorer`, `dot11.net.*` filter DSL, decompiled app, their vendor DB endpoints, pixel-clone trade dress, unknown proprietary dBm curves or Issues copy.

**Do use:** public 802.11 terms, IEEE OUI, Apple `CoreWLAN` / `CoreLocation`, our `.lv24scan`, our formulas above, our RU/EN strings.

---

## 11. v1 scope pointer

In v1: `.lv24scan`, Issues strip, keyed search (simple), Advanced IE tree, 6 GHz when hardware reports it.  
Out of v1: see `docs/PARITY-GAP.md`.
