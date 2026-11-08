import type { ObservedBss } from '@/domain/bss';
import { asBssid, asIsoTime, asSsidOctetHex } from '@/domain/identity';

export function fixtureBss(bssid: string, ssid: string): ObservedBss {
  const at = asIsoTime('2026-09-17T19:00:00.000Z');
  const octets = [...new TextEncoder().encode(ssid)];
  return {
    identity: {
      bssid: { status: 'available', value: asBssid(bssid) },
      ssid: {
        status: 'available',
        value: {
          utf8: ssid,
          octets,
          octetHex: asSsidOctetHex(octets.map((b) => b.toString(16).padStart(2, '0')).join('')),
          hidden: false,
          displayName: ssid,
        },
      },
    },
    ibss: false,
    countryCode: { status: 'available', value: 'RU' },
    beaconIntervalMs: 100,
    signal: {
      rssiDbm: -55,
      noiseDbm: -92,
      snrDb: 37,
      quality: 'good',
      qualityBasis: 'snr',
    },
    channel: {
      number: 36,
      band: 5,
      widthMhz: 80,
      primaryCenterMhz: 5180,
      occupyingCenterMhz: 5210,
      occupyingSpanMhz: { from: 5170, to: 5250 },
      centerConfidence: 'ieee-primary-20',
    },
    security: {
      flags: ['wpa2-personal'],
      primary: 'wpa2-personal',
      authClass: 'personal',
      isOpen: false,
      isSecure: true,
      ieHint: 'none',
    },
    phy: {
      supported: ['n', 'ac'],
      highest: 'ac',
      display: 'n/ac' as ObservedBss['phy']['display'],
      source: 'api-supportsPHYMode',
    },
    maxRate: null,
    vendor: {
      oui: null,
      locallyAdministered: false,
      multicast: false,
      organization: 'Example',
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
      firstSeenAt: at,
      lastSeenAt: at,
      lastMissingAt: null,
      consecutiveMisses: 0,
      presence: 'current',
    },
    rssiHistory: [
      { at, rssiDbm: -55, noiseDbm: -92, snrDb: 37, channelNumber: 36 },
      {
        at: asIsoTime('2026-09-17T19:00:08.000Z'),
        rssiDbm: -57,
        noiseDbm: -92,
        snrDb: 35,
        channelNumber: 36,
      },
    ],
    lastRaw: {
      ssid,
      ssidData: octets,
      bssid,
      rssiDbm: -55,
      noiseDbm: -92,
      channelNumber: 36,
      channelBand: '5ghz',
      channelWidth: '80mhz',
      countryCode: 'RU',
      beaconIntervalMs: 100,
      ibss: false,
      informationElementData: null,
      supportedSecurity: ['wpa2-personal'],
      supportedPhyModes: ['n', 'ac'],
    },
  };
}
