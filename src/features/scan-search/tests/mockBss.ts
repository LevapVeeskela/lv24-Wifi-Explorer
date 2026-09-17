import type { ObservedBss } from '../../../domain/bss';
import type { BandGhz } from '../../../domain/channel';
import type { PhyLetter } from '../../../domain/phy';
import type { SecurityKind } from '../../../domain/security';

type MockBssInput = {
  bssid: string;
  ssid?: string | null;
  hidden?: boolean;
  rssiDbm?: number;
  noiseDbm?: number | null;
  channel?: number;
  band?: BandGhz | 'unknown';
  widthMhz?: 20 | 40 | 80 | 160 | 'unknown';
  securityFlags?: readonly SecurityKind[];
  isOpen?: boolean;
  isSecure?: boolean;
  vendor?: string | null;
  phy?: readonly PhyLetter[];
  country?: string | null;
};

function ssidIdentity(ssid: string | null, hidden: boolean) {
  const octets = hidden || ssid == null ? [] : [...new TextEncoder().encode(ssid)];
  const octetHex = octets.map((b) => b.toString(16).padStart(2, '0')).join('') as never;
  return {
    utf8: hidden ? null : ssid,
    octets,
    octetHex,
    hidden,
    displayName: hidden ? '<hidden>' : (ssid ?? ''),
  };
}

export function mockBss(input: MockBssInput): ObservedBss {
  const hidden = input.hidden ?? false;
  const ssid = hidden ? '' : (input.ssid ?? 'TestNet');
  const flags = input.securityFlags ?? ['wpa2-personal'];
  const phyModes = input.phy ?? ['n', 'ac'];
  const noise = input.noiseDbm === undefined ? -92 : input.noiseDbm;
  const snrDb = noise != null ? (input.rssiDbm ?? -60) - noise : null;

  return {
    identity: {
      bssid: { status: 'available', value: input.bssid as never },
      ssid: { status: 'available', value: ssidIdentity(ssid, hidden) },
    },
    ibss: false,
    countryCode:
      input.country != null
        ? { status: 'available', value: input.country }
        : { status: 'available', value: 'US' },
    beaconIntervalMs: 100,
    signal: {
      rssiDbm: input.rssiDbm ?? -60,
      noiseDbm: noise,
      snrDb,
      quality: 'good',
      qualityBasis: snrDb != null ? 'snr' : 'rssi-fallback',
    },
    channel: {
      number: input.channel ?? 36,
      band: input.band ?? 5,
      widthMhz: input.widthMhz ?? 20,
      primaryCenterMhz: 5180,
      occupyingCenterMhz: 5180,
      occupyingSpanMhz: { from: 5170, to: 5190 },
      centerConfidence: 'ieee-primary-20',
    },
    security: {
      flags,
      primary: flags[0] ?? 'unknown',
      authClass: input.isOpen ? 'open' : 'personal',
      isOpen: input.isOpen ?? false,
      isSecure: input.isSecure ?? true,
      ieHint: 'none',
    },
    phy: {
      supported: phyModes,
      highest: phyModes[phyModes.length - 1] ?? null,
      display: phyModes.join('/') as never,
      source: 'api-supportsPHYMode',
    },
    maxRate: null,
    vendor: {
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: input.vendor ?? 'Cisco Systems',
      match: 'ieee-mal-24',
      registryFile: null,
    },
    ie: {
      level: 'absent',
      byteLength: 0,
      presentIds: [],
      wpaVendorIe: null,
      rsnIe: null,
      htCapabilities: null,
      vhtCapabilities: null,
      heCapabilities: null,
      ehtCapabilities: null,
      countryFromIe: null,
      nssHint: null,
      htPrimaryChannel: null,
      htSecondaryOffset: null,
      ccfs0: null,
    },
    presence: {
      firstSeenAt: '2026-01-01T00:00:00.000Z' as never,
      lastSeenAt: '2026-01-01T00:00:00.000Z' as never,
      lastMissingAt: null,
      consecutiveMisses: 0,
      presence: 'current',
    },
    rssiHistory: [],
    lastRaw: {} as never,
  };
}
