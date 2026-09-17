<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: 394e49f6-9239-4e33-9d80-4bf746abb648.jsonl -->

# Capability matrix

# Матрица возможностей: WiFi Explorer vs WiFi Explorer Pro 3 → lv24-Wifi-Explorer

**Источники (только публичная документация):** [About WiFi Explorer](https://docs.intuitibits.com/wifiexplorer/about.md), [About WiFi Explorer Pro 3](https://docs.intuitibits.com/wifiexplorerpro3/about.md), [продуктовая страница Pro 3](https://www.intuitibits.com/products/wifiexplorerpro3/), [release notes WiFi Explorer](https://www.intuitibits.com/release-notes/wifiexplorer/), [release notes Pro 3](https://www.intuitibits.com/release-notes/wifiexplorerpro3/), отдельные how-to на docs.intuitibits.com (scan, export, filters, inspectors, sensors, spectrum).

**Общие ограничения macOS (из FAQ и release notes):** SSID/BSSID требуют **Location Services**; сканирование только через **встроенный адаптер** и **CoreWLAN** (внешние USB Wi‑Fi — нет); видимые **band/channel** зависят от чипа Mac и regulatory domain; **Wi‑Fi 7 / channel width** на Apple Silicon могут быть неполными из‑за CoreWLAN (FB13078660); **Standard Power AP** на Sonoma+ могут отсутствовать в active scan (workaround — passive, если доступен).

**Легенда приоритета для lv24-Wifi-Explorer v1**

| Метка | Значение |
|--------|----------|
| **Must-have v1** | Минимальный паритет с WiFi Explorer (base), реализуемо на CoreWLAN active scan |
| **Nice** | Улучшение UX / Pro-lite без monitor mode |
| **Privileged / later** | Monitor mode, remote sensor, стороннее RF‑железо, listener — позже или с ограничениями на современном macOS |

---

## Capability matrix

| Группа | Capability | WiFi Explorer | WiFi Explorer Pro 3 | lv24 v1 | Комментарий |
|--------|------------|:-------------:|:-------------------:|:-------:|-------------|
| **Scan** | Active scan (probe request/response), scan while connected | ✓ | ✓ | **Must-have v1** | Единственный надёжный режим на Apple Silicon ([find-wireless-networks](https://docs.intuitibits.com/wifiexplorer/find-wireless-networks.md)) |
| **Scan** | Directed scan (probe с заданным SSID) | — | ✓ | **Nice** | Pro toolbar Scan Mode |
| **Scan** | Passive scan (monitor, beacons), All Channels / Single Channel | — | ✓ | **Privileged / later** | Отключает Wi‑Fi; **нет на M1**; нестабилен на M5/Tahoe (FB22295165); частично возвращён в новых релизах Pro 3 ([built-in adapter](https://docs.intuitibits.com/wifiexplorerpro3/find-networks-using-built-in-adapter.md)) |
| **Scan** | Remote sensor (Linux SSH: `scandump`/`tcpdump`, WLAN Pi, Android port 19000) | — | ✓ | **Privileged / later** | 6 GHz на Mac без 6E; active/passive на sensor ([connect-to-a-sensor](https://docs.intuitibits.com/wifiexplorerpro3/connect-to-a-sensor.md)) |
| **Scan** | Listener mode (PEEKREMOTE / TZSP UDP feeds) | — | ✓ | **Privileged / later** | AP в sniffer/monitor ([other scan sources](https://docs.intuitibits.com/wifiexplorerpro3/find-networks-using-other-scan-sources.md)) |
| **Scan** | Start/Stop scan, auto refresh interval (OS‑driven) | ✓ | ✓ | **Must-have v1** | Интервал задаёт адаптер, не пользователь |
| **Scan** | Hidden networks / hidden service networks toggle | ✓ | ✓ | **Must-have v1** (hidden SSID); **Nice** (service nets) | FAQ + Advanced «Include hidden service networks» |
| **Scan** | 802.11a/b/g/n/ac/ax/**be**, 20–320 MHz | ✓ | ✓ | **Must-have v1** (decoding по IE); **Nice** (be/320 полнота) | Ограничения CoreWLAN на Wi‑Fi 7 |
| **Scan** | **6 GHz** band display | ✓* | ✓* | **Must-have v1** если Mac 6E; иначе **Nice**/sensor | *«Depends on hardware»* ([about](https://docs.intuitibits.com/wifiexplorer/about.md)); 6E через remote sensor если нет 6E |
| **UI — table** | Networks Table, sortable columns | ✓ | ✓ | **Must-have v1** | |
| **UI — table** | Show/hide columns (context header) | ✓ | ✓ | **Must-have v1** | ~30 built-in columns ([show-or-hide-columns](https://docs.intuitibits.com/wifiexplorer/show-or-hide-columns.md)) |
| **UI — table** | **Column profiles** + pin + 650+ IE fields | — | ✓ (Win Pro тоже) | **Nice** (фиксированный набор v1); profiles **Nice** v1.1 | Pro ([create-and-manage-profiles](https://docs.intuitibits.com/wifiexplorerpro3/create-and-manage-profiles.md)) |
| **UI — table** | Organize by SSID / AP / AP radio / Vendor | — | ✓ | **Nice** | Pro View menu |
| **UI — table** | Multi-select + MLO highlight | — | ✓ (Win 1.2.5+) | **Nice** | Release notes Windows; Mac Pro — Wi‑Fi 7 MLO в экосистеме |
| **Filters** | Keyword filter (SSID, BSSID, channel, band, security, …) | ✓ | ✓ | **Must-have v1** | |
| **Filters** | `dot11.net.*` attribute filters, AND/OR/NOT, parentheses | ✓ «Advanced» | ✓ | **Must-have v1** (базовые); полный DSL **Nice** | Pro marketing: «Advanced» vs «Standard» |
| **Filters** | Custom filter presets + automatic filter categories | ✓ | ✓ | **Nice** | |
| **Filters** | Signal strength shortcuts (Option+0–9) | ✓ | ✓ | **Nice** | |
| **Filters** | Scan sensitivity floor (hide weak signals) | ✓ | ✓ | **Nice** | Settings > General |
| **Filters** | Filter by any IE field (Pro) | — | ✓ | **Nice** | Pro release notes 3.x |
| **Coloring** | Per-network random colors in graphs | ✓ | ✓ | **Must-have v1** | |
| **Coloring** | **Permanent network color** | ✓ | ✓ | **Nice** | [set-network-color](https://docs.intuitibits.com/wifiexplorer/set-network-color.md) |
| **Coloring** | **Coloring rules** (rule sets + filters) | — | ✓ | **Nice** | Pro only ([use-coloring-rules](https://docs.intuitibits.com/wifiexplorerpro3/use-coloring-rules.md)) |
| **Annotations** | Editable Annotations column | ✓ | ✓ | **Must-have v1** | |
| **Annotations** | Sync with WiFi Signal / iCloud | ✓ (legacy iCloud отключён в Pro) | ✓ | **Nice** | Pro 3 убрал iCloud sync prefs |
| **Connected network** | Bold row + toolbar connection details | ✓ | ✓ | **Must-have v1** | FAQ |
| **Signal / quality** | RSSI dBm and **%** mapping | ✓ | ✓ | **Must-have v1** | |
| **Signal / quality** | **Noise** column | ✓ | ✓ | **Must-have v1** | CoreWLAN |
| **Signal / quality** | **SNR** column + quality estimation | ✓ | ✓ | **Must-have v1** | [about](https://docs.intuitibits.com/wifiexplorer/about.md) |
| **Signal / quality** | **History inspector** (RSSI/noise/SNR timeline, CSV export) | частично в `.wifiexplorer` | ✓ | **Nice** (mini sparkline v1); full History **Nice** v1.1 | [History inspector](https://docs.intuitibits.com/wifiexplorerpro3/the-history-inspector.md) |
| **Graphs** | **Spectrum 2.4 / 5 GHz** channel graph | ✓ | ✓ | **Must-have v1** | Solid/dashed = infra/ad-hoc; shapes = PHY |
| **Graphs** | **Spectrum 6 GHz** graph | ✓ | ✓ | **Must-have v1** if 6 GHz visible | |
| **Graphs** | Signal Strength / Network Details views | ✓ | ✓ | **Must-have v1** | |
| **Graphs** | Hide empty band graphs | ✓ | ✓ | **Nice** | Advanced settings |
| **Graphs** | Labels: AP Name / Annotations on spectrum | ✓ | ✓ | **Nice** | |
| **Graphs** | Export graph as image (Option-drag) | ✓ | ✓ | **Nice** | Не PDF |
| **Graphs** | SSID overhead estimation | — | ✓ | **Nice** | Pro marketing feature |
| **Inspectors** | **Issues & recommendations** sidebar | ✓ | ✓ (Issues inspector) | **Must-have v1** (subset правил) | [issues-and-recommendations](https://docs.intuitibits.com/wifiexplorer/issues-and-recommendations.md) |
| **Inspectors** | **Utilization inspector** (beacon overhead, overlapping nets) | — | ✓ | **Nice** | Active: без Clients column ([Utilization](https://docs.intuitibits.com/wifiexplorerpro3/the-utilization-inspector.md)) |
| **Inspectors** | **Clients inspector** (associated STAs) | — | ✓ | **Privileged / later** | Только passive / pcap ([Clients](https://docs.intuitibits.com/wifiexplorerpro3/the-clients-inspector.md)) |
| **Inspectors** | Proximity Beacon (BLE) | — | ✓ | **Privileged / later** | Built-in BLE |
| **Inspectors** | Zigbee (USB sniffer) | — | ✓ | **Privileged / later** | MMB RapidConnect |
| **Inspectors** | Compare two networks | — | ✓ | **Nice** | |
| **Details** | Advanced Details — IE dissection | ✓ | ✓ | **Must-have v1** (core IEs); vendor IE **Nice** | AP Name vendors: Cisco, Aruba, Ubiquiti, … |
| **Details** | AP Name column (vendor IE) | ✓ | ✓ | **Nice** | Long vendor list in docs |
| **Details** | Channel Utilization / Stations (QBSS) | ✓ | ✓ | **Must-have v1** when present in scan | Active scan OK per Pro column table |
| **Export / import** | Save `.wifiexplorer` (+ history) | ✓ | ✓ | **Must-have v1** | |
| **Export / import** | Export **CSV** (visible columns; All/Displayed/Selected) | ✓ | ✓ | **Must-have v1** | Pro: non-hidden columns in active profile |
| **Export / import** | Export **PCAP/PCAPNG** | — | ✓ | **Privileged / later** | Pro ([save-and-export](https://docs.intuitibits.com/wifiexplorerpro3/save-and-export-scan-results.md)) |
| **Export / import** | Export **PDF** | — | — | **Nice** (не документировано у Intuitibits) | Только CSV + drag image graphs |
| **Export / import** | Open/import **pcap/pcapng/wcap/pkt** | — | ✓ | **Nice** v1.1 | [capture files](https://docs.intuitibits.com/wifiexplorerpro3/read-and-display-data-from-capture-files.md) |
| **Export / import** | Import **AirPort Utility** (iOS) scan (paste/AirDrop/CSV) | — | ✓ | **Nice** | BSSID, SSID, channel, RSSI, timestamp ([import external](https://docs.intuitibits.com/wifiexplorerpro3/import-data-from-external-programs.md)) |
| **Export / import** | Import Analiti / Aruba Utilities / Mobile Eye CSV | — | ✓ | **Nice** | |
| **RF / spectrum** | **Spectrum analyzer** integration (Wi-Spy, WiPry, NXT-2000, …) | — | ✓ | **Privileged / later** | Отдельное USB‑железо + optional remote via sensor ([use-a-spectrum-analyzer](https://docs.intuitibits.com/wifiexplorerpro3/use-a-spectrum-analyzer.md)) |
| **RF / spectrum** | Density / Waterfall / Live-Avg-Max traces | — | ✓ | **Privileged / later** | |
| **Platform** | External USB Wi‑Fi adapter | ✗ | ✗ | — | FAQ: CoreWLAN only built-in |
| **Platform** | Full-screen mode | ✓ | ✓ | **Nice** | |
| **Platform** | Vendor DB update (OUI) | ✓ | ✓ | **Must-have v1** | |
| **Platform** | Location Services gate | ✓ | ✓ | **Must-have v1** | Onboarding + empty state |

---

## Сравнение линейки (маркeting table, сжато)

| Capability | WiFi Explorer | WiFi Explorer Pro 3 |
|------------|:-------------:|:-------------------:|
| Scan modes | Active | Active, Directed, Passive* |
| Filtering | Standard | Advanced |
| Column profiles | — | ✓ |
| Coloring rules | — | ✓ |
| Organize by Name/AP/Vendor | — | ✓ |
| Spectrum analyzer | — | ✓ |
| Remote sensor / capture import | — | ✓ |

\*Passive: Intel Macs; ограничения M1/M5/Tahoe — см. release notes Pro 3.

---

## Open-source альтернативы (только идеи фич, без кода)

| Проект | Что позаимствовать для lv24 |
|--------|------------------------------|
| **[WaveScope](https://github.com/yurividal/WaveScope)** | Per-band **channel graph** (2.4/5/6), rolling **signal history**, rich AP metadata (security, Wi‑Fi generation, utilization), managed vs monitor **pcap** — хороший ориентир для графиков и history UI на Linux; для Mac v1 — только managed/CoreWLAN часть. |
| **[Sparrow-WiFi](https://github.com/eldog/sparrow-wifi)** | inSSIDer-like таблица, **channel utilization**, опциональный GPS/mapping, **remote agent** на rover — inspiration для будущих remote sensors, не для v1 CoreWLAN. |
| **[wifi_scanner](https://github.com/Guido-DiPilla/wifi_scanner)** (Guido-DiPilla) | `nmcli` scan loop, **channel distribution**, congestion counts, **signal sparkline**, sort/filter — компактный UX‑референс для v1 «лёгкого» analyzer. |
| **wavemon** (концепт) | TUI: непрерывный **RSSI/noise/SNR**, статистика link — inspiration для History inspector / menu bar companion, не GUI clone. |

---

## Рекомендуемый scope v1 для **lv24-Wifi-Explorer**

Цель v1: **«WiFi Explorer (base) на CoreWLAN»** — стабильный домашний/офисный sanity check, без monitor mode и без железа.

### Must-have v1 (MVP)

1. **Active scan** через CoreWLAN; Start/Stop; **Location Services** onboarding.
2. **Networks Table**: SSID, BSSID, Vendor (OUI DB), Band, Channel, Channel Width, Security, Mode/Generation, Signal, Noise, **SNR**, First/Last Seen, Type; show/hide columns.
3. **Connected network**: bold row + status strip (SSID, BSSID, channel, RSSI, security).
4. **Filter bar**: keywords + channel ranges + band + security + `>=-65` RSSI; опционально простые `dot11.net.*` сравнения.
5. **Spectrum views**: 2.4/5 (+ **6 GHz** если `CWNetwork`/`CoreWLAN` отдаёт); подсветка выбранной сети; базовая легенда (infra vs ad-hoc).
6. **Network Details** + **Advanced Details** (decode основных IE: HT/VHT/HE/EHT где доступны, RSN, Country).
7. **Annotations** (persist локально).
8. **Issues sidebar** — первые 5–7 правил из документации (overlap 2.4, weak security, low RSSI, too many on channel, 40 MHz in 2.4, hidden, 2.4-only).
9. **Save** `.wifiexplorer` (или свой формат) + **Export CSV** (visible columns; All/Displayed/Selected).
10. **Hidden SSID** networks; scan sensitivity setting.

### Nice (сразу после v1 или v1.1)

- Permanent **network colors**; hide empty graphs; vendor logos.
- **Custom filters** presets; signal keyboard shortcuts.
- **Import AirPort Utility** text/CSV (полевая совместимость с Pro).
- Mini **signal sparkline** для выбранной сети (WaveScope / wifi_scanner pattern).
- Column **profiles** (1 default + 1 custom) без 650 IE fields.
- Drag **PNG** из графиков.

### Privileged / later (не v1)

- **Passive / directed** scan, **Clients inspector**, **Utilization inspector** с client counts.
- **Remote sensors**, listener PEEKREMOTE/TZSP, **pcap import/export**.
- **Coloring rules**, organize-by-AP/vendor, SSID overhead, compare networks.
- **Spectrum analyzers** (Wi-Spy, WiPry, …), Zigbee/BLE inspectors.
- **6 GHz** на Mac без 6E только через remote sensor (как у Intuitibits).

### Риски для планирования lv24

- Не обещать **Wi‑Fi 7 / MLO / 320 MHz** точность на всех macOS версиях — следовать ограничениям CoreWLAN из release notes.
- Не обещать **client discovery** и **non-802.11 interference** без monitor mode или RF‑dongle.
- **PDF export** — опциональная фича lv24; у Intuitibits в публичных гайдах не фигурирует (есть CSV + image export).

---

Если нужно, могу следующим шагом разложить Must-have v1 в backlog по экранам/модулям (ScanEngine, NetworksTable, SpectrumView, Persistence) без привязки к коду Intuitibits.

[REDACTED]
