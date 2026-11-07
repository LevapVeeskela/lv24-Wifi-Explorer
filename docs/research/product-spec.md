<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: 484675f5-16ae-48b5-9010-1428c2972c56.jsonl -->

# Product feature specification

# Спецификация продукта `lv24-Wifi-Explorer`

**Тип:** оригинальный macOS desktop Wi-Fi scanner / analyzer  
**Платформа MVP:** macOS, встроенный Wi-Fi адаптер, `CoreWLAN`  
**Метод:** clean room. Функциональный класс — публично описанные Wi-Fi scanner apps (в т.ч. WiFi Explorer / Intuitibits). Не копируем бренд, иконки, уникальный текст, форматы файлов, DSL фильтров и неизвестные проприетарные алгоритмы.

Технические идентификаторы, имена полей, API и единицы — на English. Пользовательский UI-copy — наш собственный (RU/EN), не цитаты Intuitibits.

---

## 0. Разбор приложенного скриншота (эталон класса UX, не макет клонирования)

Окно — классический macOS document window в Dark Mode. Четыре горизонтальных пояса: **toolbar → filter bar → Networks Table → inspector (tabs + details + charts) → status bar**.

### 0.1 Title bar / toolbar

| Элемент | Что видно | Что это значит для нас |
|---|---|---|
| Traffic lights | стандартные close/minimize/zoom | стандартный `NSWindow` |
| Title | `Scanning-Wi-Fi \| HUKKKA_stafff` | состояние скана + **SSID ассоциированной сети**, не выбранной строки |
| Правый статус связи | `60% · 5 GHz · 20 MHz · 144 Mbps` | live PHY ассоциированной сети: RSSI%, band, channel width, **current Tx rate**, не `maxRate` BSS |
| Иконка поиска | лупа справа | фокус на `Filter` field (`⇧⌘F`) |

Это **два разных объекта**:
- `associatedNetwork` — то, к чему сейчас подключен Mac;
- `selectedBSS` — выделенная строка таблицы (на скрине `HUKKKA_stafff` / `A8:9D:…:24:3E`, signal 81%, channel 60, max rate 260.1 Mbps).

### 0.2 Quick Filter bar

Слева направо:

1. **Band pills:** `All` | `2.4 GHz` | `5 GHz` (взаимоисключающие; `All` = обе). На скрине 6 GHz нет — либо нет железа Wi-Fi 6E, либо UI этой сборки его не показывает.
2. **Security pills:** `Open` | `Secure` (можно независимо от band; на скрине оба выкл = любой security).
3. **Search field:** placeholder вроде `Filter` (на скрине локализованный `Filterfor`).
4. **Settings / overflow** (шестерёнка) — Settings или меню колонок.

### 0.3 Networks Table (12 строк, 1 выделена)

Слева у каждой строки — **color swatch** (стабильный цвет BSS для графиков).

Колонки слева направо (как на скрине):

| # | Заголовок на скрине | Смысл | Примеры |
|---|---|---|---|
| 0 | (swatch) | цвет трекинга | зелёный / оранжевый / серый / синий |
| 1 | `BSSID` | MAC, усечённый | `A8:9D:…:24:3E` |
| 2 | `Network Name` | SSID | `HUKKKA_stafff`, `L'ECOLE1_5`, `TP-Link_…` |
| 3 | (lock icon, без заголовка) | security affordance | 🔒 = secure, открытый замок = open |
| 4 | `Vendor` | OUI → manufacturer | Cisco Systems, MikroTik, TP-Link |
| 5 | `Annotations` | редактируемые метки | пусто / галочка |
| 6 | `Signal` | RSSI как % + bar | `81%`, `3%`, `1%` |
| 7 | `Channel` | primary channel | `60`, `36`, `2`, `100` |
| 8 | `Channel Width` | 20/40/80/… MHz | почти все `20 MHz`; MikroTik `80 MHz` |
| 9 | `Band` | `2.4 GHz` / `5 GHz` | — |
| 10 | `Mode` | PHY letters | `a/n/ac`, `b/g/n`, `a/n/ac/ax` |

Наблюдения по данным скрина (для тестовых фикстур, не для копирования UI):

- Один SSID `HUKKKA_stafff` живёт на нескольких BSSID/каналах: 5 GHz ch 36/60 и 2.4 GHz ch 9/13 — типичный multi-radio AP / controller SSID.
- `Tangiers lounge` — тот же паттерн (5 GHz ch 40 + 2.4 GHz ch 13).
- MikroTik на 5 GHz: width 80 MHz, mode `a/n/ac/ax`, signal 1–3% — дальние BSS.
- Hidden/странное имя `A1-FT34-AEA8E8-5GHz` — валидный SSID, не hidden.
- Выделенная строка: синий selection, BSSID полностью в details (`A8:9D:21:74:24:3E`).

### 0.4 Inspector tabs

`Network Details` (активен) · `Signal Strength` · `Spectrum 2.4 / 5 GHz` · `Advanced Details`

На этой сборке **нет** отдельного `Spectrum 6 GHz` — логично при отсутствии 6 GHz строк.

### 0.5 Network Details (выбранный BSS)

Две колонки key–value + qualitative:

| Поле | Значение на скрине | Комментарий |
|---|---|---|
| `SSID` | `HUKKKA_stafff` | |
| `BSSID` | `A8:9D:21:74:24:3E` | полный MAC |
| `Vendor` | `Cisco Systems` | OUI |
| `Signal Quality` | `Excellent` | дискретная шкала по SNR |
| `Signal` | `81%` | та же единица, что в таблице |
| `Band` | `5 GHz UNII-2A` | band + UNII sub-band |
| `Mode` | `802.11a/n/ac` | полная форма, в таблице короче |
| `Max Rate` | `260.1 Mbps` | theoretical max BSS, не current Tx |
| `Channel` | `60` | primary |
| `Noise` | `-1%` | та же % шкала; у пола конверсии выглядит как артефакт — **не копировать слепо** |
| `Type` | `Infrastructure` | vs IBSS / Mesh |
| `Security` | `WPA2-Personal` | AKM class |
| `Encryption` | `CCMP-128` | pairwise/group cipher |
| `Channel Width` | `20 MHz` | |
| `SNR` | `48.0 dB` | `RSSI − noise` |

