# Windows live-scan audit — 2026-11-10

Scope: does an installed/packaged Windows build show **real** Wi-Fi networks and
real parameters, or silently fall back to fixtures/defaults?

Environment: Windows 11 24H2, Russian locale, Intel Wi-Fi 7 BE200. The interface
was disabled in Windows, but `netsh wlan show networks` still listed 11 visible
BSSes, so the provider path could be exercised.

## Verdict

**The live path is real, but until this audit the Windows parser silently
fabricated parameters on localized Windows.** SSID/BSSID were real; RSSI,
channel, security and PHY were defaults because the parser only matched English
field labels. The desktop reported `demo: false`, so the UI presented those
defaults as live data.

## Evidence before the fix

`netsh wlan show networks mode=bssid` on this machine:

```text
SSID 1: ZTE-ac9888
    Проверка подлинности:     WPA2-Personal
    Шифрование:               CCMP
    BSSID 1                 : 30:0c:23:ac:98:88
         Сигнал             : 57%
         Тип радио         : 802.11n
         Канал            : 1
```

`node packages/cli/dist/main.js scan --provider windows-netsh --format json`
returned:

```json
{
  "ssid": "ZTE-ac9888",
  "bssid": "30:0c:23:ac:98:88",
  "rssiDbm": -100,
  "channelNumber": null,
  "channelBand": "unknown",
  "supportedSecurity": ["open"],
  "supportedPhyModes": []
}
```

Cause: `packages/backend/src/providers/windows.ts` used English-only regexes
(`signal:`, `channel:`, `radio type:`, `authentication:`, `encryption:`). On
Russian Windows only `SSID`/`BSSID` match, so:

- signal stayed `0` → `rssiFromQualityPercent(0)` = **-100 dBm**;
- channel stayed `null`;
- empty security label → `securityFromLabel('')` = **open** (false security);
- radio stayed empty → no PHY.

`noiseDbm: 0` and `beaconIntervalMs: 100` were also hard-coded, although
`netsh` provides neither.

## Fix

- Parse values by shape, not by localized labels: percentage line, bare integer
  channel line, `802.11x` token, and the whole SSID block for security.
- Open/none detection now covers English, Russian and Chinese labels.
- A BSS entry without a parsable signal is **dropped**; if none remain, the
  provider emits `NETSH_PARSE_EMPTY` with `demoFallback: true`, so the desktop
  shows the labelled demo fallback instead of fake -100 dBm rows.
- Missing noise/beacon are `NaN` in the raw record (serialized as `null`), not
  invented `0`/`100`.
- Added a Russian `netsh` fixture and regression tests.

## Evidence after the fix

```text
provider=windows-netsh
ZTE-ac9888 | 30:0c:23:ac:98:88 | -67dBm | ch=1 | 2ghz | wpa2-personal | n
byfly WIFI | 62:0c:23:ac:98:89 | -66dBm | ch=1 | 2ghz | open | n
byfly WIFI | 72:0c:23:ad:8d:db | -65dBm | ch=11 | 2ghz | open | n
WLAN_5G_1C18 | 3c:46:45:49:1c:1d | -57dBm | ch=52 | 5ghz | wpa2-personal | ac
```

Checks: `yarn test` 431 passed / 1 skipped; `yarn typecheck` passed;
`winget validate` unaffected.

## Final installer verification (CI run 42795953257)

The Windows NSIS installer built from `83ea72f` was installed over the old build
(`/S /currentuser`, exit 0) and launched with remote debugging. Result: **10 real
networks**, `ScanCore: ок`, `Геолокация: разрешена`, no demo rows. At a 1366×768
viewport the footer is 58 px tall, `footer.scrollWidth == footer.clientWidth`, and
`document.scrollWidth == 1366` (no page scrollbar). The extracted exe icon is the
LV24 tile, not the Electron default.

The installer was built with `upload=false`; the v1.0.1 release is the first
public build that ships this fix (the v1.0.0 assets keep the old parser and are
left in place for reproducibility).

## Public release verification (v1.0.2, CI run 42800540386)

`LV24-WiFi-Explorer-1.0.2-win-x64.exe` (SHA-256 `5099cf70…a702`, matching
`SHA256SUMS.txt` and the GitHub asset digest) installed over 1.0.1 with
`/S /currentuser` (exit 0). The packaged app reported `v1.0.2` in the status bar
and the About dialog, found live networks (`live_ssids=true`,
`demo_markers=false`, `ScanCore: ок`, `Геолокация: разрешена`), and kept the
footer at 58 px with `footer.scrollWidth == footer.clientWidth` and
`document.scrollWidth == 1366`. At 960 px the footer is 77 px and the document
still has no horizontal scrollbar.

