# lv24-Wifi-Explorer — план реализации

Анализ завершён. Исходники домена уже лежат в `src/domain`. Это **оригинальное** приложение: clean-room, без копирования Wi‑Fi Explorer.app / nibs / VendorDatabase / `.wifiexplorer`.

## Источник правды

| Слой | Источник |
|---|---|
| Типы данных, derived, unsupported | `src/domain/**` |
| Продукт v1 | `docs/research/product-spec.md` |
| UI | `docs/research/ui-spec.md` |
| Возможности | `docs/research/capability-matrix.md` |
| ScanCore | `docs/research/scancore-architecture.md` |
| MUI / тема | `docs/research/mui-playbook.md` |
| Electron-донор | `docs/research/electron-donor.md` |

## Разрешённые конфликты спеки

1. **Presence:** `PRESENCE_POLICY` в домене — stale после 1 пропуска, disappeared после 3. Не «missCount 2».
2. **Снимок файла:** `.lv24scan` (не `.wifiexplorer`, не `.lv24wifi`).
3. **Bundle / appId:** `by.lv24.wifi.explorer`.
4. **Имя пакета:** `lv24-wifi-explorer`. **productName:** `LV24 WiFi Explorer`. Папка репо: `lv24-Wifi-Explorer`.
5. **Качество сигнала:** ярлыки `excellent|good|fair|poor|unusable`, **не процент**. RSSI/noise в dBm.
6. **Issues:** маленькая своя эвристика в v1 (overlap, weak security, low RSSI, crowded, 40 MHz on 2.4, hidden, 2.4-only). Не клонировать чужой engine.
7. **OUI:** только локальный IEEE MA-L. Не трогать `VendorDatabase.framework`.
8. **MUI:** Material 9.2.0; paid X = Data Grid Pro + `@mui/x-license` **8.11.0 only**. Charts/date-pickers/tree — Community. Не bump paid X до 9.
9. **Лицензия MUI:** `VITE_MUI_LICENSE_KEY` из city `lv24/main/frontend/.env.local` → локальный `.env.local` (gitignore). Не печатать и не коммитить ключ.
10. **GitHub:** не создавать remote, пока нет рабочего каркаса. `git init` может упасть из‑за Xcode license.
11. **Off-limits:** `/Applications/WiFi Explorer.app`, DMG, `~/Library/Application Support/WiFi Explorer`, prefs, decompile.

## Стек

- Electron 33.2.1 + electron-builder 25.1.8 + Vite 8.1 + React 19.2.8
- Донор оболочки: GitHub `LevapVeeskela/lv24-desktop-cv` (cherry-pick main/preload/window/CSP; **не** клонировать домен/SQLite/auth)
- Тема/шрифты: Sunset из `/Users/veeskela/Projects/lv24/main/frontend/src/shared/lib/theme/`
- License bootstrap: `/Users/veeskela/Projects/IMS/main/frontend/src/shared/lib/mui/license.ts`
- Scan: signed Swift `native/ScanCore` (CoreWLAN + CoreLocation), JSON Lines
- Интервал скана: `max(3s, lastDuration * 1.1)`
- Demo-режим обязателен (unsigned dev без Location)

## Карта файлов (не пересекаться)

| Владелец | Пути |
|---|---|
| Scaffold | `package.json`, lockfile, `electron/`, `vite.config.*`, корневые `tsconfig*`, `index.html`, `src/main.tsx`, `src/app/`, entitlements, `electron-builder*`, `.gitignore`, `.env.example`, `README.md` |
| ScanCore | `native/ScanCore/**` |
| Mappers | `src/scan/**` (+ тесты). Доменные **типы** не ломать |
| OUI | `data/oui/**`, `src/vendor/**` |
| UI | `src/pages/**`, `src/widgets/**`, `src/features/**`, `src/entities/**`, `src/shared/ui/**` |

Не переписывать `src/domain/*.ts` без согласования. Добавлять реализации рядом.