### 0.6 Нижний графический ряд (внутри Network Details)

Три панели:

1. **Signal timeline (слева)**  
   - X: время `22:09 … 22:12` + `Now`  
   - Y: примерно −100…0 dBm или 0–100% (сетка 10/50/90%)  
   - Две дорожки `2.4 GHz` / `5 GHz`  
   - На скрине почти пусто — короткая сессия / мало сэмплов  
   - Подпись оси: выбранный SSID

2. **Same-SSID bars (центр), заголовок `HUKKKA_stafff`**  
   Сравнение всех BSSID с тем же SSID. Две группы 2.4 / 5. Клик по столбцу выбирает соответствующий BSS.

3. **Same-channel occupancy (справа), заголовок `Channel 60`**  
   Столбцы всех BSS на том же primary channel; выбранный — выше/ярче. Это **не RF spectrum analyzer**, а occupancy по scan table.

Под графиками: stepper timescale (`Signal` + `↑/↓`, hint «стрелки / пробел»).

### 0.7 Status bar

- Слева: `Networks Found: 12`, `Selected: 1` — after-filter counts.
- Справа на скрине: trial `Not Activated – 5 Days Remaining` — **наш продукт это не копирует**.

### 0.8 Чего на скрине нет, но есть в публичных описаниях класса

Sidebar automatic filters; Issues; Spectrum «холмы» по ширине канала; IE tree; 6 GHz tab; column picker; save snapshot prompt; connected row **bold**.

---

## 1. Information architecture / screens

Одно окно `MainWindow`. Никаких отдельных «мастеров». Settings — `Settings` window (или tabbed sheet).

```
lv24-Wifi-Explorer
├── OnboardingSheet          (первый запуск: Location + «что умеет сканер»)
├── PermissionBlockedView    (если Location выключен / SSID/BSSID redacted)
├── MainWindow
│   ├── Toolbar
│   ├── FilterBar
│   ├── SplitView (vertical)
│   │   ├── Optional Sidebar (v1+)
│   │   └── Content
│   │       ├── NetworksTable
│   │       └── Inspector
│   │           ├── TabBar
│   │           ├── NetworkDetailsPane
│   │           ├── SignalStrengthPane
│   │           ├── Spectrum24_5Pane
│   │           ├── Spectrum6Pane          (v1, если железо умеет 6 GHz)
│   │           └── AdvancedDetailsPane    (v1)
│   └── StatusBar
├── SettingsWindow
│   ├── General
│   ├── Columns
│   ├── Annotations
│   ├── VendorDatabase
│   └── Advanced
├── SnapshotDocument          (открытый .lv24scan)
└── ExportSheet
```

### 1.1 Toolbar

| Control | ID | Поведение |
|---|---|---|
| Start / Stop | `scanToggle` | старт/стоп периодического active scan. Shortcut: `⌃S` |
| Scan state title | `windowTitle` | `Scanning` / `Paused` / `Snapshot` + associated SSID |
| Associated summary | `associatedStatus` | `signal · band · width · txRate`. Клик — select+scroll к associated BSS. Tooltip: BSSID, channel, security, `rssiDbm` |
| Filter focus | `filterSearchButton` | фокус `FilterBar.searchField` |
| Settings | `settingsButton` | открыть Settings |

Не класть в toolbar: выбор USB-адаптера (MVP не поддерживает), license badge, чужой бренд.

### 1.2 FilterBar

| Control | ID | Тип |
|---|---|---|
| Band | `bandFilter` | segmented: `all` \| `2.4` \| `5` \| `6` (6 скрыть, если радио не умеет) |
| Security | `securityFilter` | segmented multi: `any` (default) / `open` / `secure` |
| Search | `searchField` | наш язык запросов, §3.4 |
| Clear | `clearFilters` | сброс band+security+query |
| Sensitivity hint | optional | если `minRssiDbm` ≠ default |

### 1.3 NetworksTable

Одна строка = один **BSS** (`bssid` + radio). Один SSID на трёх радио = три строки.

Правила:

- Selection: single в MVP; multi в v1 (для export selected / copy).
- Associated BSS: **bold** + trailing badge `Connected` (наш copy).
- Stale BSS (не видели дольше `staleAfter`): dimmed; удаление после `forgetAfter`.
- Hidden SSID: placeholder `Hidden` + `isHidden = true`.
- Color swatch — первая колонка, не сортируется как данные, но участвует в графиках.
- Header context menu: Show/Hide, Auto Size, Auto Size All (`⌥⌘=`).
- Только `annotation` inline-editable.
- Double-click BSSID/SSID → Copy.
- Associated BSS автоселект при первом успешном скане сессии.

### 1.4 Inspector tabs

| Tab | ID | Shortcut | Содержание |
|---|---|---|---|
| Network Details | `details` | `⌘1` | key-value + 3 мини-графика + timescale |
| Signal Strength | `signal` | `⌘2` | полноширинный timeline всех **видимых** BSS; selected = fill |
| Spectrum 2.4 / 5 | `spectrum24_5` | `⌘3` | occupancy по каналам; selected primary highlighted |
| Spectrum 6 | `spectrum6` | `⌘4` | то же для 6 GHz; скрыть, если нет 6 GHz BSS и нет железа |
| Advanced Details | `advanced` | `⌘5` | дерево Information Elements (v1) |

`⌘[` / `⌘]` — prev/next tab.

Пустое состояние: «Выберите сеть в таблице». Snapshot: те же вкладки, без live scan.

### 1.5 Optional Sidebar (v1, не MVP)

Автофильтры по текущему результату: SSID, Vendor, Channel, Channel Width, Security, Mode, Band. Space — negate. Это **наша** боковая панель, не клон layout Pro.

### 1.6 StatusBar

- `visibleCount` / `totalCount` / `selectedCount`
- `lastScanAt`, `scanDurationMs`, `scanError` если есть
- `locationDenied` warning
- **Не** trial/license чужого продукта

### 1.7 Settings

**General**

- `signalUnit`: `dBm` | `percent`
- `percentFullDbm` / `percentZeroDbm` (концы линейной интерполяции)
- `minRssiDbm` (scan sensitivity / hide weak)
- `staleAfter` / `forgetAfter`
- `autoStartScanOnLaunch`: Bool
- `includeHiddenSSID`: Bool

