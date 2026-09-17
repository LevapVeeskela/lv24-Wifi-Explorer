/**
 * Компактная фабрика ObservedBss для доменных тестов.
 */

import type { CoreWlanNetworkRecord, ObservedBss } from './bss';
import type { BandGhz, ChannelWidthMhz, CoreWlanChannelBand, CoreWlanChannelWidth } from './channel';
import { computeChannelView } from './channel';
import type { IsoTime } from './identity';
import {
  asBssid,
  asIsoTime,
  asSsidOctetHex,
  normalizeBssid,
  octetHexOf,
} from './identity';
import type { SecurityKind } from './security';
import { computeSignalView } from './signal';
import type { Presence } from './timeseries';
import { isRandomizedMac, ouiFromBssid, vendorFlagsFromBssid } from './vendor';

export interface MakeBssInput {
  bssid?: string | null;
  ssid?: string;
  hidden?: boolean;
  ibss?: boolean;
  rssiDbm?: number;
  noiseDbm?: number;
  band?: BandGhz | 'unknown';
  channel?: number;
  widthMhz?: ChannelWidthMhz | 'unknown';
  security?: 'open' | 'secure' | SecurityKind;
  vendorOrganization?: string | null;
  presence?: Presence;
  firstSeenAt?: string;
  lastSeenAt?: string;
  consecutiveMisses?: number;
  capturedAt?: string;
}

function bandToCore(band: BandGhz | 'unknown'): CoreWlanChannelBand {
  if (band === 2.4) return '2ghz';
  if (band === 5) return '5ghz';
  if (band === 6) return '6ghz';
  return 'unknown';
}

function widthToCore(width: ChannelWidthMhz | 'unknown'): CoreWlanChannelWidth {
  if (width === 20) return '20mhz';
  if (width === 40) return '40mhz';
  if (width === 80) return '80mhz';
  if (width === 160) return '160mhz';
  return 'unknown';
}

function securityOf(kind: MakeBssInput['security']): {
  flags: SecurityKind[];
  primary: SecurityKind;
  isOpen: boolean;
  isSecure: boolean;
} {
  if (kind === 'open' || kind === undefined) {
    return { flags: ['open'], primary: 'open', isOpen: true, isSecure: false };
  }
  const primary: SecurityKind = kind === 'secure' ? 'wpa2-personal' : kind;
  return { flags: [primary], primary, isOpen: false, isSecure: true };
}

/** Собрать ObservedBss с derived signal/channel/vendor. */
export function makeObservedBss(input: MakeBssInput = {}): ObservedBss {
  const capturedAt = asIsoTime(input.capturedAt ?? input.lastSeenAt ?? '2026-09-17T19:00:00.000Z');
  const firstSeenAt = asIsoTime(input.firstSeenAt ?? capturedAt);
  const lastSeenAt = asIsoTime(input.lastSeenAt ?? capturedAt);
  const bssidRaw = input.bssid === undefined ? '00:11:22:33:44:55' : input.bssid;
  const hidden = input.hidden === true || input.ssid === '';
  const ssidText = hidden ? '' : (input.ssid ?? 'TestNet');
  const octets = hidden ? [] : [...new TextEncoder().encode(ssidText)];
  const octetHex = octetHexOf(octets);
  const band = input.band ?? 2.4;
  const channelNumber = input.channel ?? 6;
  const widthMhz = input.widthMhz ?? 20;
  const rssiDbm = input.rssiDbm ?? -50;
  const noiseDbm = input.noiseDbm ?? -90;
  const signal = computeSignalView(rssiDbm, noiseDbm);
  const channel = computeChannelView(
    channelNumber,
    bandToCore(band),
    widthToCore(widthMhz),
  );
  const sec = securityOf(input.security);
  const bssidNorm = normalizeBssid(bssidRaw);
  const flags = bssidNorm ? vendorFlagsFromBssid(bssidNorm) : {
    oui: null,
    locallyAdministered: false,
    multicast: false,
    match: 'bssid-redacted' as const,
  };

  const lastRaw: CoreWlanNetworkRecord = {
    ssid: hidden ? null : ssidText,
    ssidData: octets,
    bssid: bssidRaw,
    rssiDbm,
    noiseDbm,
    channelNumber,
    channelBand: bandToCore(band),
    channelWidth: widthToCore(widthMhz),
    countryCode: 'RU',
    beaconIntervalMs: 100,
    ibss: input.ibss === true,
    informationElementData: null,
    supportedSecurity: sec.flags,
    supportedPhyModes: ['n'],
  };

  return {
    identity: {
      bssid: bssidNorm
        ? { status: 'available', value: asBssid(bssidNorm) }
        : { status: 'redacted', reason: 'location-required' },
      ssid: {
        status: 'available',
        value: {
          utf8: hidden ? '' : ssidText,
          octets,
          octetHex,
          hidden,
          displayName: hidden ? '<hidden>' : ssidText,
        },
      },
    },
    ibss: input.ibss === true,
    countryCode: { status: 'available', value: 'RU' },
    beaconIntervalMs: 100,
    signal,
    channel,
    security: {
      flags: sec.flags,
      primary: sec.primary,
      authClass: sec.isOpen ? 'open' : 'personal',
      isOpen: sec.isOpen,
      isSecure: sec.isSecure,
      ieHint: 'none',
    },
    phy: {
      supported: ['n'],
      highest: 'n',
      display: 'n' as ObservedBss['phy']['display'],
      source: 'api-supportsPHYMode',
    },
    maxRate: null,
    vendor: {
      oui: flags.oui ?? (bssidNorm ? ouiFromBssid(bssidNorm) : null),
      locallyAdministered: flags.locallyAdministered,
      multicast: flags.multicast,
      organization:
        flags.match === 'randomized' || isRandomizedMac(bssidNorm ?? '')
          ? null
          : (input.vendorOrganization ?? null),
      match: flags.match,
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
      firstSeenAt,
      lastSeenAt,
      lastMissingAt: null,
      consecutiveMisses: input.consecutiveMisses ?? 0,
      presence: input.presence ?? 'current',
    },
    rssiHistory: [
      {
        at: capturedAt,
        rssiDbm: signal.rssiDbm,
        noiseDbm: signal.noiseDbm,
        snrDb: signal.snrDb,
        channelNumber,
      },
    ],
    lastRaw,
  };
}

export function iso(value: string): IsoTime {
  return asIsoTime(value);
}

export function asSsidHex(text: string) {
  return asSsidOctetHex(octetHexOf([...new TextEncoder().encode(text)]));
}
