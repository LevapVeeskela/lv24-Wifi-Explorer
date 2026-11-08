/**
 * Demo-снимки для unsigned/dev без Location: несколько BSS, не коммерческий дамп.
 */

import type { CoreWlanNetworkRecord } from '../../domain/bss';
import type { CoreWlanChannelBand, CoreWlanChannelWidth } from '../../domain/channel';
import type { PhyLetter } from '../../domain/phy';
import type { SecurityKind } from '../../domain/security';
import type { ScanSnapshot } from '../../domain/scan';
import type { ScanFilter } from '../../domain/filters';
import { SCAN_FILTER_DEFAULTS } from '../../domain/filters';
import { asIsoTime } from '../identity';
import { mapCoreWlanRecordsToObservedBss } from '../mapObservedBss';
import { mergeSnapshots } from '../mergeSnapshots';
import type { MapObservedBssOptions } from '../mapObservedBss';

export const DEMO_CAPTURED_AT = asIsoTime('2026-09-17T19:00:00.000Z');
export const DEMO_INTERFACE = 'en0';

export function tlv(id: number, payload: readonly number[]): number[] {
  return [id, payload.length, ...payload];
}

/** HT Capabilities: MCS 0–7 на каждый SS → nssHint. */
export function htCapabilitiesIe(nss: 1 | 2 | 3 | 4): number[] {
  const mcs = new Array(16).fill(0);
  for (let i = 0; i < nss; i += 1) mcs[i] = 0xff;
  return tlv(45, [0x00, 0x00, 0x00, ...mcs]);
}

export function htOperationIe(primary: number, secondary: -1 | 0 | 1): number[] {
  const offsetBits = secondary === 1 ? 1 : secondary === -1 ? 3 : 0;
  return tlv(61, [primary, offsetBits]);
}

export function vhtCapabilitiesIe(nss: 1 | 2 | 3 | 4 | 8): number[] {
  let rx = 0;
  for (let i = 0; i < 8; i += 1) {
    const bits = i < nss ? 2 : 3;
    rx |= bits << (i * 2);
  }
  const lo = rx & 0xff;
  const hi = (rx >> 8) & 0xff;
  return tlv(191, [0, 0, 0, 0, lo, hi, 0, 0, lo, hi, 0, 0]);
}

/** VHT Operation: width 1 = 80 МГц, ccfs0 — центр сегмента. */
export function vhtOperationIe(ccfs0: number, widthCode = 1): number[] {
  return tlv(192, [widthCode, ccfs0, 0]);
}

export function rsnIe(): number[] {
  return tlv(48, [0x01, 0x00]);
}

export function countryIe(code = 'RU'): number[] {
  return tlv(7, [code.charCodeAt(0), code.charCodeAt(1), 0x20]);
}

export function wpaVendorIe(): number[] {
  return tlv(221, [0x00, 0x50, 0xf2, 0x01, 0x01, 0x00]);
}

function raw(partial: {
  ssid: string | null;
  ssidData?: readonly number[] | null;
  bssid: string | null;
  rssiDbm: number;
  noiseDbm: number;
  channelNumber: number;
  channelBand: CoreWlanChannelBand;
  channelWidth: CoreWlanChannelWidth;
  countryCode?: string | null;
  beaconIntervalMs?: number;
  ibss?: boolean;
  informationElementData?: readonly number[] | null;
  supportedSecurity: readonly SecurityKind[];
  supportedPhyModes: readonly PhyLetter[];
}): CoreWlanNetworkRecord {
  const ssidData =
    partial.ssidData !== undefined
      ? partial.ssidData
      : partial.ssid != null
        ? [...new TextEncoder().encode(partial.ssid)]
        : null;
  return {
    ssid: partial.ssid,
    ssidData,
    bssid: partial.bssid,
    rssiDbm: partial.rssiDbm,
    noiseDbm: partial.noiseDbm,
    channelNumber: partial.channelNumber,
    channelBand: partial.channelBand,
    channelWidth: partial.channelWidth,
    countryCode: partial.countryCode === undefined ? 'RU' : partial.countryCode,
    beaconIntervalMs: partial.beaconIntervalMs ?? 100,
    ibss: partial.ibss ?? false,
    informationElementData: partial.informationElementData ?? null,
    supportedSecurity: partial.supportedSecurity,
    supportedPhyModes: partial.supportedPhyModes,
  };
}

const campusIe80 = [
  ...countryIe(),
  ...rsnIe(),
  ...htCapabilitiesIe(2),
  ...htOperationIe(36, 1),
  ...vhtCapabilitiesIe(2),
  ...vhtOperationIe(42),
];

const campusIe20 = [...countryIe(), ...rsnIe(), ...htCapabilitiesIe(1)];

/** Один SSID, три BSSID (2.4 / 5-20 / 5-80). */
export const DEMO_CAMPUS_24 = raw({
  ssid: 'LV24-Campus',
  bssid: '00:11:22:01:00:01',
  rssiDbm: -62,
  noiseDbm: -92,
  channelNumber: 6,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['b', 'g', 'n'],
  informationElementData: campusIe20,
});

export const DEMO_CAMPUS_5_20 = raw({
  ssid: 'LV24-Campus',
  bssid: '00:11:22:01:00:02',
  rssiDbm: -55,
  noiseDbm: -95,
  channelNumber: 36,
  channelBand: '5ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['a', 'n', 'ac'],
  informationElementData: campusIe20,
});