**Columns** — visibility, order, widths (v1: pin, rename).

**Annotations** — CRUD, wildcard BSSID, import/export CSV.

**Vendor Database** — bundled IEEE MA-L; ручное/авто обновление с публичного реестра.

**Advanced**

- hide empty spectrum band if no visible BSS
- include mesh/hidden service SSIDs (heuristic, выкл. по умолчанию)
- graph labels: SSID / AP name / annotation
- appearance follow system

### 1.8 Меню (macOS)

`lv24-Wifi-Explorer` · `File` (New Scan Window later, Open Snapshot, Save Snapshot, Export All/Visible/Selected, Close) · `Edit` (Copy, Copy BSSID, Copy SSID, Select All) · `Scan` (Start/Stop, Clear Results) · `View` (tabs, labels, gridlines, text size, timescale) · `Window` · `Help` (наш help, не чужой).

### 1.9 Onboarding / permissions

1. Объяснить: приложение **не** берёт GPS; Location нужен macOS, чтобы отдать SSID/BSSID.
2. `CLLocationManager.requestWhenInUseAuthorization()`.
3. Если отказ — `PermissionBlockedView` с шагами в System Settings → Privacy & Security → Location Services.
4. Скан без permission не имитирует данные.

---

## 2. Полная модель данных BSS / network

Источник истины — **BSS**, не SSID. SSID — группирующий атрибут.

### 2.1 Идентичность

```text
BSS
  id                = bssid normalized "AA:BB:CC:DD:EE:FF" (uppercase, colon)
  bssid             : MAC48
  ssid              : String?          // nil / empty → hidden
  ssidUtf8          : Data             // сырые байты IE 0
  isHidden          : Bool
  isNontransmitted  : Bool?            // Multiple BSSID, later
  advertisedBy      : BSSID?           // transmitted BSS, later
```

Ключ таблицы: `id`. Не ключ: SSID.

### 2.2 Классификация

```text
  type              : infrastructure | ibss | mesh
  band              : band24 | band5 | band6
  uniiSubband       : unii1 | unii2a | unii2c | unii3 | unii4 | unii5..unii8 | none
  isDFS             : Bool             // 5 GHz weather/DFS
  isPSC             : Bool             // 6 GHz Preferred Scanning Channel
```

UNII из primary frequency (публичные таблицы FCC/ETSI), не из чужого UI.

### 2.3 Канал / ширина

```text
  channel           : UInt             // primary
  channelWidthMHz   : 20 | 40 | 80 | 160 | 320 | unknown
  centerFreqMHz     : UInt             // primary center (ch 60 → 5300)
  cf1MHz            : UInt?            // VHT/HE center
  cf2MHz            : UInt?            // 80+80
  secondaryOffset   : none | above | below
```

`CoreWLAN` даёт `CWChannel` (number, band, width). Точные 80/160/320 — из HT/VHT/HE/EHT Operation IE, если есть `informationElementData`.

### 2.4 PHY / rates

```text
  phyModes          : Set<PhyLetter>   // a, b, g, n, ac, ax, be
  generation        : wifi4 | wifi5 | wifi6 | wifi6e | wifi7 | unknown
  spatialStreams    : UInt?
  maxRateMbps       : Double?          // theoretical BSS max
  minRateMbps       : Double?
  basicRatesMbps    : [Double]
  supportedRatesMbps: [Double]
  htProtection      : none | nonHtMixed | twentyMHz | unknown
```

`generation`: `be` → wifi7; `ax` + band6 → wifi6e; `ax` → wifi6; `ac` → wifi5; `n` → wifi4.

`maxRateMbps` считаем **сами** по публичным MCS-таблицам (HT/VHT/HE/EHT × NSS × width × GI). Не копировать эвристики стороннего приложения. Если IE нет — честно `unknown`, не верить слепо `CWNetwork` PHY (публично известно, что CoreWLAN иногда врёт mode/security).

### 2.5 RF measurements (текущие + история)

```text
  rssiDbm           : Int              // CoreWLAN rssiValue
  noiseDbm          : Int              // CoreWLAN noiseMeasurement; 0 / +127 = invalid
  snrDb             : Double?          // rssiDbm - noiseDbm, если noise валиден
  signalPercent     : Double           // наша формула §2.11
  noisePercent      : Double
  quality           : excellent | good | fair | poor | unusable | unknown

  history           : [Sample]         // cap, ring buffer
  Sample
    t               : Date
    rssiDbm         : Int
    noiseDbm        : Int?
    snrDb           : Double?
    associatedTxMbps: Double?          // только если этот BSS associated
```

### 2.6 Security

```text
  securityClass     : open | wep | wpaPersonal | wpa2Personal | wpa3Personal
                      | wpa2Wpa3Personal | wpaEnterprise | wpa2Enterprise
                      | wpa3Enterprise | wpa2Wpa3Enterprise
                      | enhancedOpen | unknown
  akms              : [psk | sae | ieee8021x | ftPsk | ftSae | owe | other]
  pairwiseCiphers   : [ccmp128 | gcmp128 | gcmp256 | tkip | wep | other]
  groupCipher       : Cipher?
  mfpCapable        : Bool?
  mfpRequired       : Bool?
  wps               : none | configured | notConfigured | locked
  fastTransition    : none | ota | otd
```

Парсить RSN IE (48), WPA vendor IE, RSNX. Не доверять одному `supportsSecurity`.

Отображение:

- lock icon: closed если не `open`/`enhancedOpen`;
- таблица: короткий `WPA2-Personal`;
- details: class + cipher + PMF.

### 2.7 Идентичность вендора / AP

```text
  oui               : "AABBCC"         // первые 3 октета BSSID
  vendorName        : String?          // IEEE MA-L / MA-M / MA-S
  vendorSource      : bundled | updated | unknown
  apName            : String?          // v1+: публичные vendor IE, свой декодер
  countryCode       : String?          // IE 7 или CoreWLAN countryCode
```

Локально администрируемые MAC (U/L bit) → vendor `Randomized / locally administered`, не «Unknown vendor» как бренд.

### 2.8 Load / beacon (если IE есть)

