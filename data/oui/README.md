# IEEE MA-L (24-bit) local registry

Clean-room vendor lookup for LV24 WiFi Explorer. This directory holds the **public IEEE Registration Authority MA-L listing** only. It is not a copy of any commercial Wi-Fi scanner vendor database.

## Files

| File | Role |
|---|---|
| `ieee-mal.csv` | Official IEEE MA-L public listing (UTF-8 CSV), if a refresh succeeded |
| `ieee-mal.txt` | Official text listing (written only if CSV is unavailable) |
| `ieee-mal.sample.csv` | Tiny committed subset for offline / failed-download fallback |
| `meta.json` | `format`, `fileName`, `generatedAt`, source URL, entry count |

Refresh (Node; do not use `python3` — Xcode license breaks it on this machine):

```bash
node src/vendor/refresh-oui.mjs
```

Official sources (IEEE RA public listing, updated about once per day):

- https://standards-oui.ieee.org/oui/oui.csv
- https://standards-oui.ieee.org/oui/oui.txt

See also: [IEEE SA Registration Authority](https://standards.ieee.org/products-programs/regauth/).

## Precision limit: MA-M and MA-S

**This map is 24-bit (MA-L / historical OUI) only.**

| IEEE product | Prefix length | In this file? |
|---|---|---|
| MA-L (OUI) | 24 bits | yes |
| MA-M | 28 bits | **no** |
| MA-S (OUI-36) | 36 bits | **no** |

A hit on the first three octets is **not** full IEEE registry precision:

- MA-M and MA-S blocks share a 24-bit prefix with an IEEE Registration Authority CID / delegated assignment (often listed here as `IEEE Registration Authority`). Those 24 bits do **not** name the organization that owns the 28- or 36-bit block.
- Distinct companies can share the same first three octets when they hold MA-M or MA-S space under that prefix.
- v1 therefore reports `match: 'ieee-mal-24'` and must not claim MA-M/MA-S identity.

Do not merge MA-M/MA-S listings into this 24-bit `Map`. That would pretend the prefix is unique when it is not.

## MAC bits (not a vendor)

IEEE EUI-48 first octet (conventional software bit order):

- **I/G** — least significant bit. `1` = multicast / group. Noted on `VendorView.multicast`. Rare for a BSSID.
- **U/L** — second least significant bit. `1` = locally administered. Treated as **randomized**; `organization` is always `null` (privacy MACs, not a manufacturer).

Globally administered unicast addresses are looked up in the MA-L map. Miss → `unknown`. Missing / location-redacted BSSID → `bssid-redacted`.
