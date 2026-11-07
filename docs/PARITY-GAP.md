# Parity gap — what LV24 v1 deliberately does not do

This document sets expectations vs. full-featured commercial Wi‑Fi analyzers. LV24 targets **active CoreWLAN scan + honest UI**, not hardware spectrum tools or monitor-mode suites.

---

## 1. Not in v1 (explicit)

| Capability | Status | Notes |
|------------|--------|--------|
| **RF spectrum / FFT waterfall** | ❌ | No Wi‑Spy / WiPry-style spectrum; “Spectrum” tabs are **channel occupancy bars** from scan table, not FFT |
| **Client / station list** | ❌ | Active scan does not enumerate associated clients; no `stations` from air unless BSS Load IE (optional field) |
| **Passive / monitor mode** | ❌ | No disconnect-and-dwell, no Radiotap capture on Apple STA |
| **Remote sensors** | ❌ | No WLAN Pi / Linux remote probe integration |
| **pcap / pcapng import** | ❌ | Later optional: beacon/probe parse into table |
| **Directed hidden scan** | ⏳ v1+ | Probe specific SSID without full product parity |
| **USB external Wi‑Fi adapters** | ❌ | Built-in interface only (typically `en0`) |
| **IO80211 private APIs** | ❌ | Clean room: CoreWLAN only |

---

## 2. UI features deferred or reduced

| Feature | v1 expectation |
|---------|----------------|
| Sidebar auto-filters (Issues, vendors, …) | Later |
| 550+ per-IE columns | Later; shallow IE + Advanced tree in v1 |
| Column profiles / coloring rules | Later |
| Compare two BSS field-by-field | Later |
| Branded spectrum-analyzer hardware integrations | Out of scope unless we ship our own scope |
| Competitor file formats (`.wifiexplorer`, UTI) | Never — use `.lv24scan` |

---

## 3. Data fidelity limits (macOS STA)

Even with Location granted and signed builds:

- **Noise** often invalid (`0` or out of range) → SNR falls back to RSSI quality tiers.
- **6 GHz** only if hardware + OS report 6E channels.
- **Max rate / streams / UNII** depend on IE decode depth; missing IE → `—`.
- **Channel width** may be incomplete from CoreWLAN alone.
- **Throughput impact:** frequent active scan can reduce link performance during scan (document in help).

These are platform limits, not LV24 bugs.

---

## 4. What v1 does provide (summary)

- Periodic **active scan** with ≥ 3 s pacing
- **BSS table** with OUI vendor, security/PHY from IE + CoreWLAN
- **Associated link** summary (Tx rate from interface only)
- **Signal history**, same-SSID and same-channel occupancy charts
- **Issues** heuristics (open thresholds — see `docs/SPEC.md`)
- **`.lv24scan`** snapshot format (LV24-owned)
- **Demo mode** for unsigned / permission-blocked development

---

## 5. Roadmap bucket (later, no commitment)

- Passive/monitor where Apple allows on specific hardware
- pcap import, remote sensors, client analytics
- UNII/DFS/PSC badges, directed scan polish
- Electron Windows / Linux live scan — **still demo-only** (no WLAN adapter in Electron; not macOS ScanCore). Flutter already has Linux NM `GetAccessPoints` and Windows associated-link; those do **not** apply to Electron.
- Flutter Windows nearby-BSS / MSIX `wifiControl` (out of v1; associated-link only today)

For architecture fallbacks when live data is partial, see `docs/ARCHITECTURE.md` §5 (tiers A–F).

---

## 6. Flutter Windows — not a site survey

Flutter Windows v1 is a **connected-network inspector + demo**, not macOS ScanCore and not a nearby-BSS survey.

| Capability | Status | Notes |
|------------|--------|--------|
| Nearby BSS list with BSSID/channel/IEs | ❌ | `WlanGetAvailableNetworkList` is SSID-aggregated; **not** workbench rows |
| Associated SSID, BSSID, PHY, security | ✓ | `WlanQueryInterface` current connection |
| RSSI | ⚠ | Documented quality→RSSI only (0 → −100 dBm, 100 → −50 dBm) |
| Channel | ❌ | Unknown on the associated link |
| WinRT `WiFiAdapter` / MSIX `wifiControl` | ❌ | Unpackaged Flutter; typically denied; still no IEs |
| Monitor mode / NDIS / private APIs | ❌ | Clean room |

No association → **demo fixtures** (same honesty as iOS). Factory routes `Platform.isWindows` to [`flutter/lib/features/windows_scan/`](../flutter/lib/features/windows_scan/). These are platform limits, not LV24 bugs.