```text
  beaconIntervalTu  : UInt?            // 1 TU = 1024 µs; 100 TU ≈ 102.4 ms
  dtimPeriod        : UInt?
  stationCount      : UInt?            // QBSS / BSS Load IE 11
  channelUtilPct    : Double?          // raw 0–255 → * 100/255
  availableAdmCap   : UInt?
```

### 2.9 Время жизни в сессии

```text
  firstSeen         : Date
  lastSeen          : Date
  seenRelative      : TimeInterval     // now - lastSeen, колонка Seen
  missCount         : UInt             // подряд сканов без BSS
  isStale           : Bool
  isForgotten       : Bool             // к удалению
```

Active scan без ACK на broadcast probe: BSS может пропасть на один цикл. **Не** обнулять RSSI в 0. Держать last value `missCount` циклов (default 2), потом stale.

### 2.10 Пользовательские overlay (не из эфира)

```text
  annotation        : String?
  color             : Color            // session default = hash(bssid)
  colorPinned       : Bool
  isSelected        : Bool             // UI state
  isAssociated      : Bool             // этот BSSID == CWInterface.bssid
```

### 2.11 Производные формулы (наши, документируем в help)

**SNR**

```text
if noiseDbm is valid and noiseDbm < rssiDbm:
  snrDb = rssiDbm - noiseDbm
else:
  snrDb = unknown
  quality = unknown
```

**Quality** (публичные WLAN-пороги, ±1 dB на границах ок):

| `snrDb` | `quality` |
|---|---|
| ≥ 40 | `excellent` |
| 25–39 | `good` |
| 15–24 | `fair` |
| 10–14 | `poor` |
| < 10 | `unusable` |

**dBm → %** — линейная интерполяция, концы в Settings:

```text
default percentZeroDbm = -100
default percentFullDbm = -50
percent = clamp(100 * (dbm - zero) / (full - zero), 0, 100)
```

Одинаково для signal и noise. Не допускать отрицательный % (как `-1%` на скрине). Не заявлять «точный» чужой mapping.

**Associated current rate** — `CWInterface.transmitRate()` в Mbps; это **не** `maxRateMbps`.

### 2.12 Сырые IE

```text
  ieBlob            : Data?            // CWNetwork.informationElementData
  ies               : [IE]
  IE
    id              : UInt8            // 255 → extId
    extId           : UInt8?
    oui             : Data?
    raw             : Data
    decoded         : DecodedIE?       // наш декодер
  ieCount           : Int
  ieTotalLength     : Int
```

Минимум декодеров v1: SSID(0), Rates(1/50), DS(3), Country(7), BSS Load(11), HT Cap(45), RSN(48), HT Op(61), Ext Cap(127), VHT Cap(191), VHT Op(192), RSNX(244), HE Cap/Op (255/35, 255/36), EHT если документированы, Vendor Specific(221) как raw + OUI.

Неизвестный IE: hex + id, без выдуманных имён.

### 2.13 Associated interface (отдельный объект)

```text
AssociatedLink
  interfaceName     : String           // en0
  ssid, bssid
  rssiDbm, noiseDbm, snrDb
  channel, band, channelWidthMHz
  transmitRateMbps
  security
  ipv4 / ipv6       : optional later
```

Поллить чаще, чем полный scan (1 с), потому что `CWInterface.rssiValue` дешёвый. Toolbar живёт отсюда.

### 2.14 ScanSession / Snapshot

```text
ScanSession
  id, startedAt, endedAt?
  appVersion, macOSVersion, model
  adapterName, supports6GHz
  regulatoryHint
  samplesIntervalMs
  bssById           : [BSSID: BSS]
  historyById       : [BSSID: [Sample]]
  annotations       : [AnnotationRule]
  pinnedColors      : [BSSID: Color]
```

Файл: **`*.lv24scan`** (наш JSON или SQLite). Не `.wifiexplorer`.

### 2.15 AnnotationRule

```text
AnnotationRule
  id
  bssidPattern      : String           // exact MAC или wildcard * ?
  text              : String
```

`*` = 0+ hex-символов/октетов; `?` = 1 символ. Пример: `A8:9D:21:74:24:*`.

### 2.16 Что macOS реально отдаёт vs что выводим

| Поле | Источник | Риск |
|---|---|---|
| ssid, bssid | `CWNetwork` + Location | nil без TCC |
| rssi, noise | `CWNetwork` | noise часто мусор |
| channel/band/width | `CWChannel` | width может быть неполным |
| beaconInterval | `CWNetwork` | ок |
| countryCode | `CWNetwork` / IE 7 | Location |
| ibss | `CWNetwork.ibss` | ок |
| security/PHY | **IE first**, CoreWLAN fallback | CoreWLAN ошибается |
| vendor | IEEE OUI DB | локальные MAC |
| maxRate, streams, UNII, QBSS, WPS, FT, AP name | IE / наши таблицы | нет IE → unknown |
| current Tx rate | `CWInterface` | только associated |
| clients list | нет в active scan | later / monitor mode |
| true RF spectrum | нет у Broadcom STA | не обещать waterfall |

---

## 3. Table columns + filters + sort

### 3.1 Колонки

**Default visible (как рабочий scanner, не как pixel-clone):**  
`color`, `bssid`, `ssid`, `securityIcon`, `vendor`, `annotation`, `signal`, `channel`, `channelWidth`, `band`, `mode`

**Все колонки**

