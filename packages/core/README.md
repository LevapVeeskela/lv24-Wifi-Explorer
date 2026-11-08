# @lv24/wifi-core

Platform-agnostic Wi-Fi scan domain used by LV24 WiFi Explorer and reusable in
any Node/browser project:

- `ObservedBss` / `EssGroup` / `ScanViewModel` models
- CoreWLAN record → domain mapping
- 802.11 Information Element decode (HT/VHT/HE/EHT/RSN/BSS Load/WPS/DTIM)
- Signal, channel, PHY, security, presence/history
- Filters, merge/ESS grouping, demo fixtures
- Issue heuristics (2.4-only, overlap, crowding, weak security, …)
- Offline pcap/pcapng import (radiotap + 802.11 beacon/probe)

No DOM, Node, Electron, or native dependencies. `TextEncoder`/`TextDecoder`
must exist in the host (browsers and Node 20+ do).

```ts
import { scan } from '@lv24/wifi-core';

const bss = scan.mapCoreWlanRecordsToObservedBss(records, undefined, capturedAt, {
  location: 'granted',
  ouiLookup: () => null,
});
```

MIT licensed.
