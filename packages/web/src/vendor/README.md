# `src/vendor` — IEEE MA-L lookup

Clean-room implementation. Public API:

```ts
import { lookupVendor } from './lookup';
import { loadOuiRegistry } from './load-registry.mjs';

const registry = loadOuiRegistry(); // sets the default map
lookupVendor('00:17:f2:aa:bb:cc'); // → VendorView
```

| `match`          | When                                         |
| ---------------- | -------------------------------------------- |
| `bssid-redacted` | no BSSID / Location gated                    |
| `randomized`     | U/L bit set; `organization` is always `null` |
| `ieee-mal-24`    | first three octets in the local MA-L file    |
| `unknown`        | globally administered, not in the 24-bit map |

`VendorView.multicast` is the I/G bit (informational).

**Do not treat a 24-bit hit as MA-M/MA-S.** Those registries are 28/36 bits; several assignees can share one MA-L prefix (often listed as `IEEE Registration Authority`). See `data/oui/README.md`.

```bash
node src/vendor/refresh-oui.mjs
node --test src/vendor/lookup.test.mjs
```