| id | Title (EN) | Тип | Default | Sort | Источник |
|---|---|---|---|---|---|
| `color` | (swatch) | Color | on | нет | overlay |
| `bssid` | BSSID | MAC, truncate `AA:BB:…:EE:FF`, tooltip полный | on | lexical MAC | CoreWLAN |
| `ssid` | Network Name | String / `Hidden` | on | case-insensitive | CoreWLAN |
| `securityIcon` | (lock) | icon | on | open < secure | securityClass |
| `security` | Security | enum string | off | enum | IE |
| `vendor` | Vendor | String | on | text | OUI |
| `annotation` | Annotation | editable | on | text | user |
| `signal` | Signal | bar + `%` или dBm | on | rssiDbm | CoreWLAN |
| `noise` | Noise | `%` или dBm | off | noiseDbm | CoreWLAN |
| `snr` | SNR | `12.0 dB` | off | snrDb | derived |
| `quality` | Quality | enum | off | rank | derived |
| `channel` | Channel | Int | on | numeric | CWChannel |
| `channelWidth` | Channel Width | `20 MHz` | on | numeric | CW / IE |
| `band` | Band | `2.4 GHz` | on | 2.4 < 5 < 6 | CWChannel |
| `unii` | UNII | `UNII-2A` | off | enum | table |
| `mode` | Mode | `a/n/ac` | on | generation then letters | IE |
| `generation` | Generation | Wi-Fi 4/5/6/6E/7 | off | numeric | derived |
| `maxRate` | Max Rate | `260.1 Mbps` | off | numeric | MCS tables |
| `minRate` | Min Rate | Mbps | off | numeric | rates IE |
| `basicRates` | Basic Rates | `1, 2, 5.5, 11` | off | — | IE |
| `streams` | Streams | Int | off | numeric | HT/VHT/HE |
| `type` | Type | Infrastructure/IBSS/Mesh | off | enum | cap / IE |
| `country` | Country | `US` | off | text | IE / CW |
| `beaconInterval` | Beacon Interval | `102.4 ms` | off | numeric | CW / IE |
| `centerFreq` | Center Frequency | `5300 MHz` | off | numeric | channel table |
| `channelUtil` | Channel Utilization | `%` | off | numeric | BSS Load |
| `stations` | Stations | Int | off | numeric | BSS Load |
| `wps` | WPS | Configured/… | off | enum | WPS IE |
| `fastTransition` | Fast Transition | OTA/OTD | off | enum | MDIE / RSN |
| `apName` | AP Name | String | off | text | vendor IE, v1+ |
| `firstSeen` | First Seen | datetime | off | date | session |
| `lastSeen` | Last Seen | datetime | off | date | session |
| `seen` | Seen | relative | off | lastSeen | session |
| `oui` | OUI | `A8:9D:21` | off | text | BSSID |

v1: reorder drag, persist widths, `View → Size All Columns to Fit`.  
Позже: pin, rename, profiles.

Не обещать 550+ custom IE columns в v1.

### 3.2 Sort

- Клик заголовка: asc → desc → (опционально) unsort.
- Secondary key всегда `bssid` для стабильности.
- Signal/noise сортируются по dBm, даже если UI в %.
- Mode: generation desc, затем lexical `phyModes`.

### 3.3 Quick filters (AND с search)

| Control | Predicate |
|---|---|
| Band `2.4` / `5` / `6` | `bss.band ==` |
| `open` | `securityClass == open` |
| `secure` | `securityClass ∉ {open, unknown}` |
| `minRssiDbm` | `rssiDbm >= setting` |

Счётчики status bar — **после** фильтров: `visibleCount` vs `totalCount`.

### 3.4 Search language (наш, не `dot11.net.*`)

Простой tokenizer. Регистр операторов важен только для `AND`/`OR`/`NOT`.

**Keyword (без ключа)** матчит `ssid`, `annotation`, `vendor`, `apName` (contains, case-insensitive).  
`"exact phrase"` — точное.

**Shortcuts**

| Ввод | Значение |
|---|---|
| `2.4`, `2.4ghz`, `24ghz` | band24 |
| `5`, `5ghz` | band5 — **только** если есть единица/`ghz`; голый `5` = channel 5 |
| `6ghz` | band6 |
| `20`, `20mhz`, `40mhz`… | width |
| `1`, `36`, `36-48` | channel / range |
| `aa:`, `:3e`, `a8:9d:` | BSSID octet |
| `>=-65`, `<=50%` | RSSI |
| `open`, `secure`, `wep`, `wpa`, `wpa2`, `wpa3`, `owe`, `802.1x`, `psk`, `sae` | security |
| `a`, `n`, `ac`, `ax`, `be`, `11n`, `802.11ac` | PHY |
| `wifi4`…`wifi7` | generation |
| `hidden` | isHidden |
| `wps`, `ft` | capability |

**Keyed (v1)**

```text
ssid:hukka
bssid:a8:9d:21
vendor:cisco
channel:60
width:20
band:5
snr>=25
signal>=-70
noise<=-90
country:US
mode:ax
```

Комбинаторы: `AND`, `OR`, `NOT`, скобки.

Не копировать prefix `dot11.net` и autocomplete на 680 IE fields.

### 3.5 Context menu строки

- Copy BSSID / SSID / row (TSV видимых колонок)
- Apply as Filter (v1: взять значение колонки)
- Set Color…
- Edit Annotation
- Reveal in Spectrum (переключить tab + highlight)

---

## 4. Detail pane fields

Всегда про выбранный BSS. Пустые = `—`, не `0`, не выдуманные вендоры.

### 4.1 Network Details — обязательные поля MVP

| Label (EN в модели / RU в UI) | Field | Формат |
|---|---|---|
| SSID | `ssid` | hidden → «Скрытая сеть» |
| BSSID | `bssid` | полный MAC, кнопка Copy |
| Vendor | `vendorName` | + OUI в tooltip |
| Signal Quality | `quality` | Excellent / Good / Fair / Poor / Unusable |
| Signal | `rssiDbm` + `signalPercent` | по `signalUnit` |
| Noise | `noiseDbm` + `noisePercent` | invalid → `—` |
| SNR | `snrDb` | `48.0 dB` |
| Band | `band` + `uniiSubband` | `5 GHz · UNII-2A` |
| Channel | `channel` | + DFS/PSC badge |
| Channel Width | `channelWidthMHz` | `20 MHz` |
| Mode | `phyModes` | `802.11a/n/ac` |
| Max Rate | `maxRateMbps` | `260.1 Mbps` или `—` |
| Type | `type` | Infrastructure / IBSS / Mesh |
| Security | `securityClass` | `WPA2-Personal` |
| Encryption | ciphers | `CCMP-128` |
| Country | `countryCode` | если есть |
| Connected | `isAssociated` | badge, current Tx rate |

### 4.2 Дополнительно v1

Beacon Interval, Streams, Basic/Supported Rates, Stations, Channel Utilization, WPS, Fast Transition, PMF, AP Name, First/Last Seen, IE count, Generation, Center Frequency.