export const DEMO_CAMPUS_5_80 = raw({
  ssid: 'LV24-Campus',
  bssid: '00:11:22:01:00:03',
  rssiDbm: -48,
  noiseDbm: -94,
  channelNumber: 36,
  channelBand: '5ghz',
  channelWidth: '80mhz',
  supportedSecurity: ['wpa2-personal', 'wpa3-personal', 'wpa3-transition'],
  supportedPhyModes: ['a', 'n', 'ac', 'ax'],
  informationElementData: campusIe80,
});

/** Две скрытые сети — разные BSSID, не сливать. */
export const DEMO_HIDDEN_A = raw({
  ssid: '',
  ssidData: [],
  bssid: '00:11:22:99:00:01',
  rssiDbm: -70,
  noiseDbm: -91,
  channelNumber: 11,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['b', 'g', 'n'],
});

export const DEMO_HIDDEN_B = raw({
  ssid: '',
  ssidData: [],
  bssid: '00:11:22:99:00:02',
  rssiDbm: -74,
  noiseDbm: -90,
  channelNumber: 44,
  channelBand: '5ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['a', 'n', 'ac'],
});

export const DEMO_IBSS = raw({
  ssid: 'Adhoc-Cam',
  bssid: '00:11:22:ab:00:01',
  rssiDbm: -66,
  noiseDbm: -89,
  channelNumber: 1,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  ibss: true,
  supportedSecurity: ['open'],
  supportedPhyModes: ['g'],
});

export const DEMO_OPEN = raw({
  ssid: 'Cafe-Free',
  bssid: '00:11:22:0e:00:01',
  rssiDbm: -71,
  noiseDbm: -93,
  channelNumber: 11,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['open'],
  supportedPhyModes: ['b', 'g', 'n'],
});

export const DEMO_WPA3_6GHZ = raw({
  ssid: 'Lab-6GHz',
  bssid: '00:11:22:06:00:01',
  rssiDbm: -58,
  noiseDbm: -97,
  channelNumber: 5,
  channelBand: '6ghz',
  channelWidth: '80mhz',
  supportedSecurity: ['wpa3-personal'],
  supportedPhyModes: ['a', 'n', 'ac', 'ax'],
  informationElementData: [...countryIe('US'), ...rsnIe()],
});

/** U/L bit = 1 → randomized, без organization. */
export const DEMO_RANDOMIZED = raw({
  ssid: 'Phone-Hotspot',
  bssid: '02:11:22:33:44:55',
  rssiDbm: -64,
  noiseDbm: -88,
  channelNumber: 6,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['b', 'g', 'n'],
});

/** noise=0 — невалидный замер, SNR нет. */
export const DEMO_MISSING_NOISE = raw({
  ssid: 'Noisy-Unknown',
  bssid: '00:11:22:a0:00:01',
  rssiDbm: -73,
  noiseDbm: 0,
  channelNumber: 40,
  channelBand: '5ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wpa2-personal'],
  supportedPhyModes: ['a', 'n'],
});

export const DEMO_WEP = raw({
  ssid: 'Old-Router',
  bssid: '00:11:22:fe:00:01',
  rssiDbm: -80,
  noiseDbm: -91,
  channelNumber: 1,
  channelBand: '2ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['wep'],
  supportedPhyModes: ['b', 'g'],
  informationElementData: wpaVendorIe(),
});

export const DEMO_OWE = raw({
  ssid: 'Open-Roam',
  bssid: '00:11:22:0e:00:02',
  rssiDbm: -69,
  noiseDbm: -94,
  channelNumber: 36,
  channelBand: '5ghz',
  channelWidth: '20mhz',
  supportedSecurity: ['owe'],
  supportedPhyModes: ['a', 'n', 'ac', 'ax'],
  informationElementData: rsnIe(),
});

export const DEMO_RAW_NETWORKS: readonly CoreWlanNetworkRecord[] = [
  DEMO_CAMPUS_24,
  DEMO_CAMPUS_5_20,
  DEMO_CAMPUS_5_80,
  DEMO_HIDDEN_A,
  DEMO_HIDDEN_B,
  DEMO_IBSS,
  DEMO_OPEN,
  DEMO_WPA3_6GHZ,
  DEMO_RANDOMIZED,
  DEMO_MISSING_NOISE,
  DEMO_WEP,
  DEMO_OWE,
];

export function buildDemoSnapshot(
  records: readonly CoreWlanNetworkRecord[] = DEMO_RAW_NETWORKS,
  capturedAt = DEMO_CAPTURED_AT,
  options: MapObservedBssOptions = { location: 'granted' }
): ScanSnapshot {
  return {
    capturedAt,
    interfaceName: DEMO_INTERFACE,
    location: options.location ?? 'granted',
    networks: mapCoreWlanRecordsToObservedBss(records, undefined, capturedAt, options),
    associated: null,
    includeHiddenRequested: true,
  };
}

export function buildDemoView(
  filter: ScanFilter = SCAN_FILTER_DEFAULTS,
  records: readonly CoreWlanNetworkRecord[] = DEMO_RAW_NETWORKS
) {
  return mergeSnapshots(null, buildDemoSnapshot(records), filter);
}

/** Демо-ассоциация: самый сильный campus 5/80. */
export const DEMO_CONNECTED_BSSID = DEMO_CAMPUS_5_80.bssid as string;
