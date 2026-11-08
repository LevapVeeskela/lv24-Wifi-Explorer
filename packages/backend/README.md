# @lv24/wifi-backend

Cross-platform Wi-Fi scan providers with one event API:

| Provider         | OS          | Source                                                 |
| ---------------- | ----------- | ------------------------------------------------------ |
| `macos-scancore` | macOS 13.5+ | bundled universal Swift helper (CoreWLAN, Location)    |
| `linux-nmcli`    | Linux       | NetworkManager `nmcli` (RSSI derived from quality)     |
| `windows-netsh`  | Windows     | `netsh wlan show networks mode=bssid` (English output) |
| `demo`           | everywhere  | deterministic fixtures                                 |

```ts
import { createScanProvider } from '@lv24/wifi-backend';

const provider = createScanProvider({ provider: 'auto' });
provider.onEvent((event) => {
  if (event.type === 'snapshot') console.log(event.payload.networks.length);
});
await provider.start({ intervalMs: 5000, includeHidden: true });
```

Truthfulness: Linux/Windows do not expose IEs or BSS-level RSSI; the provider
emits `channelWidth: 'unknown'`, `informationElementData: null` and documents
the RSSI derivation. No private APIs, monitor mode, or client enumeration.

MIT licensed.

## macOS real SSID/BSSID

TCC only grants Location to a helper with a stable code signature. The build
script signs with the first Apple Development / Developer ID identity it finds
(override with `CODESIGN_IDENTITY=...`); an ad-hoc signature yields RF-only
rows with redacted identity. On first launch macOS asks for Location once for
`ScanCore` — approve it, then real names/BSSIDs appear.