### 4.3 Issues strip (v1, наши правила, пороги открыты в help)

Показывать 0–N карточек, не «магический AI».

| id | Когда |
|---|---|
| `width40on24` | band24 && width ≥ 40 |
| `overlap24` | band24 && channel ∉ {1,6,11} (и не JP 14-only special-case) |
| `crowdedChannel` | N других BSS с overlapping primary, N ≥ 4 (настройка) |
| `lowSignal` | rssiDbm < −70 |
| `lowSnr` | snrDb < 25 |
| `weakSecurity` | open / wep / TKIP-only / нет PMF на WPA3-claim |
| `hiddenSsid` | isHidden |
| `legacyOnly` | max PHY ∈ {a,b,g} |
| `highUtil` | channelUtilPct ≥ 70 |
| `dfs` | isDFS (инфо, не ошибка) |

Не копировать чужие формулировки «Large Group of Networks» и т.п.

### 4.4 Color chip

Внизу details: клик → `NSColorPanel`. Pin color на `bssid`. Unpin = снова hash.

---

## 5. Charts

Все графики — **визуализация scan table + history**, не SDR. Честно писать в UI: «занятость каналов по результатам сканирования», не «спектр-анализатор».

Общее:

- цвет линии/столбца = BSS `color`;
- клик по элементу → select row;
- hover tooltip: SSID, BSSID, channel, RSSI, width;
- selected: толще / fill;
- associated: пунктир или badge;
- accessibility: не полагаться только на цвет (иконка Connected, pattern);
- Option-drag → PNG в Finder (v1);
- пустые band-графики можно прятать (setting).

### 5.1 Signal timeline

**Где:** компакт в Network Details (selected + same-SSID siblings) и полный tab Signal Strength (все visible BSS).

| Ось | Правила |
|---|---|
| X | время, live справа `Now` |
| Y | если unit dBm: −100…0; если %: 0…100 |
| Series | одна линия = один BSS |
| Modes (v1) | Signal / Signal+Noise / SNR |

Timescale (секунды видимого окна): `30, 60, 120, 300, 600, 1800`.  
Shortcuts: `⇧⌘.` / `⇧⌘,`, stepper, ←/→, Space = pause redraw (скан идёт).

Ring buffer: default 1800 s @ 1 sample/scan (~3–5 с) ≈ 360–600 точек/BSS. Snapshot сохраняет history.

Пропуск скана: **разрыв линии**, не drop на −100.

В Details слева — две дорожки 2.4 / 5 (и 6 если есть).

### 5.2 Same-SSID comparison

Вертикальные bars всех BSS с тем же `ssid` (hidden не группировать вместе).  
Группы по band. Высота = текущий RSSI (% или dBm).  
Нужен когда siblings ≥ 2; иначе скрыть и растянуть timeline.

### 5.3 Same-channel occupancy

Bars всех visible BSS с тем же `channel` (+ опционально overlapping width в v1).  
Заголовок: `Channel 60 · 5 GHz`.  
Это co-channel contention helper, не utilization % из QBSS.

### 5.4 Spectrum 2.4 / 5 (channel map)

Два графика друг над другом.

**2.4 GHz**

- X: ch 1–13 (14 если JP/регуляторика);
- непересекающиеся 20 MHz: 1, 6, 11 — лёгкие маркеры;
- каждый BSS — «холм»: центр = primary, ширина ∝ `channelWidthMHz` (20 ≈ 1 ch, 40 ≈ 2), высота ∝ RSSI;
- 40 MHz на 2.4 — рисовать overlap честно (это и есть смысл графика).

**5 GHz**

- X: 36–177 / регуляторика адаптера;
- группировать UNII, разрыв между UNII-2C и UNII-3;
- DFS каналы — нейтральная штриховка оси;
- 20/40/80/160 как разная ширина холма;
- selected: обводка primary channel.

Подписи холмов: selected всегда; остальные — если `showAllLabels` (`⌥L`) или hover.

Это **не** density/waterfall. Waterfall только later + внешний analyzer.

### 5.5 Spectrum 6 GHz (v1)

Ch 1–233, PSC маркеры: 5, 21, 37, … 229 (публичный список).  
320 MHz — редко, не ломать шкалу. Скрыть tab, если нет hardware и нет BSS.

### 5.6 Utilization (v1, не путать с §5.3)

Таблица/bars по каналам:

- count BSS,
- max RSSI,
- average QBSS util если хоть один IE 11,
- overlapping count по width.

Порог «занято» ~70% — из публичных troubleshooting basics, настройка.

---

## 6. Scanning behavior (interval, bands, permissions)

### 6.1 Режим MVP: Active scan only

`CWWiFiClient.shared().interface()` →  
`scanForNetworks(withSSID: nil, includeHidden: settings.includeHiddenSSID)`.

Поведение (публичный 802.11 + Apple forums):

- wildcard Probe Request по каналам адаптера;
- Mac **остаётся associated**, но throughput проседает — не гонять iperf во время скана;
- hidden без directed probe часто без SSID;
- 6 GHz: только если радио 6E/7; иначе PSC/RNR later;
- полный проход типично **2–5 с**; Apple dwell не документирует.

### 6.2 Интервал

```text
scanInterval = max(3.0s, lastDuration * 1.1)
```

Не чаще 3 с (публично: более частые вызовы → ошибки CoreWLAN).  
UI интервал не обещает «настраиваемый до 0.2 с».  
Setting v1: `3 | 5 | 10 | 15 s`, floor = 3.

Пока идёт scan: disable повторный Start, Stop отменяет следующий цикл (текущий `scanForNetworks` синхронный/блокирующий — гнать на background queue, UI не блокировать).

Auto-start при запуске, если Location уже granted.

### 6.3 Bands

Не фильтровать на уровне драйвера (CoreWLAN не даёт «скань только 5»).  
Фильтр band — **display**. В таблицу пишем всё, что вернул адаптер.

Видимые каналы = hardware ∩ regulatory domain. Не рисовать UNII-4/6 GHz, если их нет в результатах и `CWChannel` их не знает.

### 6.4 Merge логика

На каждый результат скана:

