# IEEE OUI registry (MA-L)

Bundled vendor lookup for 24-bit Organizationally Unique Identifiers from the public [IEEE OUI CSV](https://standards-oui.ieee.org/oui/oui.csv).

| File            | Purpose                                                        |
| --------------- | -------------------------------------------------------------- |
| `registry.json` | Prefix → organization map consumed by `src/shared/lib/oui`     |
| `meta.json`     | Build metadata (`source`, `generatedAt`, `entryCount`)         |
| `ieee-mal.csv`  | Last downloaded IEEE file (present after a successful refresh) |

## Refresh

From the repository root (Node ≥ 20, no extra npm deps — see `scripts/oui-DEPS.txt`):

```bash
node scripts/build-oui.mjs
```

If the download fails (offline CI, firewall), the script writes a **small curated subset** (Apple, Cisco, MikroTik/Routerboard, TP-Link, Ubiquiti, Netgear, Huawei, etc.) and sets `meta.source` to `curated-fallback`.

Only **MA-L** rows are imported. MA-M and MA-S are skipped because 24-bit prefix lookup is ambiguous for those assignment sizes.

## Runtime notes

- BSSIDs with the **locally administered (U/L)** bit set are treated as **randomized**; no vendor is returned.
- Unknown universal OUIs yield `vendor: null` and `source: "unknown"`.
