# scan_domain

Clean-room Dart library for the LV24 WiFi Explorer scan domain: BSS identity, signal metrics, scan merge policy, ESS grouping, channel occupancy visualization, v1 issue heuristics, and public-scan Information Element decode (`buildIeTree`).

Ported from the Electron/TypeScript domain layer (`src/domain/` and scan issue evaluators). This package does **not** depend on Flutter or CoreWLAN bindings.

## Concepts

| Concept | Rule |
|--------|------|
| **BSS identity** | Match key prefers normalized **BSSID**; anonymous fallback uses `ssidData` octets + channel + band + IBSS. |
| **ESS** | Group infrastructure BSS by **ssidData** (`ess:<octetHex>`). Hidden → one group per BSSID; IBSS → separate keys. |
| **Signal** | SNR = RSSI − noise (dBm). Noise `0` or outside −120…−20 is invalid. Quality tiers use SNR (40/25/15/10 dB) or RSSI fallback. Bar % is linear −100…−50 dBm. |
| **Merge** | `missCount ≥ 2` → stale; `missCount ≥ 3` or **60 s** since `lastSeenAt` → disappeared. RSSI is not cleared on miss. |
| **Occupancy** | Heuristic chart score (`visualization-not-cca`), **not** CCA/airtime. |
| **Issues** | Keys include `lowSignal`, `overlap24`, `hiddenSsid`, plus `width40on24`, `crowdedChannel`, `lowSnr`, `weakSecurity`, `legacyOnly`, `highUtil`, `dfs`. |
| **IE** | Shallow TLV decode of public scan IEs (SSID, rates, TIM, country, BSS Load, Power Constraint, HT/VHT/HE/EHT, RSN, WPA vendor, Ext Caps, RSNX). Unknown tags stay id + hex. No monitor/pcap/deep vendor. |

## Usage

```dart
import 'package:scan_domain/scan_domain.dart';

final view = computeSignalView(-55, -90);
final issues = evaluateIssues(scanIssueBss, neighbors);
final groups = groupEss(bssRows);
final bars = computeBandOccupancy(bssRows, WifiBand.ghz24, selectedChannel: 6);
```

## Tests

```bash
cd packages/scan_domain
dart pub get
dart test
```

## License

Same as the parent LV24 WiFi Explorer repository.