1. Match `bssid`.
2. Update RF + IE + `lastSeen`, `missCount = 0`.
3. Append `Sample`.
4. BSS, которых нет: `missCount++`; после 2 промахов — stale; после `forgetAfter` (default 60 s) — удалить, history дропнуть (кроме snapshot).
5. Associated: сверить `CWInterface.bssid` каждый цикл + 1 Hz poll.

SSID change на том же BSSID (редко) — обновить, не плодить строку.

### 6.5 Permissions / entitlements / signing

| Требование | Зачем |
|---|---|
| `NSLocationWhenInUseUsageDescription` | SSID/BSSID с 10.14, жёстче с 14 |
| `CLLocationManager` when-in-use | TCC prompt |
| Location Services ON + checkbox приложения | иначе пустые/redacted scan |
| Stable Developer ID + Hardened Runtime | иначе TCC «теряет» приложение |
| Не ad-hoc / не unsigned Python | BSSID часто `nil` |
| `NSLocalNetworkUsageDescription` | только later (sensors) |

Приложение **не** читает GPS для UI. Можно не держать continuous location updates после `authorized`.

Sandbox:

- Mac App Store: sandbox + Location обычно достаточно для active scan;
- monitor mode / pcap later почти наверняка **вне** sandbox / Developer ID.

Минимум ОС: **macOS 13.5** (Ventura) — практичный пол; `airport` не использовать (убит в Sequoia).

### 6.6 Ограничения железа (писать в About)

- только built-in Wi-Fi;
- 6 GHz только на 6E/7 Mac;
- Wi-Fi 7/320 MHz/MLO: OS может отдать неполные IE (`FB13078660` и аналоги — публичные feedback);
- external USB NICs — out of scope MVP.

### 6.7 Режимы, которых нет в MVP

| Mode | Суть | Когда |
|---|---|---|
| Directed | probe с конкретным SSID, ищем hidden не отключаясь | v1 |
| Passive / monitor | disconnect, channel dwell, beacon+probe, Radiotap RSSI | later; на Apple silicon ограничено |
| Remote sensor | Linux box / WLAN Pi | later |
| pcap/pcapng import | только beacon/probe в таблицу | later |

### 6.8 Ошибки скана

Показывать в status bar, не modal каждый цикл:

- `notPowered` — Wi-Fi выключен;
- `locationDenied`;
- `busy` / CoreWLAN error — backoff 5–10 с;
- `noInterface`.

---

## 7. Export / copy / annotations

### 7.1 Copy

| Команда | Результат |
|---|---|
| Copy | TSV видимых колонок выбранных строк (без swatch) |
| Copy BSSID | `A8:9D:21:74:24:3E` |
| Copy SSID | строка SSID |
| Copy Details (v1) | key-value text details pane |
| Copy IE field (v1) | имя + значение из Advanced |

### 7.2 Export CSV

`File → Export Visible / Selected / All`.

- UTF-8, header = **column ids**, не локализованные title (стабильный machine format).
- Только видимые колонки + всегда `bssid` даже если скрыт (иначе файл бесполезен).
- Signal/noise — и dBm, и %, если включён % (`signal_dbm`, `signal_percent`).
- Не тащить history в CSV (для этого snapshot).

Пример заголовка:

```text
bssid,ssid,vendor,annotation,rssi_dbm,signal_percent,channel,channel_width_mhz,band,mode,security,snr_db
```

### 7.3 Snapshot `.lv24scan`

Сохраняет BSS + history + annotations + pinned colors + app/os metadata.  
Open → read-only inspector, скан остановлен.  
Save As на stop/quit — **наш** prompt, не чужой текст.

Не использовать расширение и UTI конкурента.

### 7.4 Graph images (v1)

PNG 2x содержимого chart. Drag to Finder / Mail.

### 7.5 Annotations

- Double-click ячейки `annotation`.
- Settings: список pattern → text.
- Wildcards `*` / `?` на BSSID.
- Более длинный exact pattern побеждает `*`.
- CSV import/export **наших** колонок: `bssid_pattern,text`.
- На графиках annotation видна только если колонка видима (чтобы не шуметь).

### 7.6 Vendor DB

Бандл публичного IEEE OUI. Обновление: ручной download в Application Support. Формат кэша — наш. Не копировать чужой endpoint/S3.

---

## 8. MVP vs v1 vs later

### 8.1 MVP — «полезный сканер за один экран»

- MainWindow: toolbar, filter bar, table, Network Details, signal timeline, same-SSID + same-channel bars, Spectrum 2.4/5.
- Active scan, interval ≥ 3 с, Location onboarding.
- Default columns как в §3.1.
- Quick filters All/2.4/5/(6), Open/Secure, keyword search без keyed DSL.
- Associated status + bold row.
- SNR quality, наш dBm↔%.
- Vendor OUI из бандла.
- Security: open vs RSN basic (WPA2/WPA3 personal/enterprise, cipher).
- Annotations exact BSSID, pin color, Copy, CSV visible.
- Dark/light, full screen, persist columns/unit/filter.
- Честные `—` при отсутствии IE.

**Не в MVP:** IE tree, 6 GHz tab, snapshot file, Issues, sidebar, directed/passive, AP names, clients, pcap, sensors, column profiles.

### 8.2 v1 — «домашний / SMB analyzer»

- Spectrum 6 + 6 GHz column/filter если железо есть.
- Advanced Details: дерево стандартных IE.
- Show/hide/reorder columns, persist, auto-size.
- `.lv24scan` save/open.
- Keyed filters + AND/OR/NOT.
- Timescale, Signal/Noise/SNR modes, graph PNG.
- Issues strip с открытыми порогами.
- Wildcard annotations + CSV annotations.
- Vendor DB update.
- Directed scan по SSID.
- UNII/DFS/PSC badges, Stations/Util если BSS Load есть.
- Shortcuts §меню, `⌥L` labels.
- Наш help (RU): permissions, единицы, ограничения active scan.

### 8.3 Later — «pro», только если сами реализуем

