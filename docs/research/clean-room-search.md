<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: 550b3965-63b0-4746-88f4-91b210fd5a82.jsonl -->

# Clean-room source search

## Verdict

**There is no user-owned or open-source Wi-Fi scanner source on this machine.** Nothing to clone or reuse for `lv24-Wifi-Explorer`.

What exists is a **licensed commercial Intuitibits WiFi Explorer 3.6.9 install** plus installer, prefs, trial license files, and screenshots. Treat all of that as **off-limits for copy**. Use it only as a **clean-room feature checklist**.

`lv24` in Projects is the **city platform** (IMS/LV24.by), not a Wi-Fi app. No `lv24-Wifi-Explorer` tree exists yet.

---

## Every relevant path

### Commercial product — **DO NOT COPY**

| Path | What it is |
|---|---|
| `/Applications/WiFi Explorer.app` | Installed **Mach-O universal binary** (x86_64 + arm64). Bundle ID `wifiexplorer`, version **3.6.9** (build 80), min macOS **13.5**. Copyright Intuitibits LLC 2012–2026. Sparkle updates from `https://www.intuitibits.com/`. Paddle licensing. **No `.swift` / `.m` / `.c` source in the bundle.** |
| `/Applications/WiFi Explorer.app/Contents/MacOS/WiFi Explorer` | Main executable. **Must not be decompiled, class-dumped, or reused.** |
| `/Applications/WiFi Explorer.app/Contents/Resources/` | Nibs, lproj strings, PDF print templates, icons, `demo.bin` (binary plist sample scan), `vendors.zip` (proprietary OUI/vendor DB), `dot11.net.plist`. **Assets + DBs must not be copied.** |
| `/Applications/WiFi Explorer.app/Contents/Frameworks/` | `Paddle.framework`, `Sparkle.framework`, `VendorDatabase.framework`. Third-party/commercial. **Do not link or copy.** |
| `/Users/veeskela/Downloads/WiFiExplorer_3.6.9.dmg` | Official installer (~8 MB, dated 2026-09-15). **Do not unpack for source.** |

No `_MASReceipt` — this is a **direct/Paddle** copy, not MAS-extracted source. No WiFi Explorer Pro app, Airtool, NetSpot, iStumbler, inSSIDer, wavemon, or Kismet installs.

### User data / license / caches — not source, do not copy

| Path | What it is |
|---|---|
| `/Users/veeskela/Library/Application Support/WiFi Explorer/501956.padl` | Paddle license blob |
| `/Users/veeskela/Library/Application Support/WiFi Explorer/501956.spadl` | Paddle sidecar |
| `/Users/veeskela/Library/Preferences/wifiexplorer.plist` | UI prefs (columns, split views, filters, trial). First launch **2026-09-15**, last version 80, **2 launches**. `Experimental6GHzSupport = false`. |
| `/Users/veeskela/Library/Caches/wifiexplorer/` | HTTP cache DB |
| `/Users/veeskela/Library/HTTPStorages/wifiexplorer` (+ `.binarycookies`) | Network cache |
| `/Users/veeskela/Library/Application Scripts/2B9R362QNU.com.intuitibits` | Empty App Group scripts dir |
| `/Users/veeskela/Library/Application Scripts/2B9R362QNU.com.adriangranados.wifiexplorer` | Empty |
| `/Users/veeskela/Library/Group Containers/2B9R362QNU.com.intuitibits` | Empty |
| `/Users/veeskela/Library/Group Containers/2B9R362QNU.com.adriangranados.wifiexplorer` | Empty |

No saved `*.wifiexplorer` or `*.filterlist` files under Desktop / Documents / Downloads / Projects.

### Screenshots (UI only — inspiration, not assets)

| Path | What it is |
|---|---|
| `/Users/veeskela/Desktop/Снимок экрана — 2026-09-17 в 22.12.44.png` | User screenshot of **WiFi Explorer** (trial: “Not Activated – 5 Days Remaining”) |
| `/Users/veeskela/.cursor/projects/Users-veeskela-Projects/assets/image-756df449-e552-4992-b734-5b4ebe4e97ab.png` | Same UI, attached to this chat |
| `/Users/veeskela/Desktop/Снимок экрана — 2026-09-17 в 21.51.30.png` | **Unrelated** Windows “open .sh with…” dialog |

### Searched, confidently empty for scanner source

- `/Users/veeskela/Projects` — **zero** files named wifi / WLAN / CoreWLAN / airport / wlanscan; **zero** hits for `CWWiFiClient`, `CWInterface`, `CWNetwork`, `CoreWLAN`, `system_profiler SPAirPortDataType`, `wdutil` in user code
- `/Users/veeskela/Projects/IMS`, `lv24`, `lv24-identity`, `ferrum-enterprise` — no Wi-Fi scanner
- `/Users/veeskela/Desktop`, `Documents`, `Downloads` (aside from the DMG + screenshots)
- `/Users/veeskela/scripts`, `orca` — agent/RDP helpers only
- No `src` / `code` / `dev` / `github` / `Developer` trees under home
- No Homebrew wifi formulas/casks
- No Ghidra / Hopper / class-dump / reversed trees
- No iCloud / CloudStorage / Dropbox clones
- Bookmarks export has no Intuitibits/wifi-scanner links (from this search)
- Engram memory: no prior wifi-scanner decisions

