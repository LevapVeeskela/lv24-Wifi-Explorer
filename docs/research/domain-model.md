<!-- Extracted from clean-room research. Do not copy Intuitibits assets, binaries, or unique copy. -->
<!-- Source: abc8e980-7bd6-4581-836b-6e5aba977162.jsonl -->

# 802.11 domain model

Clean-room TypeScript domain types are in `/Users/veeskela/Projects/lv24-Wifi-Explorer/src/domain` (types only, `tsc --noEmit` clean). Source of truth is public CoreWLAN headers on this Mac, not Wi-Fi Explorer.

## Model

**Atom = BSS**, not SSID. `CWNetwork` is one radio (BSSID + primary channel). Same SSID on many BSSID is an **ESS group**.

| Layer    | Type                             | Role                                                                 |
| -------- | -------------------------------- | -------------------------------------------------------------------- |
| API 1:1  | `CoreWlanNetworkRecord`          | Raw `CWNetwork` + `supportsSecurity:` / `supportsPHYMode:`           |
| Row      | `ObservedBss`                    | API + derived + approximations                                       |
| Group    | `EssGroup`                       | Same visible `ssidData`, many BSSID                                  |
| Frame    | `ScanSnapshot` → `ScanViewModel` | Cycle + history merge + filters                                      |
| Own link | `AssociatedLink`                 | `transmitRate` / `activePHYMode` — **only** the associated interface |

**ESS keys**

- visible → `ess:<ssidOctetHex>` (bands and security may mix)
- hidden → `hidden-bss:<bssid>` (empty SSIDs are **not** merged)
- IBSS → `ibss:<octetHex>:<bssid>`

SSID / BSSID / countryCode are `LocationGated<T>` (`CWNetwork` docs: Location Services required).

`CWNetwork` has **no** single `security` / `phyMode`. Probe `supportsSecurity:` and `supportsPHYMode:`. `CWInterface.security` is association-only.

## Derived vs approximation

| Metric                 | Rule                                                                                                                                                              |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **SNR**                | `rssi − noise` (derived). Drop noise outside −120…−20 (0 is often “no sample”).                                                                                   |
| **Quality**            | Heuristic: SNR 40/25/15/10, else RSSI −50/−60/−70/−80. **Not** a percent.                                                                                         |
| **Band**               | `CWChannelBand` → `2.4 \| 5 \| 6`                                                                                                                                 |
| **Primary center MHz** | 2.4: `2407+5n` (ch14=2484); 5: `5000+5n`; 6: `5950+5n`                                                                                                            |
| **Occupying center**   | = primary if 20 MHz; if 40/80/160 without HT/VHT/HE Operation IE → standard-layout **guess**                                                                      |
| **PHY string**         | Join advertised flags: `g/n`, `a/n/ac/ax` — not current MCS                                                                                                       |
| **Max rate**           | Range only: 1 SS + long GI ceiling by PHY×width. `mbpsHigh` only if NSS from IE. Never a fake “866.7”. No EHT/320 estimate (`CWChannelWidth` has no 320 / 80+80). |
| **Vendor**             | First 3 octets → local IEEE **MA-L** file. U/L bit set → `randomized`, no org. MA-M/MA-S are ambiguous at 24 bits.                                                |
| **Presence**           | `lastSeen` = our snapshot. `stale` after 1 miss, `disappeared` after 3. Not “AP powered off”.                                                                     |

## Filters (`ScanFilter`)

`bands` · `open` = `kCWSecurityNone` only (OWE/WEP count as secure) · `ssidQuery` · `vendorQuery` · `minRssiDbm` / `minSnrDb` · presence · IBSS/hidden toggles.

## Field availability

| Field                                        | Source             | CoreWLAN                 | Loc | Notes                                           |
| -------------------------------------------- | ------------------ | ------------------------ | --- | ----------------------------------------------- |
| `ssid` / `ssidData`                          | API                | `ssid`, `ssidData`       | yes | 0–32 octets                                     |
| `bssid`                                      | API                | `bssid`                  | yes | `xx:xx:xx:xx:xx:xx`                             |
| ESS grouping                                 | derived            | —                        | yes | by `ssidData`; hidden/IBSS isolated             |
| `ibss`                                       | API                | `ibss`                   |     |                                                 |
| `rssi`                                       | API                | `rssiValue`              |     | dBm                                             |
| `noise`                                      | API                | `noiseMeasurement`       |     | treat 0 as invalid                              |
| `snr`                                        | derived            | —                        |     | rssi−noise                                      |
| quality label                                | **approx**         | —                        |     | UI heuristic                                    |
| `channel.number`                             | API                | `channelNumber`          |     | primary                                         |
| `channel.band`                               | API                | `channelBand`            |     | 2.4/5/6                                         |
| `channel.width`                              | API                | `channelWidth`           |     | 20/40/80/160 / unknown                          |
| primary center MHz                           | derived            | —                        |     | IEEE 20 MHz                                     |
| occupying center MHz                         | **approx**         | —                        |     | need Operation IE for truth                     |
| security flags                               | API                | `supportsSecurity:`      |     | set, not one enum                               |
| open/secure, primary                         | derived            | —                        |     | rank in `SECURITY_PRIMARY_RANK`                 |
| WPA/RSN detail                               | **approx**         | `informationElementData` |     | tags 48 / 221-WPA if present                    |
| PHY letters / string                         | API                | `supportsPHYMode:`       |     | advertised only                                 |
| max rate                                     | **approx**         | —                        |     | 1SS long-GI ceiling                             |
| `countryCode`                                | API                | `countryCode`            | yes | ISO 3166-1                                      |
| `beaconInterval`                             | API                | `beaconInterval`         |     | ms, often 100                                   |
| IE bytes                                     | API                | `informationElementData` |     | often nil/truncated                             |
| IE shallow tags                              | **approx**         | same                     |     | TLV + known IDs only                            |
| vendor / OUI                                 | **local-registry** | —                        | yes | IEEE MA-L file                                  |
| RSSI history                                 | derived            | —                        |     | our points                                      |
| lastSeen / stale                             | derived            | —                        |     | scan-miss policy                                |
| `transmitRate` / `activePHYMode` / `txPower` | API                | `CWInterface`            |     | **associated link only**                        |
| spectrum / FFT / PSD                         | **unsupported**    | —                        |     | needs specialized radio                         |
| per-channel utilization / CCA                | **unsupported**    | —                        |     | needs monitor mode; do not infer from BSS count |
| hidden IE deep parse                         | **unsupported**    | partial IE               |     | RNR/FILS/vendor/EHT-320                         |
| STA list / airtime / per-packet MCS          | **unsupported**    | —                        |     | frame capture                                   |
| 80+80, 320 MHz                               | **unsupported**    | not in `CWChannelWidth`  |     |                                                 |

Full rows: `availability.ts` (`FIELD_AVAILABILITY`) and `scan.ts` (`UNSUPPORTED_WITHOUT_MONITOR`).

## Files

`identity.ts` · `channel.ts` · `security.ts` · `phy.ts` · `signal.ts` · `vendor.ts` · `ie.ts` · `timeseries.ts` · `bss.ts` · `ess.ts` · `filters.ts` · `scan.ts` · `availability.ts` · `index.ts`

English identifiers, Russian JSDoc. No app, no mapper implementation. Project folder exists; `git init` failed (Xcode license).