- Passive/monitor (где OS позволяет), remote sensors, pcap/pcapng.
- Column profiles, coloring rules, группировка SSID/AP/vendor.
- Compare two BSS field-by-field.
- History inspector (min/max/avg).
- Clients — только из monitor/pcap, не обещать из active scan.
- Внешний spectrum dongle (waterfall) — отдельный hardware scope.
- BLE / Zigbee — **другие радио**, не прятать в Wi-Fi MVP.
- Wi-Fi 7 MLO (несколько links как связанные BSS).
- AP Name по публичным vendor IE (Cisco/Aruba/… — свои парсеры по публичным спецификациям).
- Windows port, MAS sandbox hardening, menu bar companion.

---

## 9. Что мы НЕ копируем

| Запрещено | Почему | Наша замена |
|---|---|---|
| Имя, логотип, иконка, splash «WiFi Explorer» / Intuitibits | бренд | `lv24-Wifi-Explorer`, своя иконка |
| Слоган, App Store/help copy, уникальные подписи осей | copyright | свой RU/EN copy |
| Pixel-clone layout, те же иконки lock/filter/gear | trade dress | HIG-native controls |
| `.wifiexplorer`, UTI конкурента | формат | `.lv24scan` |
| DSL `dot11.net.*`, 680-field autocomplete | уникальный язык | §3.4 |
| Trial «Not Activated – N Days Remaining» | чужая коммерция | своя лицензия или open |
| Скриншоты/ассеты конкурента в бандле | copyright | свои |
| Точный dBm↔% и «Accurate conversion» как их формула | неизвестный алгоритм | линейная интерполяция, концы в Settings |
| Их пороги Issues / quality copy | неизвестно / уникальный текст | §2.11 и §4.3, открыто |
| Эвристики vendor/AP-name «как у них» | неизвестно | IEEE CSV + свои парсеры |
| Passive dwell 120/60 ms как «наш секрет» из их блога | их реализация | если будем делать — свои константы + измерение |
| Колоночные профили на 550+ IE как клон Pro 3 | продукт Pro | later, свой профиль |
| Spectrum-analyzer integration брендов (Wi-Spy, WiPry) | их интеграции | later, свой hardware scope |
| Любой исходник / реверс приложения | clean room | только public docs + IEEE + Apple |

**Можно** (общественное достояние / стандарты):

- термины SSID, BSSID, RSSI, SNR, UNII, WPA2, CCMP-128, 802.11a/n/ac;
- таблицы каналов и MCS;
- IEEE OUI;
- `CoreWLAN` / `CLLocation`;
- идея «таблица + details + график канала» как класс продуктов (как «браузер с вкладками»).

---

## 10. Open questions

1. **Дистрибуция:** Mac App Store (sandbox) или Developer ID? От этого зависит later monitor mode.
2. **Min macOS:** 13.5 как у рынка или 14+ (проще про Location)?
3. **Лицензия продукта:** free / paid / open source? Нужен ли trial вообще?
4. **Локаль UI:** RU-first + EN identifiers в модели, или EN UI сразу?
5. **6 GHz в MVP:** скрыть tab полностью или заложить пустой tab?
6. **`includeHidden`:** default on или off (шум mesh/service SSID)?
7. **Ширина канала на CoreWLAN-only:** показывать `unknown`, если IE нет, или верить `CWChannelWidth`?
8. **Max Rate:** обязателен ли в MVP (нужны MCS-таблицы) или колонка hidden до v1?
9. **Noise invalid:** порог «валидный noise» (`< -20 dBm` и `< rssi`)? Иначе SNR врёт.
10. **Regulatory:** рисовать JP ch 14 / EU vs FCC 5 GHz по `countryCode` Mac или по IE BSS?
11. **Скан и сон:** останавливать на `NSWorkspace.willSleep`, стартовать на wake?
12. **Несколько окон / Spaces:** один `ScanEngine` на app или на window?
13. **Меню-бар companion:** в scope v1 или отдельное приложение?
14. **Обновление OUI:** ручное только (приватность/сеть) или авто?
15. **Тесты без эфира:** нужны ли фикстуры из **своих** сканов (не чужие pcap с водяными знаками)?
16. **MLO:** в v1 одна строка на BSSID или сразу группировка links?
17. **Имя бандла:** `by.lv24.wifi.explorer`?
18. **Сбор telemetry:** default off, согласовано?

---

## Приложение A. Реализация-ready поведение экранов

| Действие пользователя | Система |
|---|---|
| Первый запуск | Onboarding → Location prompt → если OK, auto scan |
| Location denied | PermissionBlockedView, таблица пустая |
| Start | queue scan loop ≥ 3 с |
| Stop | больше не планировать цикл; предложить Save Snapshot (v1) |
| Клик строки | selection → details + charts |
| Клик bar/hill | select соответствующий BSS |
| Band pill `5 GHz` | таблица и spectrum 2.4 скрывают 2.4 строки |
| Filter `cisco` | contains по vendor/ssid/annotation |
| Смена unit на dBm | таблица, details, Y-axis без пересчёта сырых dBm |
| Quit во время скана | stop, v1: «Сохранить сессию?» |

## Приложение B. Публичные источники (не копировать текст)

- [WiFi Explorer product](https://www.intuitibits.com/products/wifiexplorer/), [Pro 3 comparison](https://www.intuitibits.com/products/wifiexplorerpro3/)
- [Mac App Store listing](https://apps.apple.com/us/app/wifi-explorer-scanner/id494803304?mt=12)
- [docs.intuitibits.com](https://docs.intuitibits.com/) — about, columns, filters, save/export, settings, issues, shortcuts
- [Scan modes (2017)](https://www.intuitibits.com/2017/08/11/understanding-scan-modes-wifiexplorerpro/) — публичное описание active ≈ 3–5 с / interval 3 с
- [FAQ: connected = bold](https://www.intuitibits.com/faq-items/is-there-a-way-to-know-which-network-i-am-connected-to/)
- Apple `CoreWLAN` (`CWNetwork`, `CWInterface`), Developer Forums про Location/SSID
- IEEE 802.11 IE (SSID, Country, BSS Load, RSN, HT/VHT/HE), Wikipedia RSSI, Wi-Fi Alliance generational names

---

**Итог для реализации:** MVP — одно окно, active `CoreWLAN` scan, таблица BSS, details, timeline, channel occupancy, Location TCC, свой CSV и свои формулы. Всё, что требует monitor mode, чужой DSL или «550 IE columns», — не MVP и не клон.