`lv24` grep hits are **city-platform** notes (copy IMS shape from LV24, venue “wifi” amenity, “airport” as transit). Irrelevant.

### System tools (not project source)

| Path | Note |
|---|---|
| `/usr/bin/wdutil` | Present |
| `airport` CLI | **Not found** (typical on current macOS) |
| `/System/Applications/Utilities/AirPort Utility.app` | Apple AP manager, not a scanner and not reusable |

---

## High-level feature list (public UI only)

From **Info.plist keywords**, **English menu/localizable labels**, **nib names**, and **the user’s screenshots**. This is a capability list, not an implementation spec. Do not copy strings, icons, layout, or column order.

**Product framing (their marketing string):** scan, troubleshoot, and monitor wireless networks. Location Services required.

**Main chrome (screenshot + menus)**
- Live scan / stop; status shows connected SSID + channel / band / width / PHY rate
- Band chips: All / 2.4 GHz / 5 GHz (6 GHz exists in strings; prefs have `Experimental6GHzSupport`)
- Open / Secure filters; search (“Filter”)
- Dense sortable table + optional coloring / “show colors”
- Sidebar organize-by: name, access point, AP radio, AP vendor
- Automatic filters + custom filters (BSSID wildcards `*` / `?`); apply cell as filter / negate / column
- Profiles (import/export/reset); column chooser; annotations
- Coloring rule sets (import/export)
- Graphs pane toggle; inspectors pane toggle
- Save / Open / Open Recent native scan documents (`.wifiexplorer`); **invent our own format**
- Export all / displayed / selected; Print (PDF templates in the app — do not reuse)
- Compare two networks (incl. information elements)
- Trial / license / Sparkle update (we should not clone Paddle)

**Table columns they expose (names only)**  
SSID, BSSID, vendor (OUI), annotations, security, RSSI (+ min/avg/max + bar), noise (+ min/avg/max), SNR (+ min/avg/max), channel, channel center, center frequency, width, band, PHY mode, generation, country code, max/min rates, basic rates, streams, network type, first/last seen, device name, WPS, MFP, 802.11r, HT protection, BSS color, Hotspot 2.0 / HESSID, mesh, DTIM, beacon interval/rate/airtime/mode, IE count/length, channel utilization, client/station counts, uptime, Cisco CCX fields, amendments, plus history-*, client-*, BLE-*, Zigbee-*, iBeacon-* columns.

**Detail tabs (screenshot)**
- Network Details: SSID, BSSID, vendor, signal quality, RSSI, band/UNII, PHY, max rate, channel, noise, type, security, encryption, width, SNR
- Signal Strength (RSSI timeline; 5-minute default in prefs)
- Spectrum 2.4 / 5 GHz (and a 6 GHz spectrum view in menus)
- Advanced Details
- Separate graph: Signal, Signal and Noise, Signal-to-Noise Ratio; channel occupancy bars

**Inspectors (menu labels)**  
Issues, History, Clients, Utilization, Proximity Beacon, Zigbee (needs extra adapter).

**Issues heuristics (title keys only)**  
2.4 GHz only; 40 MHz on 2.4; hidden SSID; large group; legacy equipment; low signal; overlapping channel; separate names per band; too many networks; weak security.

**Advanced / extra (strings only — many need extra hardware or remote sensors)**  
Remote sensors + `scandump`; Passive Scan Engine; USB/remote spectrum analyzer; BLE columns; Zigbee scan; iBeacon fields; vendor-DB auto-update.

**Settings nibs**  
General, Filters, Columns, Annotations, Profiles, Advanced.

**Languages shipped:** en, es, fr, it, pt (plus Sparkle’s settings bundle).

---

## Recommended approach

**Clean-room original app. No reusable user code.**

1. Write an original spec from this feature list + public Intuitibits docs + the screenshots. New name, new IA, new column set, new file format, new icons.
2. Implement against **public macOS APIs** (`CoreWLAN` / `CWWiFiClient`, Core Location). `airport` is gone here; `wdutil` is a system binary — use only if still documented and sufficient, never private `IO80211` reverse-engineering of their app.
3. OUI vendors: **IEEE public MA-L/MA-M**, not `vendors.zip` / `VendorDatabase.framework`.
4. **Do not** copy nibs, strings files, PDF templates, `demo.bin`, graphs, or their `.wifiexplorer` / `.filterlist` formats.
5. **v1 (matches what the user actually uses in the screenshots):** live scan table (SSID/BSSID/vendor/security/RSSI/channel/width/band/PHY), band + security + text filters, details pane, RSSI history, 2.4/5 GHz channel bars, CSV export, Location permission. Defer sensors, PSE, spectrum hardware, Zigbee, BLE, clients/monitor mode, Issues engine, Pro-like inspectors.

Family note: Projects has **no desktop Wi-Fi stack**. `ferrum-enterprise` is a Rust BSL runtime. `lv24` is Nest/Vite city web. Docs mention an old LV24 Electron **parser** desktop — not present as a wifi scanner and not a reason to copy WiFi Explorer.

If someone later drops Hopper/Ghidra output or unpacked app source into the tree: **ignore it and keep the clean-room path.**