v1.0.1 showed `1.0.0` in the UI because `APP_VERSION` was hardcoded; v1.0.2
injects it from the root `package.json` through Vite (`__APP_VERSION__`) and
guards it with `constants.test.ts`. The v1.0.1 assets stay published but are
superseded.

## Residual findings

1. ~~The public release still contains the old parser.~~ Fixed by v1.0.1
   (release workflow run 42798744194) and shipped again in v1.0.2. The v1.0.0
   assets are intentionally not replaced: uploading to another tag keeps the old
   URLs and hashes valid.
2. `interfaceName` and `associated` are still `null` for netsh (the provider does
   not parse `netsh wlan show interfaces`).
3. `ibss` is always `false`; Ad-Hoc networks are not distinguished.
4. `channelWidth`, IEs, country code and 6 GHz edge cases are unknown by design
   on Windows; the UI shows them as unavailable.
5. `ingestScanPayload` returns a demo view for a malformed payload without
   setting the demo state, so a malformed live payload could show unlabelled
   fixture rows. Not triggered by the current netsh payload; separate fix.
6. `normalizeScanCoreSnapshot`/`snapshotNormalize` still default missing RSSI to
   `0` and missing security to `open` for ScanCore-shaped rows (macOS path).
7. Other Windows locales (French/German/Japanese) parse signal/channel/radio
   structurally, but their open-network wording is not covered; secured WPA2/WPA3
   labels are language-neutral, so they remain correct.

## Packaged IPC trust (found during installer verification)

The first CI installer contained the parser fix, but the installed app stayed in
demo mode: every `window.wifiExplorer` call returned
`{ ok: false, error: "untrusted-sender" }`. `isTrustedRendererUrl` used
`path.resolve(parsed.pathname)`; on Windows a file URL pathname is `/C:/...`, so
it became `C:\C:\...` and never matched the asar `dist` directory. Fixed with
`fileURLToPath()` in `packages/desktop/src/main.ts`.

After replacing the installed `app.asar` with a pack of the current
`dist`/`dist-electron`, the same installed exe showed **8 real networks**,
`ScanCore: ок`, no demo rows. A final installer containing this fix is required.

## GUI verification (development build)

Before the installer run, the renderer was loaded from `vite preview` with the
current `dist-electron/main.js` and inspected over the Chrome DevTools Protocol.
After `scanStart()` the page showed:

```text
Все (13) · 2,4 ГГц (12) · 5 ГГц (1)
Каналы: 1 (5), 2 (1), 5 (2), 6 (1), 11 (3), 52 (1)
Защита: Открытые (4), Защищённые (9)
ScanCore: ок
Сетей: 13
```

The rendered rows included `WLAN_2.4G_1C18` (92%, channel 5), `BELTELECOM_public`
(90%, channel 5), `WLAN_5G_1C18` (5 GHz, channel 52) and live RSSI/channel
values. No `LV24-Demo` rows or demo badge were present
(`live_ssids=true demo_markers=false`).

## Footer and page overflow

The footer was clipped because `StatusBar` had `maxHeight: 32` and
`overflow: hidden`. It now wraps its two clusters (`flexWrap`, no max height);
at 1366×768 the footer is 58 px tall with all values visible, and at the 960 px
minimum width it is 77 px tall. The page no longer gets a horizontal scrollbar:
the chart's visually hidden accessibility table (`position: absolute`, unset
width) was 1349 px wide and pushed `document.scrollWidth` to 2314. It now has
`left/top: 0`, `maxWidth/maxHeight: 1`, `clip` and `clipPath: inset(50%)`.

## How to re-verify after a new build

```powershell
netsh wlan show networks mode=bssid
node packages/cli/dist/main.js scan --provider windows-netsh --format json
node packages/cli/dist/main.js scan --provider demo --format json   # fixture contrast
```

Compare SSID/BSSID/RSSI/channel/security with the `netsh` output. A live result
must have `provider: "windows-netsh"`, `source: "netsh"`, `demo: false`, and real
`rssiDbm`/`channelNumber`/`supportedSecurity` values.
